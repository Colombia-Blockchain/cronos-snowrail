# Cronos x402 Agentic Treasury - LLM Context Document

> This document provides comprehensive context for LLMs and developers to understand the current state of the project.

## Project Summary

**Cronos x402 Agentic Treasury** is an autonomous AI-driven payment settlement system built on Cronos EVM with **privacy-preserving ZK capabilities**. It enables conditional payments where an AI Agent evaluates conditions (manual triggers or price-based) and executes settlements on the blockchain via the x402 protocol.

**Key Privacy Features:**
- **ZK Mixer**: Privacy-preserving deposits/withdrawals with unlinkable transactions
- **ZK Proofs**: Noir-based proofs for private condition verification
- **Modular Architecture**: LEGO-style swappable ZK providers

**Target:** Cronos x402 Paytech Hackathon (Deadline: Jan 23, 2026)

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Smart Contract (Settlement) | ✅ Deployed | `0xae6E14caD8D4f43947401fce0E4717b8D17b4382` |
| Smart Contract (ZKMixer) | ✅ Deployed | `0xfAef6b16831d961CBd52559742eC269835FF95FF` |
| Backend API | ✅ Complete | Fastify + TypeScript |
| Frontend | ✅ Complete | Next.js 14 |
| MCP Server | ✅ Complete | JSON-RPC 2.0 |
| Crypto.com MCP Integration | ✅ Complete | Price data |
| ZK LEGO Architecture | ✅ Complete | Swappable providers |
| Noir Circuits | ✅ Complete | price_condition, mixer |
| Mixer Service | ✅ Complete | On-chain sync |
| Documentation | ✅ Complete | Multiple docs |
| Demo Video | ❌ Pending | Required for submission |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                    (Next.js 14 + RainbowKit)                    │
│                        Port: 3000                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP
┌─────────────────────────▼───────────────────────────────────────┐
│                         BACKEND                                 │
│                    (Fastify + TypeScript)                       │
│                        Port: 4000                               │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ REST API    │  │ MCP Server  │  │ Services                │  │
│  │ /api/*      │  │ /mcp        │  │ • IntentService         │  │
│  └─────────────┘  └─────────────┘  │ • AgentService          │  │
│                                    │ • WalletService         │  │
│  ┌─────────────┐  ┌─────────────┐  │ • PriceService          │  │
│  │ AI Agent    │  │Orchestrator │  │ • MixerService (ZK)     │  │
│  │ (Decider)   │  │ (Executor)  │  └─────────────────────────┘  │
│  └──────┬──────┘  └─────────────┘                               │
│         │                                                       │
│  ┌──────▼──────────────────────────────────────────────────────┐│
│  │              ZK LEGO MODULES (Swappable)                    ││
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐   ││
│  │  │ IVerifyProvider │  │ IZKProofProvider                │   ││
│  │  │ • MockVerify    │  │ • MockZK / NoirProvider         │   ││
│  │  │ • CronosVerify  │  │ • Circuits: price_condition     │   ││
│  │  └─────────────────┘  └─────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────────────┘
                          │ RPC
┌─────────────────────────▼───────────────────────────────────────┐
│                    CRONOS BLOCKCHAIN                            │
│                                                                 │
│  Settlement.sol: 0xae6E14caD8D4f43947401fce0E4717b8D17b4382     │
│  ZKMixer.sol:    0xfAef6b16831d961CBd52559742eC269835FF95FF     │
│                                                                 │
│                        Port: 4000                               │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ REST API    │  │ MCP Server  │  │ Services                │  │
│  │ /api/*      │  │ /mcp        │  │ • IntentService         │  │
│  └─────────────┘  └─────────────┘  │ • AgentService          │  │
│                                    │ • WalletService         │  │
│  ┌─────────────┐  ┌─────────────┐  │ • PriceService          │  │
│  │ AI Agent    │  │Orchestrator │  └─────────────────────────┘  │
│  │ (Decider)   │  │ (Executor)  │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │ RPC
┌─────────────────────────▼───────────────────────────────────────┐
│                    CRONOS BLOCKCHAIN                            │
│                                                                 │
│  Settlement.sol: 0xae6E14caD8D4f43947401fce0E4717b8D17b4382     │

│  Network: Cronos Testnet (Chain ID: 338)                        │
│  RPC: https://evm-t3.cronos.org                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
cronos-snowrail/
├── apps/
│   ├── backend/                 # Fastify API server
│   │   └── src/
│   │       ├── index.ts         # Server entry point
│   │       ├── agent/
│   │       │   └── agent.ts     # AI decision logic + ZK integration
│   │       ├── api/
│   │       │   ├── routes/      # REST endpoints
│   │       │   │   ├── intents.ts
│   │       │   │   ├── agent.ts
│   │       │   │   └── mixer.ts     # ZK Mixer endpoints
│   │       │   └── controllers/ # Request handlers
│   │       ├── mcp/             # MCP Server
│   │       │   ├── index.ts     # MCP plugin setup
│   │       │   ├── tools.ts     # Tool definitions
│   │       │   └── handlers.ts  # Tool handlers
│   │       ├── services/
│   │       │   ├── intent-service.ts
│   │       │   ├── agent-service.ts
│   │       │   ├── wallet-service.ts
│   │       │   ├── price-service.ts  # Crypto.com MCP + CoinGecko
│   │       │   └── mixer-service.ts  # ZK Mixer with Merkle tree
│   │       ├── zk/                   # ZK LEGO Architecture
│   │       │   ├── index.ts          # Factory initialization
│   │       │   ├── factory.ts        # Provider factory
│   │       │   ├── interfaces/
│   │       │   │   ├── IVerifyProvider.ts
│   │       │   │   └── IZKProofProvider.ts
│   │       │   └── providers/
│   │       │       ├── MockVerifyProvider.ts
│   │       │       ├── CronosVerifyProvider.ts
│   │       │       ├── MockZKProvider.ts
│   │       │       └── NoirProvider.ts
│   │       ├── x402/
│   │       │   └── orchestrator.ts   # Settlement execution
│   │       └── utils/
│   │           ├── crypto.ts         # EIP-712 signing
│   │           └── error-decoder.ts  # Contract error parsing
│   │
│   └── frontend/                # Next.js 14 app
│       └── src/
│           ├── app/             # App Router pages
│           ├── components/      # React components
│           ├── hooks/           # Custom hooks
│           └── services/        # API client
│
├── circuits/                    # Noir ZK Circuits
│   ├── README.md
│   ├── mixer/                   # Mixer privacy circuit
│   │   ├── Nargo.toml
│   │   └── src/main.nr
│   └── price_condition/         # Price threshold circuit
│       ├── Nargo.toml
│       └── src/main.nr
│
├── contracts/                   # Solidity contracts
│   ├── contracts/
│   │   ├── Settlement.sol       # Main settlement contract
│   │   └── ZKMixer.sol          # Privacy mixer with ZK verification
│   ├── scripts/
│   │   ├── deploy.ts
│   │   └── deploy-mixer.ts
│   └── deployments/             # Deployment artifacts
│
├── packages/
│   └── shared-types/            # Shared TypeScript interfaces
│
└── docs/                        # Documentation
    ├── ARCHITECTURE.md
    ├── API_STANDARDS.md
    ├── MCP_INTEGRATION.md
    └── LLM_PROJECT_CONTEXT.md   # THIS FILE
```

---

## Core Concepts

### 1. Payment Intent
A payment intent is the atomic unit representing a conditional payment request.

```typescript
interface PaymentIntent {
  intentId: string;           // UUID
  amount: string;             // In token units (e.g., "1.5")
  currency: string;           // CRO, USDC, USDT
  recipient: string;          // 0x address
  condition: {
    type: 'manual' | 'price-below';
    value: string;            // "true" or price threshold
  };
  status: 'pending' | 'executed' | 'failed';
  createdAt: string;
  txHash?: string;            // Set after execution
}
```

### 2. AI Agent
The agent evaluates conditions and makes autonomous decisions.

- **Input:** Payment Intent + External Data (prices)
- **Output:** `{ decision: 'EXECUTE' | 'SKIP', reason: string }`
- **Constraint:** Never signs transactions directly

**Condition Types:**
- `manual`: Always returns EXECUTE
- `price-below`: Fetches CRO/USD price, compares to threshold

### 3. x402 Orchestrator
Executes settlements when agent approves.

**Flow:**
1. Verify agent decision is EXECUTE
2. Generate intent hash
3. Compute EIP-712 digest
4. Sign with backend wallet
5. Call `Settlement.executeSettlement()` on-chain
6. Wait for confirmation
7. Update intent status

### 4. MCP Server
Exposes treasury functionality to AI assistants via Model Context Protocol.

**Available Tools:**
| Tool | Description |
|------|-------------|
| `create_payment_intent` | Create conditional payment |
| `list_payment_intents` | List all intents |
| `get_payment_intent` | Get intent by ID |
| `trigger_agent` | Evaluate and execute |
| `get_treasury_status` | Get contract status |

---

## API Endpoints

### REST API (Port 4000)

```
POST   /api/intents              Create payment intent
GET    /api/intents              List all intents
GET    /api/intents/:id          Get intent by ID
POST   /api/intents/:id/execute  Execute intent (legacy)
POST   /api/agent/trigger        Trigger agent evaluation

GET    /health                   Health check
GET    /health/ready             Readiness check
```

### MCP Endpoints

```
POST   /mcp                      JSON-RPC 2.0 endpoint
GET    /mcp/tools                Tool discovery (debug)
GET    /mcp/health               MCP health check
```

---

## Smart Contracts

### Settlement.sol - Main Settlement Contract

**Address:** `0xae6E14caD8D4f43947401fce0E4717b8D17b4382`

**Key Function:**
```solidity
function executeSettlement(
    bytes32 intentHash,
    address payable recipient,
    uint256 amount,
    uint256 nonce,
    bytes calldata signature
) external
```

**Security Features:**
- EIP-712 signature verification
- Per-intent nonce tracking (replay prevention)
- Zero address checks
- Balance verification
- Re-execution prevention

### ZKMixer.sol - Privacy Mixer

**Address:** `0xfAef6b16831d961CBd52559742eC269835FF95FF`

**Privacy Model:**
```
┌─────────────────────────────────────────────────────────────┐
│  DEPOSIT                          WITHDRAW                   │
│  ────────                         ────────                   │
│  Alice → commitment → Pool   →   Bob proves knowledge  → Bob │
│                                  of (nullifier, secret)      │
│                                                              │
│  Observers see:                  Observers see:             │
│  ✅ Alice deposited              ✅ Bob withdrew             │
│  ❌ Cannot link to Bob           ❌ Cannot link to Alice     │
└─────────────────────────────────────────────────────────────┘
```

**Key Functions:**
```solidity
function deposit(bytes32 commitment) external payable
function withdraw(
    bytes calldata proof,
    bytes32 root,
    bytes32 nullifierHash,
    address payable recipient,
    address payable relayer,
    uint256 fee
) external
```

**Security Features:**
- Merkle tree commitment scheme
- Nullifier prevents double-spending
- ZK proof verification on-chain
- Root history (30 entries) for async withdrawals

---

## ZK Privacy Architecture (LEGO Modules)

The backend uses a modular "LEGO" architecture for ZK components, allowing easy swapping of providers.

### Interfaces

```typescript
// IVerifyProvider - Identity verification abstraction
interface IVerifyProvider {
  name: string;
  isVerified(address: string): Promise<boolean>;
  getVerificationStatus(address: string): Promise<VerificationResult>;
}

// IZKProofProvider - ZK proof generation abstraction
interface IZKProofProvider {
  name: string;
  supportedCircuits: string[];
  generateProof(input: ZKProofInput): Promise<ZKProof>;
  verifyProofOffChain(proof: ZKProof): Promise<boolean>;
}
```

### Available Providers

| Provider | Type | Description |
|----------|------|-------------|
| `MockVerifyProvider` | Verify | Testing/dev - always returns verified |
| `CronosVerifyProvider` | Verify | Cronos Verify integration (placeholder) |
| `MockZKProvider` | ZK Proof | Testing - generates mock proofs |
| `NoirProvider` | ZK Proof | Real Noir circuit execution |

### Configuration

Set providers via environment variables:

```env
VERIFY_PROVIDER=mock         # mock | cronos-verify
ZK_PROVIDER=mock             # mock | noir
REQUIRE_VERIFICATION=false   # Enable identity checks
USE_ZK_PROOFS=true           # Enable ZK proof generation
```

### Mixer API Endpoints

**IMPORTANT:** Mixer uses frontend signing. Backend prepares TX data, user's wallet signs.

| Endpoint | Method | Who Signs | Description |
|----------|--------|-----------|-------------|
| `/api/mixer/info` | GET | - | Get mixer status and stats |
| `/api/mixer/generate-note` | POST | - | Generate deposit note (save securely!) |
| `/api/mixer/deposit` | POST | **Frontend** | Get deposit TX data |
| `/api/mixer/confirm-deposit` | POST | - | Confirm after frontend execution |
| `/api/mixer/withdraw` | POST | **Frontend** | Get withdraw TX data |
| `/api/mixer/simulate-withdraw` | POST | - | Simulate withdrawal (no execution) |

### Example: Privacy-Preserving Transfer (Frontend Signing)

```bash
# 1. Generate note (SAVE THIS!)
curl -X POST http://localhost:4000/api/mixer/generate-note
# Response: { note: { nullifier, secret, commitment, nullifierHash } }

# 2. Get deposit TX data
curl -X POST http://localhost:4000/api/mixer/deposit \
  -H "Content-Type: application/json" \
  -d '{ "commitment": "0x..." }'
# Response: { tx: { to, data, value } }

# 3. Frontend signs and sends TX
# const tx = await signer.sendTransaction({ to, data, value });

# 4. Confirm deposit
curl -X POST http://localhost:4000/api/mixer/confirm-deposit \
  -H "Content-Type: application/json" \
  -d '{ "txHash": "0x...", "commitment": "0x..." }'
# Response: { leafIndex: 6 } - SAVE THIS!

# 5. Get withdraw TX data
curl -X POST http://localhost:4000/api/mixer/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "note": { "nullifier": "0x...", "secret": "0x...", ... },
    "leafIndex": 6,
    "recipient": "0x..."
  }'
# Response: { tx: { to, data, value } }

# 6. Frontend signs and sends withdraw TX
# const tx = await signer.sendTransaction({ to, data, value, gasLimit: 500000 });
```

---

## External Integrations

### 1. Crypto.com Market Data MCP
- **URL:** `https://mcp.crypto.com/market-data/mcp`
- **Purpose:** Real-time CRO/USD prices for `price-below` conditions
- **Fallback:** CoinGecko API

### 2. Cronos EVM
- **Network:** Testnet (Chain ID: 338)
- **RPC:** `https://evm-t3.cronos.org`
- **Explorer:** `https://explorer.cronos.org/testnet`

---

## Environment Variables

### Backend (.env)
```env
PRIVATE_KEY=0x...                    # Backend wallet private key
SETTLEMENT_CONTRACT_ADDRESS=0x...     # Settlement contract
RPC_URL=https://evm-t3.cronos.org    # Cronos RPC
CHAIN_ID=338                          # Cronos Testnet
USE_REAL_PRICE_API=true              # Enable real price fetching
PORT=4000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Hackathon Tracks Coverage

| Track | Status | How We Cover It |
|-------|--------|-----------------|
| **1. Main Track (x402)** | ✅ | Agent-triggered payments, automated treasury |
| **2. Agentic Finance** | ✅ | Conditional settlements, price-based execution |
| **3. Crypto.com Integration** | ✅ | Crypto.com MCP for market data |
| **4. Dev Tooling** | ✅ | MCP Server exposing treasury tools |

---

## Key Files to Understand

| File | Purpose |
|------|---------|
| `apps/backend/src/index.ts` | Server setup, route registration |
| `apps/backend/src/agent/agent.ts` | AI decision logic + ZK integration |
| `apps/backend/src/x402/orchestrator.ts` | Settlement execution |
| `apps/backend/src/mcp/index.ts` | MCP server plugin |
| `apps/backend/src/services/price-service.ts` | Crypto.com MCP + CoinGecko |
| `apps/backend/src/services/mixer-service.ts` | ZK Mixer with Merkle tree |
| `apps/backend/src/zk/factory.ts` | ZK provider factory |
| `apps/backend/src/zk/interfaces/IZKProofProvider.ts` | ZK proof abstraction |
| `apps/backend/src/api/routes/mixer.ts` | Mixer API endpoints |
| `contracts/contracts/Settlement.sol` | On-chain settlement |
| `contracts/contracts/ZKMixer.sol` | Privacy mixer contract |
| `circuits/mixer/src/main.nr` | Noir mixer circuit |

---

## Running the Project

```bash
# Install dependencies
npm install

# Start backend (port 4000)
cd apps/backend && npm run dev

# Start frontend (port 3000)
cd apps/frontend && npm run dev

# Build everything
npm run build
```

---

## Testing MCP

```bash
# Health check
curl http://localhost:4000/mcp/health

# List tools
curl http://localhost:4000/mcp/tools

# Create intent via MCP
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "create_payment_intent",
      "arguments": {
        "amount": "0.1",
        "currency": "CRO",
        "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f5eE0B",
        "conditionType": "manual",
        "conditionValue": "true"
      }
    },
    "id": 1
  }'
```

---

## What's Missing

1. **Demo Video** - Required for hackathon submission
2. **DoraHacks Registration** - Submit to platform

---

## Recent Changes

### Jan 5, 2026 - Frontend Signing for Mixer

1. **Mixer Endpoints Updated** - Users sign their own transactions
   - `/api/mixer/deposit` now returns TX data for frontend signing
   - `/api/mixer/withdraw` now returns TX data for frontend signing
   - New `/api/mixer/confirm-deposit` endpoint to confirm after frontend execution
   - Backend no longer signs mixer transactions

2. **Signing Model**:
   | Component | Who Signs |
   |-----------|-----------|
   | Mixer deposit/withdraw | Frontend (user's wallet) |
   | Settlement intents | Backend (agent wallet) |

3. **Tested on Cronos Testnet**:
   - Deposit TX: `0x8d4163b360ba79a78703c92f55482333d85899f9a64eef5ea4156e6b433e5cc4`
   - Withdraw TX: `0x55f25745b19389f00cbe4160fdd8500b65e0ee7984bc0fbde021a3141c6df88e`

### Jan 3, 2026 - ZK Privacy Integration

1. **ZKMixer Contract** - Deployed at `0xfAef6b16831d961CBd52559742eC269835FF95FF`
   - Privacy-preserving deposits/withdrawals
   - Merkle tree commitment scheme
   - ZK proof verification on-chain

2. **ZK LEGO Architecture** - Modular provider system
   - `IVerifyProvider` interface for identity verification
   - `IZKProofProvider` interface for ZK proof generation
   - Factory pattern for easy swapping

3. **Mixer Service** - Backend service for mixer operations
   - On-chain sync with batched event queries
   - Local Merkle tree management
   - Withdrawal proof generation

4. **Noir Circuits** - ZK circuits for privacy
   - `price_condition`: Private price thresholds
   - `mixer`: Privacy-preserving transfers

### Jan 2, 2026 - MCP Integration

1. Added MCP Server with 5 tools
2. Integrated Crypto.com Market Data MCP for prices
3. Added CoinGecko as fallback price source
4. Created PriceService with caching
5. Added MCP documentation

---

## Contact & Resources

- **Hackathon:** Cronos x402 Paytech Hackathon
- **Deadline:** January 23, 2026
- **Discord:** https://discord.com/channels/783264383978569728/1442807140103487610
- **Cronos Docs:** https://docs.cronos.org
