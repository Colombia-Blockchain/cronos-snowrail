/**
 * Helper utilities for contract interactions and deployments
 */

import { ethers } from "hardhat";
import { Contract } from "ethers";

/**
 * Wait for a transaction to be mined
 */
export async function waitForTx(
  txHash: string,
  confirmations: number = 1
): Promise<void> {
  const receipt = await ethers.provider.waitForTransaction(txHash, confirmations);
  if (!receipt) {
    throw new Error(`Transaction ${txHash} not found`);
  }
}

/**
 * Get contract instance from deployed address
 */
export async function getContractAt(
  contractName: string,
  address: string
): Promise<Contract> {
  return ethers.getContractAt(contractName, address);
}

/**
 * Encode function call for verification or off-chain processing
 */
export function encodeFunctionCall(
  contract: Contract,
  functionName: string,
  args: unknown[]
): string {
  const iface = contract.interface;
  return iface.encodeFunctionData(functionName, args);
}

/**
 * Decode function result
 */
export function decodeFunctionResult(
  contract: Contract,
  functionName: string,
  data: string
): unknown {
  const iface = contract.interface;
  return iface.decodeFunctionResult(functionName, data);
}

/**
 * Get contract events
 */
export async function getContractEvents(
  contract: Contract,
  eventName: string,
  fromBlock: number = 0,
  toBlock: string | number = "latest"
): Promise<unknown[]> {
  const filter = contract.filters[eventName]?.();
  if (!filter) {
    throw new Error(`Event ${eventName} not found`);
  }

  return contract.queryFilter(filter, fromBlock, toBlock);
}

/**
 * Format contract function inputs for display
 */
export function formatInputs(inputs: unknown[]): string {
  return inputs
    .map((input, index) => {
      if (typeof input === "bigint") {
        return `${index}: ${ethers.formatEther(input)} CRO`;
      }
      if (typeof input === "string" && input.startsWith("0x")) {
        return `${index}: ${input}`;
      }
      return `${index}: ${input}`;
    })
    .join("\n");
}

/**
 * Calculate contract address from deployer and nonce
 * Uses ethers v6 utilities for address calculation
 */
export function calculateContractAddress(
  deployerAddress: string,
  nonce: number
): string {
  // This is a simplified version - for production use ethers.getCreate2Address
  // or ethers.getAddress combined with transaction encoding
  const key = ethers.solidityPacked(
    ["address", "uint256"],
    [deployerAddress, nonce]
  );
  const hash = ethers.keccak256(key);
  return "0x" + hash.slice(-40);
}

/**
 * Verify contract on block explorer
 */
export async function verifyContractOnExplorer(
  contractAddress: string,
  contractPath: string,
  _constructorArgs?: unknown[]
): Promise<void> {
  console.log("Verifying contract on Cronoscan...");
  console.log(`Address: ${contractAddress}`);
  console.log(`Path: ${contractPath}`);

  // This would typically use hardhat-etherscan plugin
  // Implementation depends on your verification setup
  console.log("Verification command generated - use hardhat verify plugin");
}

/**
 * Get gas estimates for a transaction
 */
export async function estimateGas(
  contract: Contract,
  functionName: string,
  args: unknown[],
  overrides: Record<string, unknown> = {}
): Promise<bigint> {
  return contract[functionName].estimateGas(...args, overrides);
}

/**
 * Format gas costs
 */
export function formatGasCost(gasUsed: bigint, gasPrice: bigint): string {
  const cost = (gasUsed * gasPrice) / BigInt(10 ** 18);
  const costInEther = ethers.formatEther(cost * BigInt(10 ** 18));
  return costInEther;
}

/**
 * Sleep helper for delays
 */
export async function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Retry logic for unreliable operations
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(
        `Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms...`
      );

      if (attempt < maxAttempts) {
        await sleep(delay);
        delay *= backoffMultiplier;
      }
    }
  }

  throw lastError || new Error("Max retry attempts reached");
}

/**
 * Safe contract interaction with error handling
 */
export async function safeCall<T>(
  fn: () => Promise<T>,
  errorMessage: string = "Contract interaction failed"
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`${errorMessage}: ${error.message}`);
    }
    throw new Error(errorMessage);
  }
}

export default {
  waitForTx,
  getContractAt,
  encodeFunctionCall,
  decodeFunctionResult,
  getContractEvents,
  formatInputs,
  calculateContractAddress,
  verifyContractOnExplorer,
  estimateGas,
  formatGasCost,
  sleep,
  retry,
  safeCall,
};
