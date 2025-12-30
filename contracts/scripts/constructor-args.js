// Constructor arguments for Settlement contract verification
// This file is used by hardhat verify to pass constructor arguments to Cronoscan

const executorAddress = process.env.EXECUTOR_ADDRESS;

if (!executorAddress) {
  throw new Error(
    "EXECUTOR_ADDRESS environment variable is required for contract verification"
  );
}

// Validate address format
if (!executorAddress.startsWith("0x") || executorAddress.length !== 42 || !/^0x[0-9a-fA-F]{40}$/.test(executorAddress)) {
  throw new Error(
    `Invalid EXECUTOR_ADDRESS format: ${executorAddress}. Must be a valid Ethereum address (0x followed by 40 hex characters)`
  );
}

module.exports = [executorAddress];
