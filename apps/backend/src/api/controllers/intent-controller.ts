import { FastifyRequest, FastifyReply } from "fastify";
import { PaymentIntent, ApiResponse, AgentDecision } from "@cronos-x402/shared-types";
import { intentService } from "../../services/intent-service";
import { getAgentService } from "../../services/agent-service";

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

      if (!condition.value) {
        errors.push("condition.value is required");
      } else if (condition.type === "price-below" && isNaN(Number(condition.value))) {
        errors.push("condition.value must be a valid number for price-below type");
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
        value: condition!.value as string,
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
