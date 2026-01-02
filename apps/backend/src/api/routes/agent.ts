import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '@cronos-x402/shared-types';
import { intentService } from '../../services/intent-service';
import { getAgentService } from '../../services/agent-service';
import { Orchestrator } from '../../x402/orchestrator';
import { decodeCustomError } from '../../utils/error-decoder';

// Agent trigger handler
async function triggerAgent(
  request: FastifyRequest<{
    Body: {
      intentId: string;
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { intentId } = request.body;

    // Validation
    if (!intentId) {
      const response: ApiResponse = {
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'intentId is required',
        details: {
          traceId: request.id,
        },
      };
      reply.code(400).send(response);
      return;
    }

    // TODO: Add authentication middleware (Issue #16)
    // SECURITY: This endpoint requires authentication in production
    // Currently accessible to any caller - auth will be added when user system is implemented

    // Get intent
    const intent = intentService.getById(intentId);

    if (!intent) {
      const response: ApiResponse = {
        status: 'error',
        code: 'INTENT_NOT_FOUND',
        message: `Payment intent with ID ${intentId} not found`,
        details: {
          traceId: request.id,
        },
      };
      reply.code(404).send(response);
      return;
    }

    // TODO: Verify ownership when authentication is implemented (Issue #16)
    // SECURITY FIX #3: Ownership verification
    // When auth is added, verify: intent.owner === request.user.id
    // For now, skipping ownership check as owner field is optional in Issue #9
    if (intent.owner && intent.owner !== 'system') {
      request.server.log.warn(
        { intentId, owner: intent.owner },
        '[AgentRoute] Intent has owner - ownership verification pending (Issue #16)'
      );
    }

    // Prevent re-execution
    if (intent.status === 'executed' || intent.status === 'failed') {
      request.server.log.warn(
        { intentId, status: intent.status },
        '[AgentRoute] Attempt to re-execute completed intent'
      );
      const response: ApiResponse = {
        status: 'error',
        code: 'INTENT_ALREADY_COMPLETED',
        message: `Payment intent is already ${intent.status}`,
        details: {
          traceId: request.id,
        },
      };
      reply.code(409).send(response);
      return;
    }

    request.server.log.info(
      { intentId, status: intent.status },
      '[AgentRoute] Evaluating intent for execution'
    );

    // Evaluate intent with agent
    const agentService = getAgentService();
    const agentDecision = await agentService.evaluate(intent);

    request.server.log.info(
      { intentId, decision: agentDecision.decision },
      '[AgentRoute] Agent evaluation completed'
    );

    // Execute orchestrator if agent approves
    let txHash: string | null = null;
    let newStatus: string = intent.status;

    if (agentDecision.decision === 'EXECUTE') {
      try {
        const orchestrator = new Orchestrator(request.server.log);
        txHash = await orchestrator.execute(intent, agentDecision);

        if (txHash) {
          newStatus = 'executed';
          intentService.updateStatus(intentId, 'executed', txHash);

          request.server.log.info(
            { intentId, status: newStatus, txHash },
            '[AgentRoute] Intent execution completed successfully'
          );
        } else {
          request.server.log.warn(
            { intentId },
            '[AgentRoute] Orchestrator execution returned null'
          );
        }
      } catch (executionError) {
        const decodedError = decodeCustomError(executionError);
        request.server.log.error(
          { intentId, error: decodedError },
          '[AgentRoute] Orchestrator execution failed'
        );

        newStatus = 'failed';
        intentService.updateStatus(intentId, 'failed');

        const response: ApiResponse = {
          status: 'error',
          code: 'EXECUTION_FAILED',
          message: 'Failed to execute payment intent on blockchain',
          details: {
            traceId: request.id,
            error: decodedError,
          },
        };
        reply.code(500).send(response);
        return;
      }
    } else {
      request.server.log.info(
        { intentId, reason: agentDecision.reason },
        '[AgentRoute] Skipping execution - Agent decision was SKIP'
      );
      newStatus = 'pending';
    }

    const responseData = {
      ...intent,
      status: newStatus,
      txHash: txHash || undefined,
      agentDecision,
    };

    const response: ApiResponse<typeof responseData> = {
      status: txHash ? 'success' : 'warning',
      code: txHash ? 'AGENT_EXECUTED' : 'AGENT_SKIPPED',
      message: txHash
        ? 'Payment intent executed successfully by agent'
        : 'Payment intent was not executed - agent decision was SKIP',
      data: responseData,
    };

    reply.code(txHash ? 200 : 202).send(response);
  } catch (error) {
    request.server.log.error(error);
    const response: ApiResponse = {
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'Failed to process agent trigger',
      details: {
        traceId: request.id,
        originalError: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
    };
    reply.code(500).send(response);
  }
}

export async function agentRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: { intentId: string } }>('/agent/trigger', triggerAgent);
}
