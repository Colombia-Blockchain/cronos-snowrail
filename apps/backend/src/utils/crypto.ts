import { ethers } from 'ethers';

// EIP-712 Domain Separator
const DOMAIN_NAME = 'CronosSettlement';
const DOMAIN_VERSION = '1';

// Settlement type hash matching the contract
const SETTLEMENT_TYPEHASH = ethers.id('Settlement(bytes32 intentHash,address recipient,uint256 amount,uint256 nonce)');

/**
 * Generate intent hash from payment intent data
 * Uses keccak256 of concatenated parameters
 * This hash is passed to the contract's executeSettlement function
 */
export function generateIntentHash(
  intentId: string,
  amount: string,
  recipient: string,
  chainId: number,
  nonce: number
): string {
  // Create a deterministic hash from intent parameters
  const message = `${intentId}${amount}${recipient}${chainId}${nonce}`;
  return ethers.keccak256(ethers.toUtf8Bytes(message));
}

/**
 * Create EIP-712 typed data for signing
 * Matches the Settlement contract's signature verification
 */
export function createEIP712TypedData(
  intentHash: string,
  recipient: string,
  amount: string,
  nonce: number,
  chainId: number,
  contractAddress: string
): any {
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Settlement: [
        { name: 'intentHash', type: 'bytes32' },
        { name: 'recipient', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
    },
    primaryType: 'Settlement',
    domain: {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      chainId: chainId,
      verifyingContract: contractAddress,
    },
    message: {
      intentHash: intentHash,
      recipient: recipient,
      amount: amount,
      nonce: nonce,
    },
  };
}

/**
 * Compute EIP-712 digest for signature verification
 * Matches the contract's _hashTypedDataV4 function from OpenZeppelin
 */
export function computeEIP712Digest(
  intentHash: string,
  recipient: string,
  amount: string | bigint,
  nonce: number,
  chainId: number,
  contractAddress: string
): string {
  // Compute domain separator following EIP-712
  // IMPORTANT: Must use AbiCoder.encode() to match Solidity's abi.encode()
  const domainSeparator = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        ethers.id('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
        ethers.id(DOMAIN_NAME),
        ethers.id(DOMAIN_VERSION),
        chainId,
        contractAddress,
      ]
    )
  );

  // Compute struct hash - IMPORTANT: use AbiCoder.encode (not solidityPacked)
  // This matches Solidity's abi.encode() which adds padding
  const structHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'bytes32', 'address', 'uint256', 'uint256'],
      [SETTLEMENT_TYPEHASH, intentHash, recipient, amount, nonce]
    )
  );

  // Compute final digest: keccak256("\x19\x01" || domainSeparator || structHash)
  // Using concat for the prefix bytes as it's cleaner
  const digest = ethers.keccak256(
    ethers.concat([
      '0x1901',
      domainSeparator,
      structHash
    ])
  );

  return digest;
}

/**
 * Verify a signature using EIP-712 recovery
 */
export function verifySignature(
  intentHash: string,
  recipient: string,
  amount: string | bigint,
  nonce: number,
  signature: string,
  expectedSigner: string,
  chainId: number,
  contractAddress: string
): boolean {
  try {
    const digest = computeEIP712Digest(
      intentHash,
      recipient,
      amount,
      nonce,
      chainId,
      contractAddress
    );
    const recoveredAddress = ethers.recoverAddress(digest, signature);
    return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
  } catch {
    return false;
  }
}
