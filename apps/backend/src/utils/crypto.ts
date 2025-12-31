import { ethers } from 'ethers';

/**
 * Create the signed message for intent verification
 * Includes chainId and nonce to prevent replay attacks
 * Uses EIP-191 format for signing
 */
export function createIntentMessage(
  intentId: string,
  amount: string,
  recipient: string,
  chainId: number,
  nonce: number
): string {
  return `${intentId}${amount}${recipient}${chainId}${nonce}`;
}

/**
 * Generate intent hash from payment intent data
 * Should be called on contract verification side only
 */
export function generateIntentHash(
  intentId: string,
  amount: string,
  recipient: string,
  chainId: number,
  nonce: number
): string {
  const message = createIntentMessage(intentId, amount, recipient, chainId, nonce);
  return ethers.keccak256(ethers.toUtf8Bytes(message));
}

/**
 * Verify a signature using EIP-191 recovery
 */
export function verifySignature(
  messageText: string,
  signature: string,
  expectedSigner: string
): boolean {
  try {
    const messageBytes = ethers.toUtf8Bytes(messageText);
    const recoveredAddress = ethers.verifyMessage(messageBytes, signature);
    return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
  } catch {
    return false;
  }
}
