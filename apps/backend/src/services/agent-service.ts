import { PaymentIntent, AgentDecision } from '@cronos-x402/shared-types';
import { FastifyInstance } from 'fastify';
import { Agent } from '../agent/agent';

class AgentService {
  private agent: Agent;

  constructor(private logger: FastifyInstance['log']) {
    this.agent = new Agent(logger);
  }

  /**
   * Evaluate a payment intent and return a decision
   */
  async evaluate(intent: PaymentIntent): Promise<AgentDecision> {
    return this.agent.evaluate(intent);
  }
}

let agentService: AgentService;

/**
 * Initialize AgentService with Fastify logger
 */
export function initializeAgentService(server: FastifyInstance): void {
  agentService = new AgentService(server.log);
  server.log.info('[AgentService] Initialized');
}

/**
 * Get the singleton AgentService instance
 */
export function getAgentService(): AgentService {
  if (!agentService) {
    throw new Error(
      'AgentService not initialized. Call initializeAgentService(server) first.'
    );
  }
  return agentService;
}

export { AgentService };
