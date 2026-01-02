import { FastifyInstance } from 'fastify';

/**
 * Price Service with Crypto.com MCP as primary and CoinGecko as fallback
 *
 * Integrates with Crypto.com Market Data MCP Server for real-time pricing
 * Falls back to CoinGecko API if MCP is unavailable
 */

// Singleton instance
let priceServiceInstance: PriceService | null = null;

export function initializePriceService(server: FastifyInstance): void {
  priceServiceInstance = new PriceService(server.log);
  server.log.info('[PriceService] Initialized with Crypto.com MCP + CoinGecko fallback');
}

export function getPriceService(): PriceService {
  if (!priceServiceInstance) {
    throw new Error('PriceService not initialized. Call initializePriceService first.');
  }
  return priceServiceInstance;
}

export class PriceService {
  // Crypto.com MCP endpoint
  private readonly CRYPTO_COM_MCP_URL = 'https://mcp.crypto.com/market-data/mcp';

  // Price cache: Map<"BASE/QUOTE", { price, expires, source }>
  private priceCache = new Map<string, { price: number; expires: number; source: string }>();
  private readonly PRICE_CACHE_TTL = 60000; // 60 seconds
  private readonly FETCH_TIMEOUT = 5000; // 5 seconds

  // Coin ID mappings for different APIs
  private readonly coinIds: Record<string, { coingecko: string; cryptocom: string }> = {
    CRO: { coingecko: 'cronos', cryptocom: 'CRO' },
    ETH: { coingecko: 'ethereum', cryptocom: 'ETH' },
    BTC: { coingecko: 'bitcoin', cryptocom: 'BTC' },
    USDC: { coingecko: 'usd-coin', cryptocom: 'USDC' },
    USDT: { coingecko: 'tether', cryptocom: 'USDT' },
  };

  constructor(private logger: FastifyInstance['log']) {}

  /**
   * Fetch current price with Crypto.com MCP as primary, CoinGecko as fallback
   */
  async fetchPrice(base: string, quote: string): Promise<{ price: number; source: string }> {
    const cacheKey = `${base}/${quote}`;
    const cached = this.priceCache.get(cacheKey);

    // Check cache validity
    if (cached && cached.expires > Date.now()) {
      this.logger.debug({ cacheKey, price: cached.price, source: cached.source }, '[PriceService] Cache hit');
      return { price: cached.price, source: cached.source };
    }

    // Try Crypto.com MCP first
    try {
      const price = await this.fetchFromCryptoComMCP(base, quote);
      this.cachePrice(cacheKey, price, 'crypto.com-mcp');
      return { price, source: 'crypto.com-mcp' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn({ error: errorMessage }, '[PriceService] Crypto.com MCP failed, trying CoinGecko fallback');
    }

    // Fallback to CoinGecko
    try {
      const price = await this.fetchFromCoinGecko(base, quote);
      this.cachePrice(cacheKey, price, 'coingecko');
      return { price, source: 'coingecko' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: errorMessage }, '[PriceService] Both price sources failed');
      throw new PriceServiceError(`Failed to fetch price for ${base}/${quote} from all sources`);
    }
  }

  /**
   * Fetch price from Crypto.com Market Data MCP Server
   * Uses JSON-RPC 2.0 protocol
   */
  private async fetchFromCryptoComMCP(base: string, quote: string): Promise<number> {
    const symbol = this.coinIds[base.toUpperCase()]?.cryptocom || base.toUpperCase();

    this.logger.debug({ base, quote, symbol }, '[PriceService] Fetching from Crypto.com MCP');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT);

    try {
      // MCP uses JSON-RPC 2.0 protocol
      const response = await fetch(this.CRYPTO_COM_MCP_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_price',
            arguments: {
              symbol: symbol,
            },
          },
          id: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new CryptoComMCPError(`Crypto.com MCP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as MCPResponse;

      if (data.error) {
        throw new CryptoComMCPError(`Crypto.com MCP error: ${data.error.message}`);
      }

      // Parse price from MCP response content
      const price = this.parseMCPPriceResponse(data, symbol, quote);

      this.logger.info({ base, quote, price }, '[PriceService] Crypto.com MCP price fetched');
      return price;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse price from MCP tool response
   */
  private parseMCPPriceResponse(response: MCPResponse, symbol: string, quote: string): number {
    // MCP returns tool results in content array
    const content = response.result?.content;

    if (!content || !Array.isArray(content)) {
      throw new CryptoComMCPError('Invalid MCP response format: missing content');
    }

    // Find text content with price data
    const textContent = content.find((c: MCPContent) => c.type === 'text');
    if (!textContent || !textContent.text) {
      throw new CryptoComMCPError('Invalid MCP response format: missing text content');
    }

    // Try to parse price from response text
    // Crypto.com MCP returns price information in text format
    const text = textContent.text;

    // Try JSON parse first
    try {
      const priceData = JSON.parse(text);
      if (priceData.price !== undefined) {
        return parseFloat(priceData.price);
      }
      if (priceData[symbol]?.[quote.toLowerCase()] !== undefined) {
        return parseFloat(priceData[symbol][quote.toLowerCase()]);
      }
    } catch {
      // Not JSON, try regex extraction
    }

    // Regex to find price patterns like "$0.12" or "0.12 USD"
    const priceMatch = text.match(/\$?([\d,]+\.?\d*)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }

    throw new CryptoComMCPError(`Could not parse price from MCP response: ${text.substring(0, 100)}`);
  }

  /**
   * Fetch price from CoinGecko API (fallback)
   */
  private async fetchFromCoinGecko(base: string, quote: string): Promise<number> {
    const coinId = this.coinIds[base.toUpperCase()]?.coingecko || base.toLowerCase();
    const vsQuote = quote.toLowerCase();

    this.logger.debug({ base, quote, coinId }, '[PriceService] Fetching from CoinGecko (fallback)');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT);

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${vsQuote}`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Cronos-X402-Agent/1.0',
          },
        }
      );

      if (response.status === 429) {
        throw new CoinGeckoRateLimitError('CoinGecko API rate limit exceeded (429)');
      }

      if (!response.ok) {
        throw new CoinGeckoApiError(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as Record<string, Record<string, number>>;
      const price = data[coinId]?.[vsQuote];

      if (price === undefined || price === null) {
        throw new CoinGeckoApiError(`Price not found for ${base}/${quote} in CoinGecko response`);
      }

      this.logger.info({ base, quote, price }, '[PriceService] CoinGecko price fetched');
      return price;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Cache price with source information
   */
  private cachePrice(cacheKey: string, price: number, source: string): void {
    this.priceCache.set(cacheKey, {
      price,
      expires: Date.now() + this.PRICE_CACHE_TTL,
      source,
    });
    this.logger.debug({ cacheKey, price, source }, '[PriceService] Price cached');
  }

  /**
   * Get cache statistics (for debugging/monitoring)
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.priceCache.size,
      entries: Array.from(this.priceCache.keys()),
    };
  }

  /**
   * Clear price cache
   */
  clearCache(): void {
    this.priceCache.clear();
    this.logger.info('[PriceService] Cache cleared');
  }
}

// Types for MCP responses
interface MCPContent {
  type: string;
  text?: string;
}

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: {
    content: MCPContent[];
  };
  error?: {
    code: number;
    message: string;
  };
}

// Custom errors
export class PriceServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PriceServiceError';
  }
}

export class CryptoComMCPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoComMCPError';
  }
}

export class CoinGeckoRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoinGeckoRateLimitError';
  }
}

export class CoinGeckoApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoinGeckoApiError';
  }
}
