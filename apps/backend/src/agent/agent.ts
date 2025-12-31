import { PaymentIntent, AgentDecision } from '@cronos-x402/shared-types';
import { FastifyInstance } from 'fastify';

export class Agent {
  // Use real price API (set to false for MVP with mock prices)
  private useRealPriceApi = process.env.USE_REAL_PRICE_API === 'true';

  // Price cache: Map<"BASE/QUOTE", { price, expires }>
  private priceCache = new Map<string, { price: number; expires: number }>();
  private readonly PRICE_CACHE_TTL = 60000; // 60 seconds
  private readonly FETCH_TIMEOUT = 5000; // 5 seconds

  constructor(private logger: FastifyInstance['log']) {}

  async evaluate(intent: PaymentIntent): Promise<AgentDecision> {
    this.logger.info({ intentId: intent.intentId }, `[Agent] Evaluating intent: ${intent.intentId}`);
    this.logger.info({ condition: intent.condition }, `[Agent] Condition: ${intent.condition.type} = ${intent.condition.value}`);

    try {
      switch (intent.condition.type) {
        case 'manual':
          return this.evaluateManual();
        case 'price-below':
          return await this.evaluatePriceBelow(intent);
        default:
          return {
            decision: 'SKIP',
            reason: `Unknown condition type: ${intent.condition.type}`,
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ error }, `[Agent] Evaluation error: ${errorMessage}`);
      return {
        decision: 'SKIP',
        reason: `Evaluation error: ${errorMessage}`,
      };
    }
  }

  private evaluateManual(): AgentDecision {
    this.logger.info('[Agent] Manual condition - always execute');
    return {
      decision: 'EXECUTE',
      reason: 'Manual condition - always execute',
    };
  }

  private async evaluatePriceBelow(intent: PaymentIntent): Promise<AgentDecision> {
    const targetPrice = parseFloat(intent.condition.value);

    if (isNaN(targetPrice) || targetPrice <= 0) {
      this.logger.warn({ targetPrice: intent.condition.value }, '[Agent] Invalid price threshold');
      return {
        decision: 'SKIP',
        reason: `Invalid price threshold: ${intent.condition.value}`,
      };
    }

    const currentPrice = await this.fetchCurrentPrice('CRO', 'USD');

    this.logger.info({ currentPrice, targetPrice }, '[Agent] Price comparison');

    if (currentPrice < targetPrice) {
      this.logger.info({ currentPrice, targetPrice }, '[Agent] Price below threshold - EXECUTE');
      return {
        decision: 'EXECUTE',
        reason: `Price ${currentPrice} is below threshold ${targetPrice}`,
      };
    }

    this.logger.info({ currentPrice, targetPrice }, '[Agent] Price above threshold - SKIP');
    return {
      decision: 'SKIP',
      reason: `Price ${currentPrice} is above or equal to threshold ${targetPrice}`,
    };
  }

  private async fetchCurrentPrice(base: string, quote: string): Promise<number> {
    if (this.useRealPriceApi) {
      return this.fetchFromCoinGecko(base, quote);
    }

    // MVP: Return mock price
    this.logger.debug({ base, quote }, '[Agent] Fetching price (MOCK)');
    return 0.1; // Mock CRO/USD price for MVP
  }

  private async fetchFromCoinGecko(base: string, quote: string): Promise<number> {
    try {
      const cacheKey = `${base}/${quote}`;
      const cached = this.priceCache.get(cacheKey);

      // Check cache validity
      if (cached && cached.expires > Date.now()) {
        this.logger.debug({ cacheKey, price: cached.price }, '[Agent] Price cache hit');
        return cached.price;
      }

      const coinIds: Record<string, string> = {
        'CRO': 'cronos',
        'ETH': 'ethereum',
        'BTC': 'bitcoin',
        'USDC': 'usd-coin',
        'USDT': 'tether',
      };

      const coinId = coinIds[base.toUpperCase()] || base.toLowerCase();
      const vsQuote = quote.toLowerCase();

      this.logger.debug({ base, quote, coinId }, '[Agent] Fetching price from CoinGecko');

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

        const data = await response.json() as Record<string, Record<string, number>>;
        const price = data[coinId]?.[vsQuote];

        if (price === undefined || price === null) {
          throw new CoinGeckoApiError(`Price not found for ${base}/${quote} in CoinGecko response`);
        }

        // Cache the price
        this.priceCache.set(cacheKey, {
          price,
          expires: Date.now() + this.PRICE_CACHE_TTL,
        });

        this.logger.info({ base, quote, price }, '[Agent] CoinGecko price fetched and cached');
        return price;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof CoinGeckoRateLimitError) {
        this.logger.warn({ error: error.message }, '[Agent] CoinGecko rate limit hit');
        throw error;
      }

      if (error instanceof CoinGeckoApiError) {
        this.logger.error({ error: error.message }, '[Agent] CoinGecko API error');
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error('[Agent] CoinGecko fetch timeout (5s)');
        throw new Error('CoinGecko API timeout after 5 seconds');
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: errorMessage }, '[Agent] Unexpected CoinGecko error');
      throw error;
    }
  }
}

/**
 * Custom error for CoinGecko rate limiting
 */
class CoinGeckoRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoinGeckoRateLimitError';
  }
}

/**
 * Custom error for CoinGecko API issues
 */
class CoinGeckoApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoinGeckoApiError';
  }
}

