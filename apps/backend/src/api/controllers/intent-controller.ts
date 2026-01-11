import { FastifyRequest, FastifyReply } from "fastify";
import { PaymentIntent, ApiResponse, AgentDecision } from "@cronos-x402/shared-types";
import { intentService } from "../../services/intent-service";
import { getAgentService } from "../../services/agent-service";
import { Orchestrator } from "../../x402/orchestrator";
import { decodeCustomError } from "../../utils/error-decoder";
import { ethers } from "ethers";

// Validation helper
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Create intent handler
export async function createIntent(
  request: FastifyRequest<{
    Body: {
      amount?: string;
      currency?: string;
      recipient?: string;
      condition?: {
        type?: string;
        value?: string;
      };
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { amount, currency, recipient, condition } = request.body;

    // Validation
    const errors: string[] = [];

    if (!amount) errors.push("amount is required");
    else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      errors.push("amount must be a positive number");
    }

    if (!currency) errors.push("currency is required");

    if (!recipient) {
      errors.push("recipient is required");
    } else if (!isValidEthereumAddress(recipient)) {
      errors.push("recipient must be a valid Ethereum address");
    }

    if (!condition) {
      errors.push("condition is required");
    } else {
      if (!condition.type) errors.push("condition.type is required");
      else if (!["manual", "price-below"].includes(condition.type)) {
        errors.push("condition.type must be 'manual' or 'price-below'");
      }

      // condition.value is only required for price-below type
      if (condition.type === "price-below") {
        if (!condition.value) {
          errors.push("condition.value is required for price-below type");
        } else if (isNaN(Number(condition.value))) {
          errors.push("condition.value must be a valid number for price-below type");
        }
      }
    }

    if (errors.length > 0) {
      const response: ApiResponse = {
        status: "error",
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: {
          errors,
          traceId: request.id,
        },
      };
      reply.code(400).send(response);
      return;
    }

    // Create intent
    const newIntent = intentService.create({
      amount: amount as string,
      currency: currency as string,
      recipient: recipient as string,
      condition: {
        type: condition!.type as "manual" | "price-below",
        value: condition!.value || "",
      },
    });

    // Evaluate intent using Agent
    const agentService = getAgentService();
    const agentDecision = await agentService.evaluate(newIntent);

    request.server.log.info(
      { intentId: newIntent.intentId, decision: agentDecision.decision },
      '[Controller] Agent decision received'
    );

    // Include agent decision in response
    const responseData: PaymentIntent & { agentDecision?: AgentDecision } = {
      ...newIntent,
      agentDecision,
    };

    const response: ApiResponse<typeof responseData> = {
      status: "success",
      code: "INTENT_CREATED",
      message: "Payment intent successfully created",
      data: responseData,
    };

    reply.code(201).send(response);
  } catch (error) {
    request.server.log.error(error);
    const response: ApiResponse = {
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Failed to create payment intent",
      details: {
        traceId: request.id,
        originalError:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
    };
    reply.code(500).send(response);
  }
}

// Get all intents handler
export async function getIntents(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const intents = intentService.getAll();

    const response: ApiResponse<PaymentIntent[]> = {
      status: "success",
      code: "INTENTS_RETRIEVED",
      message: `Retrieved ${intents.length} payment intent(s)`,
      data: intents,
    };

    reply.code(200).send(response);
  } catch (error) {
    request.server.log.error(error);
    const response: ApiResponse = {
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Failed to retrieve payment intents",
      details: {
        traceId: request.id,
        originalError:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
    };
    reply.code(500).send(response);
  }
}

// Get intent by ID handler
export async function getIntentById(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;

    const intent = intentService.getById(id);

    if (!intent) {
      const response: ApiResponse = {
        status: "error",
        code: "INTENT_NOT_FOUND",
        message: `Payment intent with ID ${id} not found`,
        details: {
          traceId: request.id,
        },
      };
      reply.code(404).send(response);
      return;
    }

    const response: ApiResponse<PaymentIntent> = {
      status: "success",
      code: "INTENT_RETRIEVED",
      message: "Payment intent successfully retrieved",
      data: intent,
    };

    reply.code(200).send(response);
  } catch (error) {
    request.server.log.error(error);
    const response: ApiResponse = {
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Failed to retrieve payment intent",
      details: {
        traceId: request.id,
        originalError:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
    };
    reply.code(500).send(response);
  }
}

// Execute intent handler (triggers orchestrator)
export async function executeIntent(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params;
  try {

    const intent = intentService.getById(id);

    if (!intent) {
      const response: ApiResponse = {
        status: "error",
        code: "INTENT_NOT_FOUND",
        message: `Payment intent with ID ${id} not found`,
        details: {
          traceId: request.id,
        },
      };
      reply.code(404).send(response);
      return;
    }

    // Security: Prevent re-execution of already executed or failed intents
    if (intent.status === "executed" || intent.status === "failed") {
      request.server.log.warn(
        { intentId: id, status: intent.status },
        '[Controller] Attempt to re-execute completed intent'
      );
      const response: ApiResponse = {
        status: "error",
        code: "INTENT_ALREADY_COMPLETED",
        message: `Payment intent is already ${intent.status}`,
        details: {
          traceId: request.id,
        },
      };
      reply.code(409).send(response);
      return;
    }

    // Security: Require deposit before execution
    if (!intent.deposit) {
      request.server.log.warn(
        { intentId: id },
        '[Controller] Attempt to execute unfunded intent'
      );
      const response: ApiResponse = {
        status: "error",
        code: "INTENT_NOT_FUNDED",
        message: "Intent must be funded before execution. Call /intents/:id/deposit first.",
        details: {
          traceId: request.id,
          nextStep: "POST /intents/:id/deposit to get deposit TX data",
        },
      };
      reply.code(402).send(response); // 402 Payment Required
      return;
    }

    request.server.log.info(
      { intentId: id, status: intent.status },
      '[Controller] Validating intent for execution'
    );

    // Re-evaluate intent with agent
    const agentService = getAgentService();
    const agentDecision = await agentService.evaluate(intent);

    request.server.log.info(
      { intentId: id, decision: agentDecision.decision },
      '[Controller] Agent re-evaluation completed'
    );

    // Execute orchestrator
    const orchestrator = new Orchestrator(request.server.log);
    const txHash = await orchestrator.execute(intent, agentDecision);

    // Update intent status
    const newStatus = txHash ? "executed" : "pending";
    intentService.updateStatus(id, newStatus, txHash || undefined);

    request.server.log.info(
      { intentId: id, status: newStatus, txHash },
      '[Controller] Intent execution completed'
    );

    const responseData = {
      ...intent,
      status: newStatus,
      txHash,
      agentDecision,
    };

    const response: ApiResponse<typeof responseData> = {
      status: txHash ? "success" : "warning",
      code: txHash ? "INTENT_EXECUTED" : "INTENT_SKIPPED",
      message: txHash
        ? "Payment intent executed successfully"
        : "Payment intent was not executed - agent decision was SKIP",
      data: responseData,
    };

    reply.code(txHash ? 200 : 202).send(response);
  } catch (error) {
    const decodedError = decodeCustomError(error);
    request.server.log.error(
      {
        intentId: id,
        error: decodedError,
        originalError: error instanceof Error ? error.message : String(error),
      },
      '[Controller] Intent execution failed'
    );

    // Mark intent as failed
    intentService.updateStatus(id, "failed");

    const response: ApiResponse = {
      status: "error",
      code: "EXECUTION_FAILED",
      message: "Failed to execute payment intent",
      details: {
        traceId: request.id,
        reason: decodedError,
        originalError:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
    };
    reply.code(500).send(response);
  }
}

/**
 * Prepare deposit TX data for frontend wallet to execute
 * User must deposit funds before intent can be executed
 */
export async function prepareDeposit(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;
    const intent = intentService.getById(id);

    if (!intent) {
      const response: ApiResponse = {
        status: "error",
        code: "INTENT_NOT_FOUND",
        message: `Payment intent with ID ${id} not found`,
        details: { traceId: request.id },
      };
      reply.code(404).send(response);
      return;
    }

    if (intent.deposit) {
      const response: ApiResponse = {
        status: "error",
        code: "ALREADY_FUNDED",
        message: "This intent has already been funded",
        details: { traceId: request.id, depositTxHash: intent.deposit.txHash },
      };
      reply.code(400).send(response);
      return;
    }

    const settlementAddress = process.env.SETTLEMENT_CONTRACT_ADDRESS;
    if (!settlementAddress) {
      const response: ApiResponse = {
        status: "error",
        code: "SETTLEMENT_NOT_CONFIGURED",
        message: "Settlement contract address not configured",
      };
      reply.code(500).send(response);
      return;
    }

    // Calculate amount in wei
    const amountWei = ethers.parseEther(intent.amount);

    request.server.log.info(
      { intentId: id, amount: intent.amount },
      "[Controller] Prepared deposit TX for frontend"
    );

    const response: ApiResponse = {
      status: "success",
      code: "DEPOSIT_TX_PREPARED",
      message: "Deposit transaction prepared. Sign and send from your wallet.",
      data: {
        tx: {
          to: settlementAddress,
          value: amountWei.toString(),
          data: "0x", // Simple ETH transfer
        },
        intentId: id,
        amount: intent.amount + " " + intent.currency,
        instructions: [
          "1. Sign this transaction with your connected wallet",
          "2. After confirmation, call /intents/:id/confirm-deposit with txHash",
          "3. Once funded, the agent will execute when conditions are met",
        ],
      },
    };

    reply.code(200).send(response);
  } catch (error) {
    request.server.log.error(error, "[Controller] Prepare deposit failed");
    const response: ApiResponse = {
      status: "error",
      code: "DEPOSIT_PREPARATION_FAILED",
      message: (error as Error).message || "Failed to prepare deposit",
      details: { traceId: request.id },
    };
    reply.code(500).send(response);
  }
}

/**
 * Confirm deposit after frontend executes TX
 */
export async function confirmDeposit(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { txHash: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;
    const { txHash } = request.body;

    if (!txHash) {
      const response: ApiResponse = {
        status: "error",
        code: "MISSING_TX_HASH",
        message: "txHash is required",
      };
      reply.code(400).send(response);
      return;
    }

    const intent = intentService.getById(id);
    if (!intent) {
      const response: ApiResponse = {
        status: "error",
        code: "INTENT_NOT_FOUND",
        message: `Payment intent with ID ${id} not found`,
      };
      reply.code(404).send(response);
      return;
    }

    if (intent.deposit) {
      const response: ApiResponse = {
        status: "error",
        code: "ALREADY_FUNDED",
        message: "This intent has already been funded",
        details: { depositTxHash: intent.deposit.txHash },
      };
      reply.code(400).send(response);
      return;
    }

    // Verify transaction on-chain
    const rpcUrl = process.env.RPC_URL || "https://evm-t3.cronos.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      const response: ApiResponse = {
        status: "error",
        code: "TX_NOT_FOUND",
        message: "Transaction not found. Wait for confirmation.",
      };
      reply.code(400).send(response);
      return;
    }

    if (receipt.status === 0) {
      const response: ApiResponse = {
        status: "error",
        code: "TX_FAILED",
        message: "Transaction failed on-chain",
      };
      reply.code(400).send(response);
      return;
    }

    // Verify it was sent to Settlement contract
    const settlementAddress = process.env.SETTLEMENT_CONTRACT_ADDRESS?.toLowerCase();
    if (receipt.to?.toLowerCase() !== settlementAddress) {
      const response: ApiResponse = {
        status: "error",
        code: "WRONG_RECIPIENT",
        message: "Transaction was not sent to Settlement contract",
      };
      reply.code(400).send(response);
      return;
    }

    // Get transaction to check value
    const tx = await provider.getTransaction(txHash);
    const depositedAmount = ethers.formatEther(tx?.value || 0);

    // Record the deposit
    intentService.recordDeposit(id, {
      txHash,
      amount: depositedAmount,
      confirmedAt: new Date().toISOString(),
    });

    request.server.log.info(
      { intentId: id, txHash, amount: depositedAmount },
      "[Controller] Deposit confirmed"
    );

    const response: ApiResponse = {
      status: "success",
      code: "DEPOSIT_CONFIRMED",
      message: "Deposit confirmed. Intent is now funded and ready for execution.",
      data: {
        intentId: id,
        txHash,
        amount: depositedAmount + " " + intent.currency,
        status: "funded",
        nextStep: "Agent will execute when condition is met, or call /intents/:id/execute",
      },
    };

    reply.code(200).send(response);
  } catch (error) {
    request.server.log.error(error, "[Controller] Confirm deposit failed");
    const response: ApiResponse = {
      status: "error",
      code: "CONFIRM_FAILED",
      message: (error as Error).message || "Failed to confirm deposit",
    };
    reply.code(500).send(response);
  }
}
