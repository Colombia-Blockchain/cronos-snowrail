import { PaymentIntent, AgentDecision } from '@cronos-x402/shared-types';
import { FastifyInstance } from 'fastify';
import { ethers } from 'ethers';
import { getWalletService } from '../services/wallet-service';
import { generateIntentHash, computeEIP712Digest } from '../utils/crypto';
import { decodeCustomError } from '../utils/error-decoder';
import { AgentDecisionWithZK } from '../agent/agent';
import { isZKInitialized, getVerifyProvider } from '../zk';

// Settlement Contract ABI - minimal interface for executeSettlement
const SETTLEMENT_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'intentHash', type: 'bytes32' },
      { internalType: 'address payable', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'nonce', type: 'uint256' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'executeSettlement',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'intentHash', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'PaymentExecuted',
    type: 'event',
  },
];

export class Orchestrator {
  private requireVerification = process.env.REQUIRE_VERIFICATION === 'true';

  constructor(private logger: FastifyInstance['log']) {}

  /**
   * Execute a payment intent based on agent decision
   * X402 protocol: Only executes if Agent decision is EXECUTE
   * Broadcasts signed transaction to Cronos Settlement contract
   */
  async execute(intent: PaymentIntent, decision: AgentDecision | AgentDecisionWithZK): Promise<string | null> {
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

    // Log ZK proof status if present
    const zkDecision = decision as AgentDecisionWithZK;
    if (zkDecision.zkProof) {
      this.logger.info(
        {
          intentId: intent.intentId,
          circuitId: zkDecision.zkProof.circuitId,
          hasVerifier: !!zkDecision.zkProof.verifierContract,
        },
        '[Orchestrator] ZK proof attached to decision'
      );
    }

    if (zkDecision.verificationStatus?.checked) {
      this.logger.info(
        {
          intentId: intent.intentId,
          verified: zkDecision.verificationStatus.verified,
        },
        '[Orchestrator] Recipient verification status'
      );
    }

    // Verify recipient if required (additional security gate)
    if (this.requireVerification && isZKInitialized()) {
      const verifyProvider = getVerifyProvider();
      const isVerified = await verifyProvider.isVerified(intent.recipient);

      if (!isVerified) {
        this.logger.warn(
          { intentId: intent.intentId, recipient: intent.recipient },
          '[Orchestrator] Recipient not verified - blocking execution'
        );
        throw new Error('Recipient wallet is not verified');
      }

      this.logger.info(
        { intentId: intent.intentId, recipient: intent.recipient },
        '[Orchestrator] Recipient verification passed'
      );
    }

    this.logger.info(
      { intentId: intent.intentId },
      '[Orchestrator] Agent approved - proceeding with X402 execution'
    );

    try {
      // Get wallet service for signing
      const walletService = getWalletService();
      const walletAddress = walletService.getAddress();

      // Setup chain ID and settlement contract address
      const chainId = parseInt(process.env.CHAIN_ID || '338', 10);
      const settlementContractAddress = process.env.SETTLEMENT_CONTRACT_ADDRESS;
      if (!settlementContractAddress) {
        throw new Error('SETTLEMENT_CONTRACT_ADDRESS not configured');
      }

      // Generate intent hash for contract execution
      // Use a fixed nonce of 0 for the first execution (contract tracks per-intent nonce)
      const nonce = 0;
      const intentHash = generateIntentHash(
        intent.intentId,
        intent.amount,
        intent.recipient,
        chainId,
        nonce
      );

      // Compute EIP-712 digest for signing
      const amountWei = ethers.parseEther(intent.amount);
      const digest = computeEIP712Digest(
        intentHash,
        intent.recipient,
        amountWei,
        nonce,
        chainId,
        settlementContractAddress
      );

      // Sign the EIP-712 digest
      const signature = await walletService.signHash(digest);

      this.logger.info(
        {
          intentId: intent.intentId,
          signer: walletAddress,
          nonce,
          chainId,
          intentHash,
          digest,
        },
        '[Orchestrator] Intent signed successfully'
      );

      // Connect to Cronos network and Settlement contract
      const rpcUrl = process.env.RPC_URL || 'https://evm-t3.cronos.org';
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Validate RPC connection and chain ID
      const network = await provider.getNetwork();
      const expectedChainId = BigInt(process.env.CHAIN_ID || '338');
      if (network.chainId !== expectedChainId) {
        throw new Error(
          `Wrong chain: expected ${expectedChainId}, got ${network.chainId}`
        );
      }

      // Use WalletService singleton for secure wallet management (SECURITY FIX #1)
      const signer = walletService.getWallet();

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

      // Execute settlement transaction
      this.logger.info(
        {
          intentId: intent.intentId,
          amount: intent.amount,
          recipient: intent.recipient,
          callParams: {
            intentHash,
            recipient: intent.recipient,
            amountWei: amountWei.toString(),
            nonce,
            signatureLength: signature.length,
          },
        },
        '[Orchestrator] Submitting settlement transaction to Cronos'
      );

      const tx = await settlementContract.executeSettlement(
        intentHash,
        intent.recipient,
        amountWei,
        nonce,
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
      const decodedError = decodeCustomError(error);
      this.logger.error(
        {
          intentId: intent.intentId,
          error: decodedError,
          originalError: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        '[Orchestrator] Execution failed'
      );
      throw error;
    }
  }
}

