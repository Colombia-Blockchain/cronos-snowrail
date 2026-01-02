# Cronos x402 Agentic Treasury - LLM Context Document

> This document provides comprehensive context for LLMs and developers to understand the current state of the project.

## Project Summary

**Cronos x402 Agentic Treasury** is an autonomous AI-driven payment settlement system built on Cronos EVM. It enables conditional payments where an AI Agent evaluates conditions (manual triggers or price-based) and executes settlements on the blockchain via the x402 protocol.

**Target:** Cronos x402 Paytech Hackathon (Deadline: Jan 23, 2026)

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Smart Contract | ✅ Deployed | Cronos Testnet |
| Backend API | ✅ Complete | Fastify + TypeScript |
| Frontend | ✅ Complete | Next.js 14 |
| MCP Server | ✅ Complete | JSON-RPC 2.0 |
| Crypto.com MCP Integration | ✅ Complete | Price data |
| Documentation | ✅ Complete | Multiple docs |
| Demo Video | ❌ Pending | Required for submission |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Next.js 14 + RainbowKit)                    │
│                        Port: 3000                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP
┌─────────────────────────▼───────────────────────────────────────┐
│                         BACKEND                                  │
│                    (Fastify + TypeScript)                       │
│                        Port: 4000                                │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ REST API    │  │ MCP Server  │  │ Services                │ │
│  │ /api/*      │  │ /mcp        │  │ • IntentService         │ │
│  └─────────────┘  └─────────────┘  │ • AgentService          │ │
│                                     │ • WalletService         │ │
│  ┌─────────────┐  ┌─────────────┐  │ • PriceService          │ │
│  │ AI Agent    │  │Orchestrator │  └─────────────────────────┘ │
│  │ (Decider)   │  │ (Executor)  │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │ RPC
┌─────────────────────────▼───────────────────────────────────────┐
│                    CRONOS BLOCKCHAIN                             │
│                                                                  │
│  Settlement.sol: 0xae6E14caD8D4f43947401fce0E4717b8D17b4382    │
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
│   │       │   └── agent.ts     # AI decision logic
│   │       ├── api/
│   │       │   ├── routes/      # REST endpoints
│   │       │   └── controllers/ # Request handlers
│   │       ├── mcp/             # MCP Server (NEW)
│   │       │   ├── index.ts     # MCP plugin setup
│   │       │   ├── tools.ts     # Tool definitions
│   │       │   └── handlers.ts  # Tool handlers
│   │       ├── services/
│   │       │   ├── intent-service.ts
│   │       │   ├── agent-service.ts
│   │       │   ├── wallet-service.ts
│   │       │   └── price-service.ts  # NEW: Crypto.com MCP + CoinGecko
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
├── contracts/                   # Solidity contracts
│   ├── contracts/
│   │   └── Settlement.sol       # Main settlement contract
│   ├── scripts/                 # Deployment scripts
│   └── deployments/             # Deployment artifacts
│
├── packages/
│   └── shared-types/            # Shared TypeScript interfaces
│
└── docs/                        # Documentation
    ├── ARCHITECTURE.md
    ├── API_STANDARDS.md
    ├── MCP_INTEGRATION.md       # NEW
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

## Smart Contract

**Settlement.sol** - Main settlement contract

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
| `apps/backend/src/agent/agent.ts` | AI decision logic |
| `apps/backend/src/x402/orchestrator.ts` | Settlement execution |
| `apps/backend/src/mcp/index.ts` | MCP server plugin |
| `apps/backend/src/services/price-service.ts` | Crypto.com MCP + CoinGecko |
| `contracts/contracts/Settlement.sol` | On-chain settlement |

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

## Recent Changes (Jan 2, 2026)

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
