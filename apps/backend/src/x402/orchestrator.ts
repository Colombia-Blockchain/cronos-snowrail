import { PaymentIntent, AgentDecision } from '@cronos-x402/shared-types';
import { FastifyInstance } from 'fastify';
import { ethers } from 'ethers';
import { getWalletService } from '../services/wallet-service';
import { createIntentMessage, generateIntentHash } from '../utils/crypto';

// Settlement Contract ABI - minimal interface for executeSettlement
const SETTLEMENT_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'intentHash', type: 'bytes32' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'executeSettlement',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'intentHash', type: 'bytes32' },
      { indexed: false, internalType: 'string', name: 'txHash', type: 'string' },
    ],
    name: 'PaymentSettled',
    type: 'event',
  },
];

export class Orchestrator {
  constructor(private logger: FastifyInstance['log']) {}

  /**
   * Execute a payment intent based on agent decision
   * X402 protocol: Only executes if Agent decision is EXECUTE
   * Broadcasts signed transaction to Cronos Settlement contract
   */
  async execute(intent: PaymentIntent, decision: AgentDecision): Promise<string | null> {
    this.logger.info(
      { intentId: intent.intentId, decision: decision.decision },
      '[Orchestrator] Executing intent with agent decision'
    );

    // Security boundary: Only execute if Agent explicitly says EXECUTE
    if (decision.decision !== 'EXECUTE') {
      this.logger.info(
        { intentId: intent.intentId, reason: decision.reason },
        '[Orchestrator] Skipping execution - Agent decision was SKIP'
      );
      return null;
    }

    this.logger.info(
      { intentId: intent.intentId },
      '[Orchestrator] Agent approved - proceeding with X402 execution'
    );

    try {
      // Get wallet service for signing
      const walletService = getWalletService();
      const walletAddress = walletService.getAddress();

      // Create intent message with replay protection
      const chainId = parseInt(process.env.CHAIN_ID || '43113', 10);
      const nonce = await walletService.getNonce();

      const messageText = createIntentMessage(
        intent.intentId,
        intent.amount,
        intent.recipient,
        chainId,
        nonce
      );

      // Generate intent hash for contract execution
      const intentHash = generateIntentHash(
        intent.intentId,
        intent.amount,
        intent.recipient,
        chainId,
        nonce
      );

      // Sign the intent message
      const signature = await walletService.signHash(messageText);

      this.logger.info(
        {
          intentId: intent.intentId,
          signer: walletAddress,
          nonce,
          chainId,
          intentHash,
        },
        '[Orchestrator] Intent signed successfully'
      );

      // Connect to Cronos network and Settlement contract
      const rpcUrl = process.env.RPC_URL || 'https://evm-t3.cronos.org';
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Validate RPC connection and chain ID
      const network = await provider.getNetwork();
      const expectedChainId = BigInt(process.env.CHAIN_ID || '43113');
      if (network.chainId !== expectedChainId) {
        throw new Error(
          `Wrong chain: expected ${expectedChainId}, got ${network.chainId}`
        );
      }

      // Use WalletService singleton for secure wallet management (SECURITY FIX #1)
      const signer = walletService.getWallet();

      const settlementContractAddress = process.env.SETTLEMENT_CONTRACT_ADDRESS;
      if (!settlementContractAddress) {
        throw new Error('SETTLEMENT_CONTRACT_ADDRESS not configured');
      }

      // Validate contract exists at address (SECURITY FIX #5)
      const contractCode = await provider.getCode(settlementContractAddress);
      if (contractCode === '0x') {
        throw new Error(
          `Settlement contract not found at address ${settlementContractAddress}`
        );
      }

      const settlementContract = new ethers.Contract(
        settlementContractAddress,
        SETTLEMENT_CONTRACT_ABI,
        signer
      );

      this.logger.info(
        {
          intentId: intent.intentId,
          contractAddress: settlementContractAddress,
          walletAddress,
        },
        '[Orchestrator] Connected to Settlement contract'
      );

      // Convert amount to proper format (assuming CRO with 18 decimals)
      const amountWei = ethers.parseEther(intent.amount);

      // Execute settlement transaction
      this.logger.info(
        {
          intentId: intent.intentId,
          amount: intent.amount,
          recipient: intent.recipient,
        },
        '[Orchestrator] Submitting settlement transaction to Cronos'
      );

      const tx = await settlementContract.executeSettlement(
        intentHash,
        amountWei,
        intent.recipient,
        signature
      );

      this.logger.info(
        { intentId: intent.intentId, txHash: tx.hash },
        '[Orchestrator] Transaction submitted to blockchain'
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }

      const txHash = receipt.hash;

      this.logger.info(
        {
          intentId: intent.intentId,
          txHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          status: receipt.status,
        },
        '[Orchestrator] Transaction confirmed on Cronos blockchain'
      );

      if (receipt.status === 0) {
        throw new Error(`Transaction reverted: ${receipt.hash}`);
      }

      return txHash;
    } catch (error) {
      this.logger.error(
        {
          intentId: intent.intentId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        '[Orchestrator] Execution failed'
      );
      throw error;
    }
  }
}

