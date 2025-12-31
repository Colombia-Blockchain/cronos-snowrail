import { ethers } from 'ethers';
import { FastifyInstance } from 'fastify';

export class WalletService {
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;

  constructor(private logger: FastifyInstance['log']) {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found in environment variables');
    }

    const rpcUrl = process.env.RPC_URL || process.env.CRONOS_RPC_URL || 'https://evm-t3.cronos.org';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    this.logger.info(`[WalletService] Initialized with address: ${this.wallet.address}`);
  }

  getAddress(): string {
    return this.wallet.address;
  }

  async signMessage(message: string): Promise<string> {
    const messageBytes = ethers.toUtf8Bytes(message);
    const signature = await this.wallet.signMessage(messageBytes);
    return signature;
  }

  async signHash(messageText: string): Promise<string> {
    // Sign a message for intent verification
    // Uses EIP-191 format: \x19Ethereum Signed Message:\n{len}{message}
    const messageBytes = ethers.toUtf8Bytes(messageText);
    const signature = await this.wallet.signMessage(messageBytes);
    return signature;
  }

  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  async getNonce(): Promise<number> {
    return await this.provider.getTransactionCount(this.wallet.address);
  }

  getWallet(): ethers.Wallet {
    return this.wallet;
  }
}

let walletService: WalletService;

/**
 * Initialize WalletService with Fastify logger
 */
export function initializeWalletService(server: FastifyInstance): void {
  walletService = new WalletService(server.log);
  server.log.info('[WalletService] Initialized');
}

/**
 * Get the singleton WalletService instance
 */
export function getWalletService(): WalletService {
  if (!walletService) {
    throw new Error(
      'WalletService not initialized. Call initializeWalletService(server) first.'
    );
  }
  return walletService;
}
