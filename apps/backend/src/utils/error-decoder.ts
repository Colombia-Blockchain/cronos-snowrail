import { ethers } from 'ethers';

/**
 * Decode custom errors from Settlement contract
 * Helps identify the specific reason for contract execution failures
 */
export function decodeCustomError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const message = error.message;

  // Extract error data if available
  const errorMatch = message.match(/data="(0x[a-f0-9]+)"/);
  if (!errorMatch) {
    // Console log for debugging
    console.log('[error-decoder] No error data found in message:', message.substring(0, 200));
    return message;
  }

  const errorData = errorMatch[1];
  const selector = errorData.slice(0, 10).toLowerCase();

  // Console log for debugging
  console.log('[error-decoder] Error data:', errorData.substring(0, 20), '... selector:', selector);

  // Custom error selectors from Settlement contract
  const customErrors: Record<string, string> = {
    '0x7ba5ffb5': 'InsufficientBalance - Contract does not have enough CRO to execute the transfer',
    '0x7bad85c6': 'IntentAlreadyExecuted - This intent has already been executed',
    '0x82b42900': 'Unauthorized - Caller is not authorized to execute settlements',
    '0x90b8ec6a': 'TransferFailed - Failed to transfer ETH to recipient',
    '0x1e93b0f1': 'ZeroAddress - Recipient address is zero address',
    '0x5a574ade': 'ZeroAmount - Amount is zero',
    '0x8baa579f': 'InvalidSignature - Signature verification failed',
    '0x43adbafb': 'InvalidSigner - Recovered signer does not match executor',
    '0x9e599a39': 'InvalidNonce - Nonce does not match expected value',
  };

  // Try to match error selector (case-insensitive)
  if (customErrors[selector]) {
    return `Settlement Contract Error: ${customErrors[selector]}`;
  }

  // If we have the full error data, try to decode it
  if (errorData.toLowerCase().startsWith('0x7ba5ffb5')) {
    // InsufficientBalance(uint256 requested, uint256 available)
    try {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ['uint256', 'uint256'],
        '0x' + errorData.slice(10)
      );
      return `InsufficientBalance: Requested ${ethers.formatEther(decoded[0])} CRO but only ${ethers.formatEther(decoded[1])} CRO available (raw: requested=${decoded[0].toString()}, available=${decoded[1].toString()})`;
    } catch {
      return 'InsufficientBalance - Contract does not have enough CRO';
    }
  }

  if (errorData.toLowerCase().startsWith('0x43adbafb')) {
    // InvalidSigner(address recovered, address expected)
    try {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ['address', 'address'],
        '0x' + errorData.slice(10)
      );
      return `InvalidSigner: Recovered ${decoded[0]} but expected ${decoded[1]}`;
    } catch {
      return 'InvalidSigner - Signature not from authorized executor';
    }
  }

  if (errorData.toLowerCase().startsWith('0x9e599a39')) {
    // InvalidNonce(bytes32 intentHash, uint256 provided, uint256 expected)
    try {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ['bytes32', 'uint256', 'uint256'],
        '0x' + errorData.slice(10)
      );
      return `InvalidNonce: Provided ${decoded[1]} but expected ${decoded[2]} for intent ${decoded[0]}`;
    } catch {
      return 'InvalidNonce - Intent nonce does not match';
    }
  }

  return message;
}
