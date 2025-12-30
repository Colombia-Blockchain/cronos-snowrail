import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { config, validateNetworkConfig } from "../config/env";

/**
 * Deployment record structure
 */
interface DeploymentRecord {
  network: string;
  chainId: number;
  blockExplorer: string;
  contracts: Record<string, ContractDeployment>;
  deployedAt: string;
}

interface ContractDeployment {
  address: string;
  deploymentTx: string;
  deploymentBlock: number;
  deployedAt: string;
  deployer: string;
  constructorArgs: unknown[];
}

/**
 * Get deployment record file path
 */
function getDeploymentRecordPath(): string {
  const networkName = network.name;
  const fileName = `cronos-${networkName === "cronosTestnet" ? "testnet" : "mainnet"}.json`;
  return path.join(__dirname, "../deployments", fileName);
}

/**
 * Load existing deployment record or create new one
 */
function loadDeploymentRecord(): DeploymentRecord {
  const filePath = getDeploymentRecordPath();

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  }

  const networkConfig =
    network.name === "cronosTestnet"
      ? config.networks.cronos.testnet
      : config.networks.cronos.mainnet;

  return {
    network: network.name,
    chainId: networkConfig.chainId,
    blockExplorer: networkConfig.explorer,
    contracts: {},
    deployedAt: new Date().toISOString(),
  };
}

/**
 * Save deployment record
 */
function saveDeploymentRecord(record: DeploymentRecord): void {
  const filePath = getDeploymentRecordPath();
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
  console.log(`Deployment record saved to ${filePath}`);
}

/**
 * Validate executor address format
 */
function validateExecutorAddress(address: string): void {
  if (!address) {
    throw new Error(
      "EXECUTOR_ADDRESS environment variable not set. This should be the backend wallet address (Agent wallet) that will sign settlement intents."
    );
  }

  if (!address.startsWith("0x") || address.length !== 42 || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(
      `Invalid EXECUTOR_ADDRESS format: ${address}. Must be a valid Ethereum address (0x followed by 40 hex characters)`
    );
  }
}

/**
 * Deploy Settlement contract
 */
async function deploySettlement(): Promise<void> {
  console.log("\n=== Deploying Settlement Contract ===\n");

  // Validate network configuration
  validateNetworkConfig(
    network.name as "cronosTestnet" | "cronosMainnet"
  );

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying from account: ${deployer.address}`);
  console.log(`Network: ${network.name}`);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} CRO\n`);

  if (balance === 0n) {
    throw new Error(
      "Insufficient balance. Please fund the deployer account."
    );
  }

  // Load and validate executor address
  const executorAddress = process.env.EXECUTOR_ADDRESS;
  validateExecutorAddress(executorAddress || "");
  console.log(`Executor address (backend wallet): ${executorAddress}\n`);

  try {
    // Deploy Settlement contract
    console.log("Deploying Settlement...");
    const Settlement = await ethers.getContractFactory("Settlement");
    const settlement = await Settlement.deploy(executorAddress);

    // Wait for deployment
    const deploymentTx = settlement.deploymentTransaction();
    if (!deploymentTx) {
      throw new Error("Deployment transaction not found");
    }

    console.log(`Deployment transaction: ${deploymentTx.hash}`);
    await settlement.waitForDeployment();

    const address = await settlement.getAddress();
    const deploymentBlock = await ethers.provider.getBlockNumber();

    console.log(`\nSettlement deployed successfully!`);
    console.log(`Address: ${address}`);
    console.log(`Block: ${deploymentBlock}`);
    console.log(`Tx: ${deploymentTx.hash}`);
    console.log(`Executor: ${executorAddress}\n`);

    // Load and update deployment record
    const record = loadDeploymentRecord();
    record.contracts.Settlement = {
      address,
      deploymentTx: deploymentTx.hash,
      deploymentBlock,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      constructorArgs: [executorAddress],
    };

    saveDeploymentRecord(record);

    // Display contract verification command
    const networkExplorer =
      network.name === "cronosTestnet"
        ? "https://testnet.cronoscan.com"
        : "https://cronoscan.com";

    console.log("=== Next Steps ===");
    console.log(
      `1. View on block explorer: ${networkExplorer}/address/${address}`
    );
    console.log(
      `2. Verify contract: npm run verify:${network.name === "cronosTestnet" ? "testnet" : "mainnet"} -- ${address} --constructor-args scripts/constructor-args.js`
    );
    console.log(
      `3. Update backend .env: SETTLEMENT_CONTRACT_ADDRESS=${address}`
    );
    console.log("");
  } catch (error) {
    console.error("\nDeployment failed with error:");
    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exitCode = 1;
    throw error;
  }
}

/**
 * Main deployment function
 */
async function main() {
  try {
    console.log("Starting deployment...");
    await deploySettlement();
    console.log("Deployment completed successfully!");
  } catch (error) {
    console.error("Deployment process failed");
    process.exitCode = 1;
  }
}

// Execute main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});

