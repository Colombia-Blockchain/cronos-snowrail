# Cronos Snow Rail - LLM API Reference

Complete API documentation for AI/LLM integration with the Cronos Agentic Treasury system.

## Overview

Snow Rail is an autonomous treasury system on Cronos blockchain that enables:
- **Payment Intents**: Conditional payments with AI agent evaluation
- **Privacy Mixer**: ZK-SNARK based private transfers (deposit/withdraw)
- **MCP Protocol**: Model Context Protocol for AI assistant integration

**Base URL**: `http://localhost:4000` (development)
**Network**: Cronos Testnet (Chain ID: 338)

---

## Table of Contents

1. [Health Check Endpoints](#health-check-endpoints)
2. [Payment Intent Endpoints](#payment-intent-endpoints)
3. [Agent Endpoints](#agent-endpoints)
4. [Mixer (Privacy) Endpoints](#mixer-privacy-endpoints)
5. [MCP Protocol Endpoints](#mcp-protocol-endpoints)
6. [Smart Contract: Settlement](#smart-contract-settlement)
7. [Data Types](#data-types)
8. [Error Codes](#error-codes)

---

## Health Check Endpoints

### GET /health

Basic health check to verify the server is running.

**Request**: None

**Response** (200 OK):
```json
{
  "status": "success",
  "code": "HEALTH_CHECK_OK",
  "message": "Backend server is running",
  "data": {
    "uptime": 78784.23,
    "timestamp": "2026-01-04T23:08:46.099Z",
    "version": "0.0.1",
    "environment": "production",
    "network": "Cronos Testnet"
  }
}
```

### GET /health/ready

Readiness check including all service initialization status.

**Request**: None

**Response** (200 OK):
```json
{
  "status": "success",
  "code": "READINESS_CHECK_OK",
  "message": "System is ready for E2E testing",
  "data": {
    "timestamp": "2026-01-04T23:08:59.866Z",
    "services": {
      "wallet": { "initialized": true },
      "agent": { "initialized": true }
    },
    "environment": {
      "network": "Cronos Testnet",
      "chainId": "338"
    },
    "zk": {
      "initialized": true,
      "verifyProvider": { "name": "mock-verify", "healthy": true },
      "zkProvider": { "name": "mock-zk", "healthy": true }
    },
    "mixer": {
      "enabled": true,
      "contractAddress": "0xfAef6b16831d961CBd52559742eC269835FF95FF"
    }
  }
}
```

---

## Payment Intent Endpoints

### POST /api/intents

Create a new payment intent for conditional execution.

**Request Body**:
```json
{
  "amount": "0.001",
  "currency": "CRO",
  "recipient": "0x0000000000000000000000000000000000000001",
  "condition": {
    "type": "manual",
    "value": "true"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | string | Yes | Payment amount in token units (e.g., "1.5") |
| `currency` | string | Yes | Token symbol: `CRO`, `USDC`, or `USDT` |
| `recipient` | string | Yes | Ethereum address (0x + 40 hex chars) |
| `condition.type` | string | Yes | `manual` or `price-below` |
| `condition.value` | string | Yes | `"true"` for manual, USD price for price-below |

**Condition Types**:
- `manual`: Always executes when triggered
- `price-below`: Executes only when CRO/USD price is below threshold

**Response** (201 Created):
```json
{
  "status": "success",
  "code": "INTENT_CREATED",
  "message": "Payment intent successfully created",
  "data": {
    "intentId": "74b62399-7c26-4c05-9df7-93bacd0bdd1f",
    "amount": "0.001",
    "currency": "CRO",
    "recipient": "0x0000000000000000000000000000000000000001",
    "condition": {
      "type": "manual",
      "value": "true"
    },
    "status": "pending",
    "createdAt": "2026-01-04T23:09:21.815Z",
    "agentDecision": {
      "decision": "EXECUTE",
      "reason": "Manual condition - always execute"
    }
  }
}
```

### GET /api/intents

List all payment intents.

**Request**: None

**Response** (200 OK):
```json
{
  "status": "success",
  "code": "INTENTS_RETRIEVED",
  "message": "Retrieved 3 payment intent(s)",
  "data": [
    {
      "intentId": "74b62399-7c26-4c05-9df7-93bacd0bdd1f",
      "amount": "0.001",
      "currency": "CRO",
      "recipient": "0x...",
      "condition": { "type": "manual", "value": "true" },
      "status": "pending",
      "createdAt": "2026-01-04T23:09:21.815Z"
    }
  ]
}
```

### GET /api/intents/:id

Retrieve a specific payment intent by ID.

**Path Parameters**:
- `id` (string): UUID of the payment intent

**Response** (200 OK):
```json
{
  "status": "success",
  "code": "INTENT_RETRIEVED",
  "message": "Payment intent successfully retrieved",
  "data": {
    "intentId": "74b62399-7c26-4c05-9df7-93bacd0bdd1f",
    "amount": "0.001",
    "currency": "CRO",
    "recipient": "0x...",
    "condition": { "type": "manual", "value": "true" },
    "status": "pending",
    "createdAt": "2026-01-04T23:09:21.815Z"
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "status": "error",
  "code": "INTENT_NOT_FOUND",
  "message": "Payment intent not found"
}
```

### POST /api/intents/:id/execute

Execute a payment intent directly (bypasses agent evaluation).

**Path Parameters**:
- `id` (string): UUID of the payment intent

**Request Body**: None

**Response** (200 OK):
```json
{
  "status": "success",
  "code": "INTENT_EXECUTED",
  "message": "Payment intent executed successfully",
  "data": {
    "intentId": "16e19ffa-1b3f-44bc-a35b-0a394152024d",
    "amount": "0.001",
    "currency": "CRO",
    "recipient": "0x0000000000000000000000000000000000000001",
    "status": "executed",
    "txHash": "0x021b468b95ce36bb57f8bdcb4a09a66525f4a2edab8db56fe62976ee37906afe",
    "agentDecision": {
      "decision": "EXECUTE",
      "reason": "Manual condition - always execute"
    }
  }
}
```

---

## Agent Endpoints

### POST /api/agent/trigger

Trigger the AI agent to evaluate and execute a payment intent.

**Request Body**:
```json
{
  "intentId": "80ec7223-cde4-440e-9efc-d914fe32392e"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `intentId` | string | Yes | UUID of the payment intent |

**Response** (200 OK - Executed):
```json
{
  "status": "success",
  "code": "AGENT_EXECUTED",
  "message": "Payment intent executed successfully by agent",
  "data": {
    "intentId": "80ec7223-cde4-440e-9efc-d914fe32392e",
    "amount": "0.001",
    "currency": "CRO",
    "recipient": "0x0000000000000000000000000000000000000002",
    "condition": {
      "type": "price-below",
      "value": "1.0"
    },
    "status": "executed",
    "txHash": "0x19ced3dd5db0c32d51834666bfb33e9f2cf195e8a2fd4bccd4a5b22fc06397af",
    "agentDecision": {
      "decision": "EXECUTE",
      "reason": "Price 0.08 meets condition (below threshold)"
    }
  }
}
```

**Response** (202 Accepted - Skipped):
```json
{
  "status": "warning",
  "code": "AGENT_SKIPPED",
  "message": "Agent decided not to execute payment intent",
  "data": {
    "intentId": "...",
    "status": "pending",
    "agentDecision": {
      "decision": "SKIP",
      "reason": "Price 0.15 does not meet condition (not below 0.10)"
    }
  }
}
```

---

## Mixer (Privacy) Endpoints

The mixer enables private transfers using ZK-SNARKs. Users deposit a fixed amount, then withdraw to any address without on-chain linkability.

**IMPORTANT:** Mixer endpoints return TX data for the **frontend wallet to sign and execute**. The backend does NOT sign mixer transactions - users control their own funds.

### Signing Model

| Endpoint | Who Signs | Description |
|----------|-----------|-------------|
| `/api/mixer/deposit` | **Frontend** (user's wallet) | User deposits their own funds |
| `/api/mixer/withdraw` | **Frontend** (user's wallet) | User withdraws to any address |
| `/api/intents/:id/execute` | Backend (agent wallet) | Agent executes from pool |
| `/api/agent/trigger` | Backend (agent wallet) | Agent executes from pool |

### GET /api/mixer/info

Get mixer contract information and local Merkle tree state.

**Request**: None

**Response** (200 OK):
```json
{
  "status": "success",
  "code": "MIXER_INFO",
  "message": "Mixer information retrieved",
  "data": {
    "denomination": "0.1 CRO",
    "localDepositCount": 7,
    "localRoot": "0x0e4b9c97bbfeedd188653309a61ea97d52ad42f9307ad91db0271a707c7831f2",
    "onChain": {
      "contractAddress": "0xfAef6b16831d961CBd52559742eC269835FF95FF",
      "currentRoot": "0x0e4b9c97bbfeedd188653309a61ea97d52ad42f9307ad91db0271a707c7831f2",
      "depositCount": 7,
      "denomination": "0.1 CRO"
    },
    "privacyModel": {
      "description": "Deposit funds, withdraw to any address without link",
      "anonymitySet": 7
    }
  }
}
```

### POST /api/mixer/generate-note

Generate a new deposit note. **SAVE THIS SECURELY - required for withdrawal**.

**Request Body**: None

**Response** (200 OK):
```json
{
  "status": "success",
  "code": "NOTE_GENERATED",
  "message": "Deposit note generated - SAVE THIS SECURELY!",
  "data": {
    "note": {
      "nullifier": "0xdbc6a36ae3a40885ef2caa5c8d4eedd48313b1909f554e7d9567c56bd44e43f2",
      "secret": "0x6b62b2870810dd6452b49d9907bd51583a9ce44c72398dfdeac7cc7a50319f31",
      "commitment": "0xbee39522c740cace6820e7d22d7feb9a6b084b4f20d22b3594acc789bf722a3a",
      "nullifierHash": "0x3803dad3099dd63d4e1329952acd15196c25694a60856c93099ed1cb208f3533"
    },
    "warning": "This note is required for withdrawal. If lost, funds cannot be recovered!",
    "instructions": [
      "1. Save this note in a secure location",
      "2. Use the commitment to deposit funds",
      "3. After deposit, use the note to withdraw to any address"
    ]
  }
}
```

### POST /api/mixer/deposit

Prepare deposit TX data. **Frontend must sign and broadcast.**

**Request Body**:
```json
{
  "commitment": "0xbee39522c740cace6820e7d22d7feb9a6b084b4f20d22b3594acc789bf722a3a"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `commitment` | string | Yes | Hex commitment from generated note |

**Response** (200 OK):
```json
{
  "status": "success",
  "code": "DEPOSIT_TX_PREPARED",
  "message": "Deposit transaction prepared. Sign and send from your wallet.",
  "data": {
    "tx": {
      "to": "0xfAef6b16831d961CBd52559742eC269835FF95FF",
      "data": "0xb214faa5...",
      "value": "100000000000000000"
    },
    "commitment": "0xbee39522c740cace6820e7d22d7feb9a6b084b4f20d22b3594acc789bf722a3a",
    "amount": "0.1 CRO",
    "instructions": [
      "1. Sign this transaction with your connected wallet",
      "2. After confirmation, call /mixer/confirm-deposit with txHash",
      "3. Save your note securely for withdrawal"
    ]
  }
}
```

**Frontend Usage (ethers.js):**
```typescript
const { tx } = response.data;
const transaction = await signer.sendTransaction({
  to: tx.to,
  data: tx.data,
  value: tx.value
});
await transaction.wait();
// Then call /mixer/confirm-deposit with txHash
```

### POST /api/mixer/confirm-deposit

Confirm deposit after frontend executes TX. Updates local Merkle tree.

**Request Body**:
```json
{
  "txHash": "0x8d4163b360ba79a78703c92f55482333d85899f9a64eef5ea4156e6b433e5cc4",
  "commitment": "0xbee39522c740cace6820e7d22d7feb9a6b084b4f20d22b3594acc789bf722a3a"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `txHash` | string | Yes | Transaction hash from frontend execution |
| `commitment` | string | Yes | Original commitment from note |

**Response** (200 OK):
```json
{
  "status": "success",
  "code": "DEPOSIT_CONFIRMED",
  "message": "Deposit confirmed and recorded",
  "data": {
    "txHash": "0x8d4163b360ba79a78703c92f55482333d85899f9a64eef5ea4156e6b433e5cc4",
    "leafIndex": 6,
    "commitment": "0xbee39522c740cace6820e7d22d7feb9a6b084b4f20d22b3594acc789bf722a3a",
    "instructions": [
      "Save leafIndex: 6 with your note",
      "You can now withdraw to any address"
    ]
  }
}
```

### POST /api/mixer/withdraw

Prepare withdraw TX data. **Frontend must sign and broadcast.**

**Request Body**:
```json
{
  "note": {
    "nullifier": "0xdbc6a36ae3a40885ef2caa5c8d4eedd48313b1909f554e7d9567c56bd44e43f2",
    "secret": "0x6b62b2870810dd6452b49d9907bd51583a9ce44c72398dfdeac7cc7a50319f31",
    "commitment": "0xbee39522c740cace6820e7d22d7feb9a6b084b4f20d22b3594acc789bf722a3a",
    "nullifierHash": "0x3803dad3099dd63d4e1329952acd15196c25694a60856c93099ed1cb208f3533"
  },
  "leafIndex": 6,
  "recipient": "0x40C7fa08031dB321245a2f96E6064D2cF269f18B",
  "relayer": "0x0000000000000000000000000000000000000000",
  "fee": "0"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `note` | object | Yes | The complete deposit note |
| `note.nullifier` | string | Yes | Random nullifier (hex) |
| `note.secret` | string | Yes | Random secret (hex) |
| `note.commitment` | string | Yes | Poseidon hash of nullifier+secret |
| `note.nullifierHash` | string | Yes | Hash of nullifier for double-spend prevention |
| `leafIndex` | number | Yes | Index returned from confirm-deposit |
| `recipient` | string | Yes | Address to receive funds |
| `relayer` | string | No | Relayer address (default: zero address) |
| `fee` | string | No | Relayer fee (default: "0") |

**Response** (200 OK):
```json
{
  "status": "success",
  "code": "WITHDRAW_TX_PREPARED",
  "message": "Withdrawal transaction prepared. Sign and send from your wallet.",
  "data": {
    "tx": {
      "to": "0xfAef6b16831d961CBd52559742eC269835FF95FF",
      "data": "0xf9eed560...",
      "value": "0"
    },
    "recipient": "0x40C7fa08031dB321245a2f96E6064D2cF269f18B",
    "amount": "0.1 CRO",
    "privacy": "Withdrawal will be unlinkable to your deposit",
    "instructions": [
      "1. Sign this transaction with your connected wallet",
      "2. Funds will be sent to the recipient address",
      "3. No on-chain link between deposit and withdrawal"
    ]
  }
}
```

**Frontend Usage (ethers.js):**
```typescript
const { tx } = response.data;
const transaction = await signer.sendTransaction({
  to: tx.to,
  data: tx.data,
  value: tx.value,
  gasLimit: 500000  // Recommended for withdraw
});
await transaction.wait();
```

### POST /api/mixer/simulate-withdraw

Simulate withdrawal to generate proof without executing on-chain.

**Request Body**: Same as `/api/mixer/withdraw`

**Response** (200 OK):
```json
{
  "status": "success",
  "code": "SIMULATION_SUCCESS",
  "message": "Withdrawal simulation successful",
  "data": {
    "proof": "0x...",
    "root": "0x...",
    "nullifierHash": "0x...",
    "recipient": "0x...",
    "relayer": "0x...",
    "fee": "0",
    "canExecute": true
  }
}
```

---

## MCP Protocol Endpoints

Model Context Protocol (MCP) enables AI assistants to interact with the treasury.

### GET /mcp/health

Health check for MCP endpoint.

**Response** (200 OK):
```json
{
  "status": "ok",
  "server": "cronos-x402-treasury",
  "version": "1.0.0",
  "protocol": "2024-11-05"
}
```

### GET /mcp/tools

List all available MCP tools.

**Response** (200 OK):
```json
{
  "server": {
    "name": "cronos-x402-treasury",
    "version": "1.0.0"
  },
  "protocolVersion": "2024-11-05",
  "tools": [
    {
      "name": "create_payment_intent",
      "description": "Create a new payment intent...",
      "inputSchema": { ... }
    },
    {
      "name": "list_payment_intents",
      "description": "List all payment intents...",
      "inputSchema": { ... }
    },
    {
      "name": "get_payment_intent",
      "description": "Get a specific payment intent...",
      "inputSchema": { ... }
    },
    {
      "name": "trigger_agent",
      "description": "Trigger agent to evaluate and execute...",
      "inputSchema": { ... }
    },
    {
      "name": "get_treasury_status",
      "description": "Get treasury balance and status...",
      "inputSchema": { ... }
    }
  ]
}
```

### POST /mcp

JSON-RPC 2.0 endpoint for MCP protocol.

#### Method: tools/call - get_treasury_status

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_treasury_status",
    "arguments": {}
  }
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"treasury\":{\"settlementContract\":\"0xae6E14caD8D4f43947401fce0E4717b8D17b4382\",\"backendWallet\":\"0x40C7fa08031dB321245a2f96E6064D2cF269f18B\",\"balance\":\"47.345645675 CRO\"}}"
    }]
  }
}
```

#### Method: tools/call - create_payment_intent

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_payment_intent",
    "arguments": {
      "amount": "0.001",
      "currency": "CRO",
      "recipient": "0x0000000000000000000000000000000000000004",
      "conditionType": "manual",
      "conditionValue": "true"
    }
  }
}
```

#### Method: tools/call - trigger_agent

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "trigger_agent",
    "arguments": {
      "intentId": "45269aca-3adb-4531-8e83-26cbbdc5752a"
    }
  }
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"message\":\"Payment intent executed successfully by agent\",\"intentId\":\"45269aca-3adb-4531-8e83-26cbbdc5752a\",\"status\":\"executed\",\"txHash\":\"0xcb929fc217172a57646bef3199a414efece79ac3766e8744fae1185499aebcc8\"}"
    }]
  }
}
```

---

## Smart Contract: Settlement

The Settlement contract holds treasury funds and executes authorized transfers with EIP-712 signature verification.

### Contract Address
- **Testnet**: `0xae6E14caD8D4f43947401fce0E4717b8D17b4382`

### Contract Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISettlement {
    // ============ Events ============
    event PaymentExecuted(bytes32 indexed intentHash, address indexed recipient, uint256 amount);
    event Deposited(address indexed sender, uint256 amount);
    event ExecutorUpdated(address indexed oldExecutor, address indexed newExecutor);

    // ============ Errors ============
    error InsufficientBalance(uint256 requested, uint256 available);
    error IntentAlreadyExecuted(bytes32 intentHash);
    error Unauthorized(address caller);
    error TransferFailed(address recipient, uint256 amount);
    error ZeroAddress();
    error ZeroAmount();
    error InvalidSignature();
    error InvalidSigner(address recovered, address expected);
    error InvalidNonce(bytes32 intentHash, uint256 provided, uint256 expected);

    // ============ State Variables ============
    function owner() external view returns (address);
    function executor() external view returns (address);
    function executedIntents(bytes32 intentHash) external view returns (bool);
    function intentNonces(bytes32 intentHash) external view returns (uint256);

    // ============ Main Function ============
    function executeSettlement(
        bytes32 intentHash,
        address payable recipient,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external;

    // ============ View Functions ============
    function getBalance() external view returns (uint256);
    function isIntentExecuted(bytes32 intentHash) external view returns (bool);
    function getIntentNonce(bytes32 intentHash) external view returns (uint256);

    // ============ Admin Functions ============
    function updateExecutor(address newExecutor) external;

    // ============ Receive ETH ============
    receive() external payable;
}
```

### EIP-712 Signature Structure

The contract uses EIP-712 typed data for signature verification:

```
Domain:
  name: "CronosSettlement"
  version: "1"
  chainId: 338 (testnet)
  verifyingContract: <contract address>

Types:
  Settlement:
    - bytes32 intentHash
    - address recipient
    - uint256 amount
    - uint256 nonce
```

### Function: executeSettlement

Executes a settlement transfer with signature verification.

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `intentHash` | bytes32 | Hash of the payment intent (used as unique ID) |
| `recipient` | address payable | Address to receive the funds |
| `amount` | uint256 | Amount of CRO to transfer (in wei) |
| `nonce` | uint256 | Current nonce for this intent (prevents replay) |
| `signature` | bytes | EIP-712 signature from executor |

**Execution Flow**:
1. Verify nonce matches `intentNonces[intentHash]`
2. Construct EIP-712 typed data hash
3. Recover signer from signature
4. Verify signer is authorized executor
5. Increment nonce (prevents signature replay)
6. Validate recipient and amount
7. Check intent not already executed
8. Verify sufficient balance
9. Mark intent as executed
10. Transfer CRO to recipient
11. Emit `PaymentExecuted` event

**Revert Conditions**:
- `InvalidNonce`: Nonce doesn't match expected value
- `InvalidSigner`: Signature not from authorized executor
- `ZeroAddress`: Recipient is zero address
- `ZeroAmount`: Amount is zero
- `IntentAlreadyExecuted`: Intent already executed
- `InsufficientBalance`: Contract balance too low
- `TransferFailed`: CRO transfer failed

---

## Data Types

### PaymentIntent

```typescript
interface PaymentIntent {
  intentId: string;           // UUID
  amount: string;             // Numeric string (e.g., "1.5")
  currency: string;           // 'CRO' | 'USDC' | 'USDT'
  recipient: string;          // Ethereum address (0x...)
  condition: {
    type: 'manual' | 'price-below';
    value: string;            // "true" for manual, price for price-below
  };
  status: 'pending' | 'executed' | 'failed';
  createdAt: string;          // ISO 8601 timestamp
  txHash?: string;            // Transaction hash (if executed)
}
```

### AgentDecision

```typescript
interface AgentDecision {
  decision: 'EXECUTE' | 'SKIP';
  reason: string;
  verificationStatus?: {
    checked: boolean;
    verified: boolean;
  };
}
```

### DepositNote

```typescript
interface DepositNote {
  nullifier: string;          // 0x-prefixed hex (32 bytes)
  secret: string;             // 0x-prefixed hex (32 bytes)
  commitment: string;         // Poseidon(nullifier, secret)
  nullifierHash: string;      // Hash for double-spend prevention
}
```

### ApiResponse

```typescript
interface ApiResponse<T = unknown> {
  status: 'success' | 'warning' | 'error';
  code: string;               // Specific response code
  message: string;            // Human-readable message
  data?: T;                   // Response payload
  details?: Record<string, unknown>;  // Additional details (errors)
}
```

---

## Error Codes

### Intent Errors
| Code | HTTP | Description |
|------|------|-------------|
| `INTENT_CREATED` | 201 | Payment intent created successfully |
| `INTENT_RETRIEVED` | 200 | Intent retrieved successfully |
| `INTENTS_RETRIEVED` | 200 | Intent list retrieved |
| `INTENT_EXECUTED` | 200 | Intent executed on-chain |
| `INTENT_NOT_FOUND` | 404 | Intent ID does not exist |
| `INTENT_ALREADY_COMPLETED` | 409 | Intent already executed |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `EXECUTION_FAILED` | 500 | On-chain execution failed |

### Agent Errors
| Code | HTTP | Description |
|------|------|-------------|
| `AGENT_EXECUTED` | 200 | Agent executed the intent |
| `AGENT_SKIPPED` | 202 | Agent decided not to execute |

### Mixer Errors
| Code | HTTP | Description |
|------|------|-------------|
| `MIXER_INFO` | 200 | Mixer info retrieved |
| `NOTE_GENERATED` | 200 | Deposit note generated |
| `DEPOSIT_TX_PREPARED` | 200 | Deposit TX ready for frontend signing |
| `DEPOSIT_CONFIRMED` | 200 | Deposit confirmed after frontend execution |
| `WITHDRAW_TX_PREPARED` | 200 | Withdraw TX ready for frontend signing |
| `COMMITMENT_REQUIRED` | 400 | Missing commitment in request |
| `INVALID_NOTE` | 400 | Note data is invalid |
| `INVALID_RECIPIENT` | 400 | Recipient address invalid |
| `ALREADY_WITHDRAWN` | 400 | Note already used for withdrawal |
| `INVALID_ROOT` | 400 | Merkle root not recognized |
| `TX_NOT_FOUND` | 400 | Transaction hash not found on-chain |
| `TX_FAILED` | 400 | Transaction failed on-chain |
| `DEPOSIT_EVENT_NOT_FOUND` | 400 | Deposit event not in transaction |
| `MIXER_NOT_DEPLOYED` | 500 | Mixer contract not available |

---

## Example Workflows

### 1. Create and Execute Payment Intent (Backend signs)

```bash
# Step 1: Create intent
curl -X POST http://localhost:4000/api/intents \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "0.001",
    "currency": "CRO",
    "recipient": "0x0000000000000000000000000000000000000001",
    "condition": {"type": "manual", "value": "true"}
  }'

# Step 2: Trigger agent (backend signs and executes)
curl -X POST http://localhost:4000/api/agent/trigger \
  -H "Content-Type: application/json" \
  -d '{"intentId": "<returned-uuid>"}'
```

### 2. Private Transfer via Mixer (Frontend signs)

```bash
# Step 1: Generate note (SAVE THIS!)
NOTE=$(curl -s -X POST http://localhost:4000/api/mixer/generate-note)
echo $NOTE | jq .data.note

# Step 2: Get deposit TX data
TX_DATA=$(curl -s -X POST http://localhost:4000/api/mixer/deposit \
  -H "Content-Type: application/json" \
  -d '{"commitment": "<commitment-from-note>"}')
echo $TX_DATA | jq .data.tx

# Step 3: Frontend signs and sends TX (ethers.js example)
# const tx = await signer.sendTransaction({ to, data, value });
# const txHash = tx.hash;

# Step 4: Confirm deposit with txHash
curl -X POST http://localhost:4000/api/mixer/confirm-deposit \
  -H "Content-Type: application/json" \
  -d '{"txHash": "<tx-hash>", "commitment": "<commitment>"}'
# Response includes leafIndex - SAVE THIS!

# Step 5: Get withdraw TX data
WITHDRAW_TX=$(curl -s -X POST http://localhost:4000/api/mixer/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "note": { <full-note-object> },
    "leafIndex": <from-confirm-deposit>,
    "recipient": "0x..."
  }')
echo $WITHDRAW_TX | jq .data.tx

# Step 6: Frontend signs and sends withdraw TX
# const tx = await signer.sendTransaction({ to, data, value, gasLimit: 500000 });
```

### 3. MCP Integration

```bash
# Get treasury status
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {"name": "get_treasury_status", "arguments": {}}
  }'

# Create and execute via MCP
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "create_payment_intent",
      "arguments": {
        "amount": "0.001",
        "currency": "CRO",
        "recipient": "0x...",
        "conditionType": "manual",
        "conditionValue": "true"
      }
    }
  }'
```

---

## Contract Addresses (Testnet)

| Contract | Address |
|----------|---------|
| Settlement | `0xae6E14caD8D4f43947401fce0E4717b8D17b4382` |
| ZKMixer | `0xfAef6b16831d961CBd52559742eC269835FF95FF` |

**Explorer**: https://explorer.cronos.org/testnet

---

## Rate Limits & Best Practices

1. **No rate limits** in development mode
2. **Always save deposit notes** - they cannot be recovered
3. **Use checksummed addresses** to avoid validation errors
4. **Check intent status** before re-executing
5. **Monitor txHash** on explorer for confirmation
