/**
 * MCP Tool Handlers for Cronos x402 Agentic Treasury
 *
 * These handlers map MCP tool calls to existing services.
 * They act as a bridge between MCP protocol and the backend business logic.
 */

import { FastifyInstance } from 'fastify';
import { intentService } from '../services/intent-service';
import { getAgentService } from '../services/agent-service';
import { getWalletService } from '../services/wallet-service';
import { Orchestrator } from '../x402/orchestrator';
import { decodeCustomError } from '../utils/error-decoder';
import { PaymentIntent } from '@cronos-x402/shared-types';
import { isZKInitialized, getVerifyProvider, getZKStatus } from '../zk';

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export type MCPToolHandler = (
  args: Record<string, unknown>,
  logger: FastifyInstance['log']
) => Promise<MCPToolResult>;

/**
 * Helper to create successful MCP response
 */
function successResult(data: unknown): MCPToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Helper to create error MCP response
 */
function errorResult(message: string, details?: unknown): MCPToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message, details }, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Handler: create_payment_intent
 */
export const handleCreatePaymentIntent: MCPToolHandler = async (args, logger) => {
  logger.info({ args }, '[MCP] create_payment_intent called');

  const { amount, currency, recipient, conditionType, conditionValue } = args as {
    amount: string;
    currency: string;
    recipient: string;
    conditionType: string;
    conditionValue: string;
  };

  // Validation
  if (!amount || !currency || !recipient || !conditionType || !conditionValue) {
    return errorResult('Missing required fields', {
      required: ['amount', 'currency', 'recipient', 'conditionType', 'conditionValue'],
    });
  }

  // Validate recipient address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    return errorResult('Invalid recipient address format. Must be 0x followed by 40 hex characters.');
  }

  // Validate amount is positive number
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return errorResult('Amount must be a positive number');
  }

  try {
    const intent = intentService.create({
      amount,
      currency,
      recipient,
      condition: {
        type: conditionType as 'manual' | 'price-below',
        value: conditionValue,
      },
    });

    logger.info({ intentId: intent.intentId }, '[MCP] Payment intent created');

    return successResult({
      message: 'Payment intent created successfully',
      intent: {
        intentId: intent.intentId,
        amount: intent.amount,
        currency: intent.currency,
        recipient: intent.recipient,
        condition: intent.condition,
        status: intent.status,
        createdAt: intent.createdAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, '[MCP] Failed to create payment intent');
    return errorResult('Failed to create payment intent', errorMessage);
  }
};

/**
 * Handler: list_payment_intents
 */
export const handleListPaymentIntents: MCPToolHandler = async (_args, logger) => {
  logger.info('[MCP] list_payment_intents called');

  try {
    const intents = intentService.getAll();

    const formattedIntents = intents.map((intent) => ({
      intentId: intent.intentId,
      amount: intent.amount,
      currency: intent.currency,
      recipient: intent.recipient,
      condition: intent.condition,
      status: intent.status,
      createdAt: intent.createdAt,
      txHash: intent.txHash,
    }));

    return successResult({
      message: `Found ${intents.length} payment intent(s)`,
      count: intents.length,
      intents: formattedIntents,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, '[MCP] Failed to list payment intents');
    return errorResult('Failed to list payment intents', errorMessage);
  }
};

/**
 * Handler: get_payment_intent
 */
export const handleGetPaymentIntent: MCPToolHandler = async (args, logger) => {
  logger.info({ args }, '[MCP] get_payment_intent called');

  const { intentId } = args as { intentId: string };

  if (!intentId) {
    return errorResult('intentId is required');
  }

  try {
    const intent = intentService.getById(intentId);

    if (!intent) {
      return errorResult(`Payment intent with ID ${intentId} not found`);
    }

    return successResult({
      message: 'Payment intent found',
      intent: {
        intentId: intent.intentId,
        amount: intent.amount,
        currency: intent.currency,
        recipient: intent.recipient,
        condition: intent.condition,
        status: intent.status,
        createdAt: intent.createdAt,
        txHash: intent.txHash,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, '[MCP] Failed to get payment intent');
    return errorResult('Failed to get payment intent', errorMessage);
  }
};

/**
 * Handler: trigger_agent
 */
export const handleTriggerAgent: MCPToolHandler = async (args, logger) => {
  logger.info({ args }, '[MCP] trigger_agent called');

  const { intentId } = args as { intentId: string };

  if (!intentId) {
    return errorResult('intentId is required');
  }

  try {
    // Get intent
    const intent = intentService.getById(intentId);

    if (!intent) {
      return errorResult(`Payment intent with ID ${intentId} not found`);
    }

    // Prevent re-execution
    if (intent.status === 'executed' || intent.status === 'failed') {
      return errorResult(`Payment intent is already ${intent.status}`, {
        intentId,
        status: intent.status,
        txHash: intent.txHash,
      });
    }

    logger.info({ intentId, status: intent.status }, '[MCP] Evaluating intent for execution');

    // Evaluate with agent
    const agentService = getAgentService();
    const agentDecision = await agentService.evaluate(intent);

    logger.info({ intentId, decision: agentDecision.decision }, '[MCP] Agent evaluation completed');

    // Execute if agent approves
    let txHash: string | null = null;
    let newStatus: string = intent.status;

    if (agentDecision.decision === 'EXECUTE') {
      try {
        const orchestrator = new Orchestrator(logger);
        txHash = await orchestrator.execute(intent as PaymentIntent, agentDecision);

        if (txHash) {
          newStatus = 'executed';
          intentService.updateStatus(intentId, 'executed', txHash);
          logger.info({ intentId, txHash }, '[MCP] Intent executed successfully');
        }
      } catch (executionError) {
        const decodedError = decodeCustomError(executionError);
        logger.error({ intentId, error: decodedError }, '[MCP] Orchestrator execution failed');

        newStatus = 'failed';
        intentService.updateStatus(intentId, 'failed');

        return errorResult('Failed to execute payment intent on blockchain', {
          intentId,
          status: 'failed',
          error: decodedError,
        });
      }
    } else {
      logger.info({ intentId, reason: agentDecision.reason }, '[MCP] Skipping execution - Agent decided SKIP');
    }

    return successResult({
      message: txHash
        ? 'Payment intent executed successfully by agent'
        : 'Payment intent was not executed - agent decided to SKIP',
      intentId,
      status: newStatus,
      txHash: txHash || undefined,
      agentDecision: {
        decision: agentDecision.decision,
        reason: agentDecision.reason,
      },
      cronoscanUrl: txHash ? `https://explorer.cronos.org/testnet/tx/${txHash}` : undefined,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, '[MCP] Failed to trigger agent');
    return errorResult('Failed to trigger agent', errorMessage);
  }
};

/**
 * Handler: get_treasury_status
 */
export const handleGetTreasuryStatus: MCPToolHandler = async (_args, logger) => {
  logger.info('[MCP] get_treasury_status called');

  try {
    const walletService = getWalletService();
    const balance = await walletService.getBalance();
    const walletAddress = walletService.getAddress();

    const settlementContractAddress = process.env.SETTLEMENT_CONTRACT_ADDRESS;
    const chainId = process.env.CHAIN_ID || '338';
    const rpcUrl = process.env.RPC_URL || 'https://evm-t3.cronos.org';

    return successResult({
      message: 'Treasury status retrieved',
      treasury: {
        settlementContract: settlementContractAddress,
        backendWallet: walletAddress,
        balance: `${balance} CRO`,
        network: {
          chainId: parseInt(chainId),
          rpcUrl,
          explorer: 'https://explorer.cronos.org/testnet',
        },
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, '[MCP] Failed to get treasury status');
    return errorResult('Failed to get treasury status', errorMessage);
  }
};

/**
 * Handler: verify_wallet
 */
export const handleVerifyWallet: MCPToolHandler = async (args, logger) => {
  logger.info({ args }, '[MCP] verify_wallet called');

  const { address } = args as { address: string };

  if (!address) {
    return errorResult('address is required');
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return errorResult('Invalid address format. Must be 0x followed by 40 hex characters.');
  }

  try {
    if (!isZKInitialized()) {
      return errorResult('ZK services not initialized');
    }

    const verifyProvider = getVerifyProvider();
    const isVerified = await verifyProvider.isVerified(address);

    return successResult({
      message: isVerified ? 'Wallet is verified' : 'Wallet is not verified',
      address,
      verified: isVerified,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, '[MCP] Failed to verify wallet');
    return errorResult('Failed to verify wallet', errorMessage);
  }
};

/**
 * Handler: get_verification_status
 */
export const handleGetVerificationStatus: MCPToolHandler = async (args, logger) => {
  logger.info({ args }, '[MCP] get_verification_status called');

  const { address } = args as { address: string };

  if (!address) {
    return errorResult('address is required');
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return errorResult('Invalid address format. Must be 0x followed by 40 hex characters.');
  }

  try {
    if (!isZKInitialized()) {
      return successResult({
        message: 'ZK services not initialized',
        address,
        verified: false,
        zkInitialized: false,
      });
    }

    const verifyProvider = getVerifyProvider();
    const isVerified = await verifyProvider.isVerified(address);

    return successResult({
      message: 'Verification status retrieved',
      address,
      verified: isVerified,
      zkInitialized: true,
      requireVerification: process.env.REQUIRE_VERIFICATION === 'true',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, '[MCP] Failed to get verification status');
    return errorResult('Failed to get verification status', errorMessage);
  }
};

/**
 * Handler: get_zk_status
 */
export const handleGetZKStatus: MCPToolHandler = async (_args, logger) => {
  logger.info('[MCP] get_zk_status called');

  try {
    const zkStatus = getZKStatus();

    return successResult({
      message: 'ZK status retrieved',
      status: zkStatus,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, '[MCP] Failed to get ZK status');
    return errorResult('Failed to get ZK status', errorMessage);
  }
};

/**
 * Handler registry - maps tool names to handlers
 */
export const toolHandlers: Record<string, MCPToolHandler> = {
  create_payment_intent: handleCreatePaymentIntent,
  list_payment_intents: handleListPaymentIntents,
  get_payment_intent: handleGetPaymentIntent,
  trigger_agent: handleTriggerAgent,
  get_treasury_status: handleGetTreasuryStatus,
  verify_wallet: handleVerifyWallet,
  get_verification_status: handleGetVerificationStatus,
  get_zk_status: handleGetZKStatus,
};

/**
 * Execute a tool by name
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  logger: FastifyInstance['log']
): Promise<MCPToolResult> {
  const handler = toolHandlers[toolName];

  if (!handler) {
    return errorResult(`Unknown tool: ${toolName}`, {
      availableTools: Object.keys(toolHandlers),
    });
  }

  return handler(args, logger);
}
