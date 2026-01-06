import { ethers } from 'ethers';
import { getWalletService, isWalletServiceAvailable } from './wallet-service';
import type { SettleRequest, SettleResponse, PaymentToken } from '../types';
import { getX402Service } from './x402-service';

// EIP-3009 Token ABI (minimal interface for transferWithAuthorization)
const EIP3009_ABI = [
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    name: 'transferWithAuthorization',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    name: 'receiveWithAuthorization',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// Settlement Contract ABI for native token transfers
const SETTLEMENT_ABI = [
  {
    inputs: [
      { name: 'intentHash', type: 'bytes32' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    name: 'executeSettlement',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export class SettlementService {
  private logger: Console;

  constructor() {
    this.logger = console;
  }

  /**
   * Execute payment settlement on-chain via EIP-3009
   */
  async settle(request: SettleRequest): Promise<SettleResponse> {
    const { paymentHeader, paymentRequirements } = request;

    // Check if wallet service is available
    if (!isWalletServiceAvailable()) {
      return {
        success: false,
        network: paymentRequirements.network,
        error: 'Settlement service unavailable - wallet not configured',
      };
    }

    // Parse payment header
    const x402Service = getX402Service();
    const paymentToken = x402Service.parsePaymentHeader(paymentHeader);

    if (!paymentToken) {
      return {
        success: false,
        network: paymentRequirements.network,
        error: 'Invalid payment header format',
      };
    }

    // Verify the payment first
    const verification = await x402Service.verify(request);
    if (!verification.isValid) {
      return {
        success: false,
        network: paymentRequirements.network,
        error: `Verification failed: ${verification.invalidReason}`,
      };
    }

    try {
      // Execute based on scheme
      if (paymentToken.scheme === 'eip-3009') {
        return await this.executeEIP3009Settlement(paymentToken, paymentRequirements.network);
      } else if (paymentToken.scheme === 'exact') {
        return await this.executeNativeSettlement(paymentToken, paymentRequirements.network);
      } else {
        return {
          success: false,
          network: paymentRequirements.network,
          error: `Unsupported payment scheme: ${paymentToken.scheme}`,
        };
      }
    } catch (error) {
      this.logger.error('[SettlementService] Settlement execution failed:', error);
      return {
        success: false,
        network: paymentRequirements.network,
        error: error instanceof Error ? error.message : 'Unknown settlement error',
      };
    }
  }

  /**
   * Execute EIP-3009 transferWithAuthorization
   */
  private async executeEIP3009Settlement(
    paymentToken: PaymentToken,
    network: string
  ): Promise<SettleResponse> {
    const walletService = getWalletService();
    const signer = walletService.getWallet();

    const tokenAddress = process.env.USDC_CONTRACT_ADDRESS;
    if (!tokenAddress) {
      return {
        success: false,
        network,
        error: 'USDC contract address not configured',
      };
    }

    const tokenContract = new ethers.Contract(tokenAddress, EIP3009_ABI, signer);

    const { payload, signature } = paymentToken;

    this.logger.log('[SettlementService] Executing EIP-3009 transferWithAuthorization...');

    // Call receiveWithAuthorization (facilitator receives funds then forwards)
    // Or use transferWithAuthorization if facilitator is the recipient
    const tx = await tokenContract.transferWithAuthorization(
      payload.from,
      payload.to,
      payload.value,
      payload.validAfter,
      payload.validBefore,
      payload.nonce,
      signature.v,
      signature.r,
      signature.s,
      { gasLimit: 100000 } // Cronos requires higher gas limit
    );

    this.logger.log(`[SettlementService] Transaction submitted: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();

    if (!receipt || receipt.status === 0) {
      return {
        success: false,
        network,
        transactionHash: tx.hash,
        error: 'Transaction reverted',
      };
    }

    this.logger.log(`[SettlementService] Transaction confirmed in block ${receipt.blockNumber}`);

    return {
      success: true,
      network,
      transactionHash: receipt.hash,
      settledAmount: payload.value,
    };
  }

  /**
   * Execute native token settlement via Settlement contract
   */
  private async executeNativeSettlement(
    paymentToken: PaymentToken,
    network: string
  ): Promise<SettleResponse> {
    const walletService = getWalletService();
    const signer = walletService.getWallet();

    const settlementAddress = process.env.SETTLEMENT_CONTRACT_ADDRESS;
    if (!settlementAddress) {
      return {
        success: false,
        network,
        error: 'Settlement contract address not configured',
      };
    }

    const { payload, signature } = paymentToken;

    // Generate intent hash
    const intentHash = ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'address', 'uint256', 'bytes32'],
        [payload.from, payload.to, payload.value, payload.nonce]
      )
    );

    const settlementContract = new ethers.Contract(settlementAddress, SETTLEMENT_ABI, signer);

    this.logger.log('[SettlementService] Executing native settlement...');

    // Reconstruct signature bytes
    const signatureBytes = ethers.concat([
      signature.r,
      signature.s,
      ethers.toBeHex(signature.v, 1),
    ]);

    const tx = await settlementContract.executeSettlement(
      intentHash,
      payload.to,
      payload.value,
      0, // nonce for contract
      signatureBytes
    );

    this.logger.log(`[SettlementService] Transaction submitted: ${tx.hash}`);

    const receipt = await tx.wait();

    if (!receipt || receipt.status === 0) {
      return {
        success: false,
        network,
        transactionHash: tx.hash,
        error: 'Transaction reverted',
      };
    }

    this.logger.log(`[SettlementService] Transaction confirmed in block ${receipt.blockNumber}`);

    return {
      success: true,
      network,
      transactionHash: receipt.hash,
      settledAmount: payload.value,
    };
  }
}

// Singleton instance
let settlementServiceInstance: SettlementService | null = null;

export function getSettlementService(): SettlementService {
  if (!settlementServiceInstance) {
    settlementServiceInstance = new SettlementService();
  }
  return settlementServiceInstance;
}
