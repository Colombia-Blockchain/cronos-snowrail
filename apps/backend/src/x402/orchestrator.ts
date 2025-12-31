import { PaymentIntent, AgentDecision } from '@cronos-x402/shared-types';
import { FastifyInstance } from 'fastify';
import { getWalletService } from '../services/wallet-service';
import { createIntentMessage } from '../utils/crypto';

export class Orchestrator {
  constructor(private logger: FastifyInstance['log']) {}

  /**
   * Execute a payment intent based on agent decision
   * X402 protocol: Only executes if Agent decision is EXECUTE
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

      // Sign the intent message
      const signature = await walletService.signHash(messageText);

      this.logger.info(
        {
          intentId: intent.intentId,
          signer: walletAddress,
          nonce,
          chainId,
        },
        '[Orchestrator] Intent signed successfully'
      );

      // TODO: Implement actual x402 execution flow (Issue #9)
      // This would include:
      // 1. Broadcast signed transaction to Cronos network
      // 2. Wait for transaction confirmation
      // 3. Track transaction hash
      // 4. Update intent status

      // Mock transaction hash for now
      const txHash = `0x${Buffer.from(signature).toString('hex').slice(0, 64)}`;

      this.logger.info(
        { intentId: intent.intentId, txHash, signature: signature.slice(0, 20) + '...' },
        '[Orchestrator] Transaction prepared for broadcast'
      );

      return txHash;
    } catch (error) {
      this.logger.error(
        { intentId: intent.intentId, error: String(error) },
        '[Orchestrator] Execution failed'
      );
      throw error;
    }
  }
}

