import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { ApiResponse, SupportedData, PaymentScheme, NetworkInfo, TokenInfo } from '../../types';

// Supported payment schemes for Cronos network
const SUPPORTED_SCHEMES: PaymentScheme[] = [
  {
    scheme: 'exact',
    network: 'cronos-testnet',
    chainId: 338,
    token: 'TCRO',
    tokenAddress: null, // Native token
    description: 'Exact amount payment with native TCRO',
  },
  {
    scheme: 'exact',
    network: 'cronos-mainnet',
    chainId: 25,
    token: 'CRO',
    tokenAddress: null,
    description: 'Exact amount payment with native CRO',
  },
  {
    scheme: 'eip-3009',
    network: 'cronos-testnet',
    chainId: 338,
    token: 'USDC',
    tokenAddress: '0x5425890298aed601595a70AB815c96711a31Bc65',
    description: 'EIP-3009 transferWithAuthorization for USDC',
  },
];

// Supported networks
const SUPPORTED_NETWORKS: NetworkInfo[] = [
  {
    name: 'Cronos Testnet',
    chainId: 338,
    rpcUrl: 'https://evm-t3.cronos.org',
    explorerUrl: 'https://explorer.cronos.org/testnet',
  },
  {
    name: 'Cronos Mainnet',
    chainId: 25,
    rpcUrl: 'https://evm.cronos.org',
    explorerUrl: 'https://explorer.cronos.org',
  },
];

// Supported tokens
const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    symbol: 'TCRO',
    name: 'Testnet CRO',
    address: null,
    decimals: 18,
    network: 'cronos-testnet',
  },
  {
    symbol: 'CRO',
    name: 'Cronos',
    address: null,
    decimals: 18,
    network: 'cronos-mainnet',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x5425890298aed601595a70AB815c96711a31Bc65',
    decimals: 6,
    network: 'cronos-testnet',
  },
];

export const supportedRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // GET /supported - List supported payment schemes and networks
  server.get<{ Reply: ApiResponse<SupportedData> }>('/supported', async () => {
    const currentChainId = parseInt(process.env.CHAIN_ID || '338', 10);

    // Filter schemes for current network
    const activeSchemes = SUPPORTED_SCHEMES.filter(
      scheme => scheme.chainId === currentChainId
    );

    const response: ApiResponse<SupportedData> = {
      status: 'success',
      code: 'SUPPORTED_SCHEMES',
      message: 'List of supported payment schemes and networks',
      data: {
        schemes: activeSchemes,
        networks: SUPPORTED_NETWORKS,
        tokens: SUPPORTED_TOKENS.filter(
          token => token.network === (currentChainId === 338 ? 'cronos-testnet' : 'cronos-mainnet')
        ),
      },
    };
    return response;
  });
};
