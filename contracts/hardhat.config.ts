import { HardhatUserConfig } from "hardhat/config";
import { HttpNetworkUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Validate required environment variable
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Network configuration builder with consistent settings
 */
function getNetworkConfig(
  rpcUrl: string,
  privateKey?: string
): HttpNetworkUserConfig {
  return {
    url: rpcUrl,
    accounts: privateKey ? [privateKey] : [],
    chainId: undefined, // Will be auto-detected
    gasPrice: "auto",
    timeout: 40000,
  };
}

/**
 * Production-ready Hardhat configuration
 * Supports:
 * - Hardhat local network (for testing)
 * - Cronos Testnet
 * - Cronos Mainnet
 */
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  },

  networks: {
    // Local hardhat network for testing
    hardhat: {
      chainId: 31337,
      gasPrice: 875000000,
      initialBaseFeePerGas: 0,
      allowUnlimitedContractSize: true,
      accounts: {
        mnemonic:
          "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },

    // Cronos Testnet
    cronosTestnet: getNetworkConfig(
      getEnvVar("CRONOS_TESTNET_RPC", "https://evm-t3.cronos.org"),
      process.env.PRIVATE_KEY
    ),

    // Cronos Mainnet
    cronosMainnet: getNetworkConfig(
      getEnvVar("CRONOS_MAINNET_RPC", "https://evm-rpc.cronos.org"),
      process.env.PRIVATE_KEY_MAINNET
    ),
  },

  // Path configuration for artifacts and cache
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },

  // Compiler settings
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },

  // Etherscan/Cronoscan verification
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

  // Gas reporting settings
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    outputFile: process.env.GAS_REPORT_FILE || "gas-report.txt",
  },

  // Mocha test configuration
  mocha: {
    timeout: 40000,
    reporter: "spec",
  },
};

export default config;
