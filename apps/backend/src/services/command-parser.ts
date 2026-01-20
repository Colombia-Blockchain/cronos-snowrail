import type { ChatCommand, CommandParams } from '@cronos-x402/shared-types';

/**
 * Parse chat message to extract command and arguments
 */
export function parseCommand(content: string): CommandParams | null {
  const trimmed = content.trim();

  // Check if message starts with /
  if (!trimmed.startsWith('/')) {
    return null;
  }

  // Split by spaces, but respect quoted strings
  const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  if (parts.length === 0) {
    return null;
  }

  const command = parts[0] as ChatCommand;
  const args = parts.slice(1).map((arg) => arg.replace(/^"(.*)"$/, '$1')); // Remove quotes

  return {
    command,
    args,
    raw: trimmed,
  };
}

/**
 * Validate command syntax
 */
export function validateCommand(params: CommandParams): { valid: boolean; error?: string } {
  const { command, args } = params;

  switch (command) {
    case '/pay':
      if (args.length < 2) {
        return { valid: false, error: 'Usage: /pay <recipient> <amount> [currency]' };
      }
      if (!isValidAddress(args[0])) {
        return { valid: false, error: 'Invalid recipient address' };
      }
      if (!isValidAmount(args[1])) {
        return { valid: false, error: 'Invalid amount' };
      }
      if (args.length >= 3 && !isValidCurrency(args[2])) {
        return { valid: false, error: 'Invalid currency. Use CRO, WCRO, USDC, or USDT' };
      }
      return { valid: true };

    case '/deposit':
      if (args.length < 2) {
        return { valid: false, error: 'Usage: /deposit <intentId> <amount>' };
      }
      if (!isValidAmount(args[1])) {
        return { valid: false, error: 'Invalid amount' };
      }
      return { valid: true };

    case '/withdraw':
      if (args.length < 1) {
        return { valid: false, error: 'Usage: /withdraw <noteOrIntentId>' };
      }
      return { valid: true };

    case '/mix':
      if (args.length < 1) {
        return { valid: false, error: 'Usage: /mix <amount>' };
      }
      if (!isValidAmount(args[0])) {
        return { valid: false, error: 'Invalid amount' };
      }
      return { valid: true };

    case '/bulk':
      if (args.length < 1) {
        return { valid: false, error: 'Usage: /bulk <upload|preview|execute|status> [batchId]' };
      }
      const subcommand = args[0];
      if (!['upload', 'preview', 'execute', 'status'].includes(subcommand)) {
        return { valid: false, error: 'Invalid bulk subcommand. Use upload, preview, execute, or status' };
      }
      if (['preview', 'execute', 'status'].includes(subcommand) && args.length < 2) {
        return { valid: false, error: `Usage: /bulk ${subcommand} <batchId>` };
      }
      return { valid: true };

    case '/status':
      // Optional intentId argument
      if (args.length > 1) {
        return { valid: false, error: 'Usage: /status [intentId]' };
      }
      return { valid: true };

    case '/wallet':
      if (args.length > 0) {
        return { valid: false, error: 'Usage: /wallet (no arguments)' };
      }
      return { valid: true };

    case '/history':
      if (args.length > 1) {
        return { valid: false, error: 'Usage: /history [limit]' };
      }
      if (args.length === 1 && !isPositiveInteger(args[0])) {
        return { valid: false, error: 'Limit must be a positive integer' };
      }
      return { valid: true };

    case '/help':
      if (args.length > 1) {
        return { valid: false, error: 'Usage: /help [command]' };
      }
      return { valid: true };

    case '/confirm':
      return { valid: true };

    case '/cancel':
      if (args.length < 1) {
        return { valid: false, error: 'Usage: /cancel <intentId>' };
      }
      return { valid: true };

    default:
      return { valid: false, error: `Unknown command: ${command}` };
  }
}

/**
 * Get help text for a command
 */
