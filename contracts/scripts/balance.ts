import { ethers } from "hardhat";

/**
 * Get account balances for all signers
 */
async function main() {
  const signers = await ethers.getSigners();

  console.log("\n=== Account Balances ===\n");

  for (const signer of signers) {
    const balance = await ethers.provider.getBalance(signer.address);
    const balanceEther = ethers.formatEther(balance);
    console.log(`${signer.address}: ${balanceEther} CRO`);
  }

  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
