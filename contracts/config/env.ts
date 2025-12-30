/**
 * Environment Configuration with Validation
 * Provides type-safe access to environment variables
 */

import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Validated environment variable with optional default
 */
function getEnvVar(
  key: string,
  defaultValue?: string,
  required: boolean = false
): string {
  const value = process.env[key] || defaultValue;

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value || "";
}

/**
 * Environment configuration object
 */
export const config = {
  // Network RPC endpoints
  networks: {
    cronos: {
      testnet: {
        rpc: getEnvVar(
          "CRONOS_TESTNET_RPC",
          "https://evm-t3.cronos.org"
        ),
        chainId: 338,
        name: "Cronos Testnet",
        explorer: "https://testnet.cronoscan.com",
      },
      mainnet: {
        rpc: getEnvVar(
          "CRONOS_MAINNET_RPC",
          "https://evm-rpc.cronos.org"
        ),
        chainId: 25,
        name: "Cronos Mainnet",
        explorer: "https://cronoscan.com",
      },
    },
  },

  // Private keys
  privateKeys: {
    testnet: getEnvVar("PRIVATE_KEY", ""),
    mainnet: getEnvVar("PRIVATE_KEY_MAINNET", ""),
  },

  // API keys
  apiKeys: {
    etherscan: getEnvVar("ETHERSCAN_API_KEY", ""),
  },

  // Testing configuration
  testing: {
    reportGas: process.env.REPORT_GAS ? true : false,
    gasReportFile: getEnvVar(
      "GAS_REPORT_FILE",
      "gas-report.txt"
    ),
  },

  // Feature flags
  features: {
    coverage: process.env.COVERAGE ? true : false,
    debug: process.env.DEBUG ? true : false,
  },
};

/**
 * Validate configuration for specific network
 */
export function validateNetworkConfig(
  network: "cronosTestnet" | "cronosMainnet"
): void {
  const privateKey =
    network === "cronosTestnet"
      ? config.privateKeys.testnet
      : config.privateKeys.mainnet;

  if (!privateKey) {
    console.warn(
      `No private key configured for ${network}. Deployments will not be possible.`
    );
  }
}

/**
 * Validate all required configuration
 */
export function validateConfig(): void {
  const errors: string[] = [];

  // Check RPC endpoints are accessible
  if (!config.networks.cronos.testnet.rpc) {
    errors.push("Cronos Testnet RPC endpoint not configured");
  }

  if (!config.networks.cronos.mainnet.rpc) {
    errors.push("Cronos Mainnet RPC endpoint not configured");
  }

  if (errors.length > 0) {
    console.error("Configuration validation errors:");
    errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error("Configuration validation failed");
  }
}

/**
 * Get network configuration by name
 */
export function getNetworkConfig(
  networkName: "cronosTestnet" | "cronosMainnet"
) {
  if (networkName === "cronosTestnet") {
    return config.networks.cronos.testnet;
  } else {
    return config.networks.cronos.mainnet;
  }
}

/**
 * Get private key for network (strip 0x prefix if present)
 */
export function getPrivateKey(
  network: "cronosTestnet" | "cronosMainnet"
): string {
  const key =
    network === "cronosTestnet"
      ? config.privateKeys.testnet
      : config.privateKeys.mainnet;

  if (!key) {
    throw new Error(
      `No private key configured for ${network}`
    );
  }

  // Remove 0x prefix if present
  return key.startsWith("0x") ? key.slice(2) : key;
}

/**
 * Check if running in test mode
 */
export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === "test" ||
    process.env.HARDHAT_NETWORK === "hardhat";
}

/**
 * Log configuration summary (without sensitive data)
 */
export function logConfigSummary(): void {
  console.log("\nConfiguration Summary:");
  console.log("======================");
  console.log(
    `Cronos Testnet RPC: ${config.networks.cronos.testnet.rpc}`
  );
  console.log(
    `Cronos Mainnet RPC: ${config.networks.cronos.mainnet.rpc}`
  );
  console.log(
    `Testnet Private Key: ${config.privateKeys.testnet ? "configured" : "NOT CONFIGURED"}`
  );
  console.log(
    `Mainnet Private Key: ${config.privateKeys.mainnet ? "configured" : "NOT CONFIGURED"}`
  );
  console.log(
    `Etherscan API Key: ${config.apiKeys.etherscan ? "configured" : "NOT CONFIGURED"}`
  );
  console.log(
    `Gas Reporting: ${config.testing.reportGas ? "enabled" : "disabled"}`
  );
  console.log("======================\n");
}

export default config;
