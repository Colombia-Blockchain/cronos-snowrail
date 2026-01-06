import { ethers } from 'ethers';
import { FastifyInstance } from 'fastify';

let walletServiceInstance: WalletService | null = null;

export class WalletService {
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;

  constructor(privateKey: string, rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  getAddress(): string {
    return this.wallet.address;
  }

  getWallet(): ethers.Wallet {
    return this.wallet;
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  async signHash(hash: string): Promise<string> {
    return this.wallet.signMessage(ethers.getBytes(hash));
  }

  async signTypedData(
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, unknown>
  ): Promise<string> {
    return this.wallet.signTypedData(domain, types, value);
  }
}

export function initializeWalletService(server: FastifyInstance): void {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || 'https://evm-t3.cronos.org';

  if (!privateKey) {
    server.log.warn('[WalletService] PRIVATE_KEY not configured - settlement will be unavailable');
    return;
  }

  try {
    walletServiceInstance = new WalletService(privateKey, rpcUrl);
    server.log.info(`[WalletService] Initialized with address: ${walletServiceInstance.getAddress()}`);
  } catch (error) {
    server.log.error({ error }, '[WalletService] Failed to initialize');
    throw error;
  }
}

export function getWalletService(): WalletService {
  if (!walletServiceInstance) {
    throw new Error('WalletService not initialized. Ensure PRIVATE_KEY is configured.');
  }
  return walletServiceInstance;
}

export function isWalletServiceAvailable(): boolean {
  return walletServiceInstance !== null;
}
