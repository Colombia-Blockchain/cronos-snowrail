import { ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { TypedDataDomain, TypedDataField } from "ethers";

/**
 * Test fixture interface for common test setup
 */
export interface TestFixture {
  owner: HardhatEthersSigner;
  addr1: HardhatEthersSigner;
  addr2: HardhatEthersSigner;
  addrs: HardhatEthersSigner[];
}

/**
 * Load test signers
 * Returns owner account and multiple test accounts
 */
export async function loadTestSigners(): Promise<TestFixture> {
  const [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

  return { owner, addr1, addr2, addrs };
}

/**
 * Deploy a contract with error handling
 */
export async function deployContract(
  contractName: string,
  args: unknown[] = []
) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  const contract = await ContractFactory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

/**
 * Get current block timestamp
 */
export async function getCurrentTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block?.timestamp || 0;
}

/**
 * Mine blocks to advance time
 */
export async function mineBlocks(blockCount: number): Promise<void> {
  for (let i = 0; i < blockCount; i++) {
    await ethers.provider.send("hardhat_mine", ["0x1"]);
  }
}

/**
 * Increase time by seconds
 */
export async function increaseTime(seconds: number): Promise<void> {
  await ethers.provider.send("hardhat_mine", [
    "0x" + Math.floor(seconds / 12).toString(16),
  ]);
}

/**
 * Get EIP-712 domain for Settlement contract
 */
export function getSettlementDomain(
  chainId: number,
  verifyingContract: string
): TypedDataDomain {
  return {
    name: "CronosSettlement",
    version: "1",
    chainId,
    verifyingContract,
  };
}

/**
 * Get EIP-712 types for Settlement signatures
 */
export function getSettlementTypes(): Record<string, TypedDataField[]> {
  return {
    Settlement: [
      { name: "intentHash", type: "bytes32" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };
}

/**
 * Sign a settlement transaction using EIP-712
 */
export async function signSettlement(
  signer: HardhatEthersSigner,
  contractAddress: string,
  chainId: number,
  intentHash: string,
  recipient: string,
  amount: bigint,
  nonce: bigint
): Promise<string> {
  const domain = getSettlementDomain(chainId, contractAddress);
  const types = getSettlementTypes();
  const value = { intentHash, recipient, amount, nonce };

  return await signer.signTypedData(domain, types, value);
}