export function getHelpText(command?: string): string {
  if (!command) {
    return `
Available Commands:
━━━━━━━━━━━━━━━━━━━━━━━

💰 Payment Commands:
  /pay <recipient> <amount> [currency]
    Send payment to an address
    Example: /pay 0x742d...3dF4 100 CRO

  /deposit <intentId> <amount>
    Fund a payment intent
    Example: /deposit intent-123 100

  /withdraw <noteOrIntentId>
    Withdraw from mixer or cancel intent
    Example: /withdraw mixer-note-abc

  /mix <amount>
    Deposit to privacy mixer
    Example: /mix 0.1

  /cancel <intentId>
    Cancel a pending payment intent
    Example: /cancel 123e4567-e89b-12d3-a456

📊 B2B Commands:
  /bulk upload
    Upload CSV/JSON for bulk payments

  /bulk preview <batchId>
    Preview a bulk payment batch

  /bulk execute <batchId>
    Execute a bulk payment batch

  /bulk status <batchId>
    Check bulk payment status

ℹ️ Info Commands:
  /status [intentId]
    Check payment or wallet status

  /wallet
    Show your wallet balance

  /history [limit]
    Show transaction history

  /help [command]
    Show help for a command

Type /help <command> for detailed help on a specific command.
    `.trim();
  }

  const helpTexts: Record<string, string> = {
    '/pay': `
/pay - Send Payment
━━━━━━━━━━━━━━━━━━━━━━━
Send an immediate payment to a recipient.

Usage:
  /pay <recipient> <amount> [currency]

Arguments:
  recipient - Ethereum address (0x...)
  amount    - Amount to send (e.g., 100, 0.5)
  currency  - Optional: CRO, WCRO, USDC, USDT (default: CRO)

Examples:
  /pay 0x742d35Cc6634C0532925a3b844Bc9e7595f39dF4 100
  /pay 0x742d35Cc6634C0532925a3b844Bc9e7595f39dF4 50 USDC
    `.trim(),

    '/deposit': `
/deposit - Fund Intent
━━━━━━━━━━━━━━━━━━━━━━━
Fund an existing payment intent.

Usage:
  /deposit <intentId> <amount>

Arguments:
  intentId - The intent ID to fund
  amount   - Amount to deposit

Example:
  /deposit intent-123 100
    `.trim(),

    '/withdraw': `
/withdraw - Withdraw Funds
━━━━━━━━━━━━━━━━━━━━━━━
Withdraw from privacy mixer or cancel an intent.

Usage:
  /withdraw <noteOrIntentId>

Arguments:
  noteOrIntentId - Mixer note or intent ID

Example:
  /withdraw mixer-note-abc123
  /withdraw intent-456
    `.trim(),

    '/mix': `
/mix - Privacy Mixer
━━━━━━━━━━━━━━━━━━━━━━━
Deposit funds to the privacy mixer for anonymous transactions.

Usage:
  /mix <amount>

Arguments:
  amount - Amount to mix (fixed denomination: 0.1 CRO)

Example:
  /mix 0.1

⚠️ Important:
  Save the mixer note securely! You'll need it to withdraw.
    `.trim(),

    '/bulk': `
/bulk - Bulk Payments (B2B)
━━━━━━━━━━━━━━━━━━━━━━━
Manage bulk payment batches.

Usage:
  /bulk upload              - Upload CSV/JSON file
  /bulk preview <batchId>   - Preview batch details
  /bulk execute <batchId>   - Execute batch
  /bulk status <batchId>    - Check batch status

Examples:
  /bulk upload
  /bulk preview batch-456
  /bulk execute batch-456
  /bulk status batch-456

CSV Format:
  recipient,amount,currency
  0x742d...3dF4,100,CRO
  0x8a3e...9f2b,50,USDC
    `.trim(),

    '/status': `
/status - Check Status
━━━━━━━━━━━━━━━━━━━━━━━
Check payment intent or wallet status.

Usage:
  /status [intentId]

Arguments:
  intentId - Optional: Specific intent to check

Examples:
  /status              - Show wallet status
  /status intent-123   - Show intent status
    `.trim(),

    '/wallet': `
/wallet - Wallet Info
━━━━━━━━━━━━━━━━━━━━━━━
Display your wallet balance and recent activity.

Usage:
  /wallet

No arguments required.
    `.trim(),

    '/history': `
/history - Transaction History
━━━━━━━━━━━━━━━━━━━━━━━
Show your recent transaction history.

Usage:
  /history [limit]

Arguments:
  limit - Optional: Number of transactions (default: 10, max: 100)

Examples:
  /history      - Show last 10 transactions
  /history 20   - Show last 20 transactions
    `.trim(),

    '/cancel': `
/cancel - Cancel Payment Intent
━━━━━━━━━━━━━━━━━━━━━━━
Cancel a pending payment intent that has not been funded yet.

Usage:
  /cancel <intentId>

Arguments:
  intentId - The ID of the intent to cancel

Example:
  /cancel 123e4567-e89b-12d3-a456-426614174000

Note:
  Only pending (unfunded) intents can be cancelled.
  Funded or executed intents cannot be cancelled.
    `.trim(),
  };

  return helpTexts[command] || `No help available for command: ${command}`;
}

// Validation helpers

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidAmount(amount: string): boolean {
  return /^\d+(\.\d+)?$/.test(amount) && parseFloat(amount) > 0;
}

function isValidCurrency(currency: string): boolean {
  return ['CRO', 'WCRO', 'USDC', 'USDT'].includes(currency.toUpperCase());
}

function isPositiveInteger(value: string): boolean {
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0 && num.toString() === value;
}
