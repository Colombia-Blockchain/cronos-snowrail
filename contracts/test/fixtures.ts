import { ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

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
