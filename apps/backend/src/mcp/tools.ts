/**
 * MCP Tool Definitions for Cronos x402 Agentic Treasury
 *
 * These tools expose the treasury functionality to AI assistants via MCP protocol.
 * Each tool has a JSON Schema for input validation and clear descriptions for AI consumption.
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Tool: create_payment_intent
 * Creates a new conditional payment intent in the treasury
 */
export const createPaymentIntentTool: MCPTool = {
  name: 'create_payment_intent',
  description:
    'Create a new payment intent for the X402 Agentic Treasury on Cronos blockchain. ' +
    'The intent defines a conditional payment that will be evaluated by the AI agent. ' +
    'Supports manual triggers (always execute) or price-based conditions (execute when CRO price is below threshold).',
  inputSchema: {
    type: 'object',
    properties: {
      amount: {
        type: 'string',
        description: 'Payment amount in token units (e.g., "1.5" for 1.5 tokens). Must be a positive number.',
      },
      currency: {
        type: 'string',
        description: 'Currency/token symbol. Supported: CRO, USDC, USDT',
        enum: ['CRO', 'USDC', 'USDT'],
      },
      recipient: {
        type: 'string',
        description: 'Ethereum address of payment recipient (0x format, 40 hex characters)',
        pattern: '^0x[a-fA-F0-9]{40}$',
      },
      conditionType: {
        type: 'string',
        description:
          'Type of execution condition. "manual" always executes when triggered. ' +
          '"price-below" executes only when CRO/USD price is below the specified threshold.',
        enum: ['manual', 'price-below'],
      },
      conditionValue: {
        type: 'string',
        description:
          'Condition value. For "manual" use "true". For "price-below" use the USD price threshold (e.g., "0.15").',
      },
    },
    required: ['amount', 'currency', 'recipient', 'conditionType', 'conditionValue'],
  },
};

/**
 * Tool: list_payment_intents
 * Lists all payment intents in the treasury
 */
export const listPaymentIntentsTool: MCPTool = {
  name: 'list_payment_intents',
  description:
    'List all payment intents in the X402 Agentic Treasury. ' +
    'Returns an array of intents with their status (pending, executed, failed), ' +
    'amounts, recipients, conditions, and transaction hashes for executed intents.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

/**
 * Tool: get_payment_intent
 * Gets a specific payment intent by ID
 */
export const getPaymentIntentTool: MCPTool = {
  name: 'get_payment_intent',
  description:
    'Get detailed information about a specific payment intent by its ID. ' +
    'Returns the intent status, amount, recipient, condition, creation time, and transaction hash if executed.',
  inputSchema: {
    type: 'object',
    properties: {
      intentId: {
        type: 'string',
        description: 'Unique identifier (UUID) of the payment intent',
        format: 'uuid',
      },
    },
    required: ['intentId'],
  },
};

/**
 * Tool: trigger_agent
 * Triggers the AI agent to evaluate and potentially execute a payment intent
 */
export const triggerAgentTool: MCPTool = {
  name: 'trigger_agent',
  description:
    'Trigger the X402 AI Agent to evaluate a payment intent and execute it if conditions are met. ' +
    'The agent will check the condition (manual or price-based) and if approved, ' +
    'execute the settlement transaction on the Cronos blockchain. ' +
    'Returns the agent decision (EXECUTE or SKIP) with reason, and transaction hash if executed.',
  inputSchema: {
    type: 'object',
    properties: {
      intentId: {
        type: 'string',
        description: 'Unique identifier (UUID) of the payment intent to evaluate and potentially execute',
        format: 'uuid',
      },
    },
    required: ['intentId'],
  },
};

/**
 * Tool: get_treasury_status
 * Gets the current status of the treasury (Settlement contract)
 */
export const getTreasuryStatusTool: MCPTool = {
  name: 'get_treasury_status',
  description:
    'Get the current status of the X402 Treasury on Cronos blockchain. ' +
    'Returns the Settlement contract address, current balance in CRO, ' +
    'backend wallet address, and network information (chain ID, RPC URL).',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

/**
 * Tool: verify_wallet
 * Check if a wallet address is verified for receiving payments
 */
export const verifyWalletTool: MCPTool = {
  name: 'verify_wallet',
  description:
    'Check if a wallet address is verified and eligible to receive payments. ' +
    'Verification status is checked against the configured verification provider (Cronos Verify or mock). ' +
    'Returns verification status and provider information.',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Ethereum wallet address to verify (0x format)',
        pattern: '^0x[a-fA-F0-9]{40}$',
      },
    },
    required: ['address'],
  },
};

/**
 * Tool: get_verification_status
 * Get detailed verification information for a wallet
 */
export const getVerificationStatusTool: MCPTool = {
  name: 'get_verification_status',
  description:
    'Get detailed verification status for a wallet address. ' +
    'Returns whether the address is verified, which provider was used, ' +
    'and whether ZK verification is currently enabled.',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Ethereum wallet address to check (0x format)',
        pattern: '^0x[a-fA-F0-9]{40}$',
      },
    },
    required: ['address'],
  },
};

/**
 * Tool: get_zk_status
 * Get the current status of ZK services
 */
export const getZKStatusTool: MCPTool = {
  name: 'get_zk_status',
  description:
    'Get the current status of ZK (Zero Knowledge) services. ' +
    'Returns whether ZK is initialized, the active providers (verify and ZK proof), ' +
    'health status, and supported circuits.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

/**
 * All available MCP tools
 */
export const allTools: MCPTool[] = [
  createPaymentIntentTool,
  listPaymentIntentsTool,
  getPaymentIntentTool,
  triggerAgentTool,
  getTreasuryStatusTool,
  verifyWalletTool,
  getVerificationStatusTool,
  getZKStatusTool,
];

/**
 * Tool name to tool definition mapping
 */
export const toolsByName: Record<string, MCPTool> = {
  create_payment_intent: createPaymentIntentTool,
  list_payment_intents: listPaymentIntentsTool,
  get_payment_intent: getPaymentIntentTool,
  trigger_agent: triggerAgentTool,
  get_treasury_status: getTreasuryStatusTool,
  verify_wallet: verifyWalletTool,
  get_verification_status: getVerificationStatusTool,
  get_zk_status: getZKStatusTool,
};
