import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { cronosTestnet } from 'wagmi/chains';
import type { Config } from 'wagmi';

export const config: Config = getDefaultConfig({
  appName: 'Cronos x402 Agentic Treasury',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
  chains: [cronosTestnet],
  ssr: true,
});
