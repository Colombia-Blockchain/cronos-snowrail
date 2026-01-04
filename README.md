# Cronos x402 Agentic Treasury 🤖💸🔒

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-MVP-green.svg)
![Network](https://img.shields.io/badge/network-Cronos%20Testnet-blue)
![Stack](https://img.shields.io/badge/tech-x402%20%7C%20AI%20Agents%20%7C%20ZK%20Privacy-purple)

**Autonomous AI-driven treasury settlement system with ZK privacy built on Cronos EVM.**

This project demonstrates a production-ready **Agentic Treasury** where an AI Agent autonomously evaluates market conditions to execute programmatic payments via the **x402 Paytech** protocol, with optional **ZK privacy** for unlinkable transactions.

---

## 📚 Documentation

- [**Architecture Overview**](./docs/ARCHITECTURE.md) - System design & data flow.
- [**API Standards**](./docs/API_STANDARDS.md) - Response formats & error codes.
- [**Naming Conventions**](./docs/NAMING_STANDARDS.md) - Code style & repository structure.
- [**Development Roadmap**](./ISSUES.md) - Step-by-step implementation plan.

---

## 🚀 Key Features

- **🧠 Autonomous Decision Making**: AI Agent evaluates price/time conditions off-chain.
- **⚡️ x402 Integration**: Programmatic payment execution on Cronos.
- **🛡️ Secure Settlement**: On-chain verification via `Settlement.sol`.
- **🔒 ZK Privacy**: Unlinkable deposits/withdrawals via `ZKMixer.sol`.
- **🧱 LEGO Architecture**: Swappable ZK providers (Mock/Noir/Cronos Verify).
- **🏗️ Clean Architecture**: Strict separation of concerns (Thin Client Frontend / Unified Backend).

---

## 🛠️ Tech Stack

### Backend (The Brain)
- **Node.js 20** + **Fastify**
- **AI Agent Logic** (Deterministic)
- **x402 Orchestrator**

### Frontend (The Viewer)
- **Next.js 14** (App Router)
- **TailwindCSS**
- **WalletConnect**

### Blockchain
- **Cronos EVM** (Testnet)
- **Solidity 0.8.24**
- **Hardhat**

### ZK Privacy
- **Noir** (ZK circuits)
- **Merkle Tree** (Commitment scheme)
- **Poseidon Hash** (ZK-friendly)

---

## 🏁 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Configure `.env` files in each workspace using the provided examples:
- `apps/backend/.env.local` (already configured)
- `apps/frontend/.env.local` (already configured)
- `contracts/.env` (if deploying contracts)

### 3. Run Development

**Terminal 1 - Backend (Port 4000):**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Frontend (Port 3000/3001):**
```bash
cd apps/frontend
npm run dev
```

---

## 🎬 Live Demo & E2E Testing

### Quick 5-Minute Demo

See [**DEMO.md**](./DEMO.md) for complete step-by-step instructions.

**Quick summary:**
1. Open http://localhost:3000 (or 3001)
2. Connect MetaMask wallet (Cronos Testnet)
3. Create a payment intent (0.1 CRO)
4. Click "Trigger Agent"
5. Agent executes transaction on-chain
6. Verify on Cronoscan

### Prerequisites for Demo

- Backend running on **port 4000**
- Frontend running on **port 3000 or 3001**
- MetaMask wallet with **Cronos Testnet** configured (Chain ID: 338)
- Wallet has testnet **CRO** for gas fees

### E2E Flow Verification

The complete flow includes:

1. **Wallet Connection** - User connects MetaMask to frontend
2. **Intent Creation** - User creates payment intent via form
3. **Agent Evaluation** - Backend AI Agent evaluates conditions
4. **On-Chain Execution** - Transaction executed via x402 Protocol
5. **Confirmation** - Status updates, transaction on Cronoscan
6. **Logging** - Backend logs all decisions with tracing

### Verify Everything Works

```bash
# Check backend health
curl http://localhost:4000/health

# Check frontend loads
curl http://localhost:3000

# Check agent is ready
curl http://localhost:4000/health/ready
```

---

## 🧪 Testing

### Frontend Tests
```bash
cd apps/frontend
npm run build  # TypeScript compilation check
```

### Backend Tests
```bash
cd apps/backend
npm run test   # (if tests configured)
```

### Contract Tests
```bash
npm run test:contracts
```

---

## 🔒 Privacy Features (ZK Mixer)

The system includes a **privacy-preserving mixer** for anonymous transfers:

```
FLUJO DE PRIVACIDAD:
─────────────────────────────────────────────────────
Alice deposita → commitment = hash(nullifier, secret)
                     ↓
               Merkle Tree
                     ↓
Bob retira   ← prueba ZK (sin revelar nullifier/secret)
─────────────────────────────────────────────────────
Los observadores NO pueden vincular depósito con retiro
```

### Quick Privacy Demo

```bash
# 1. Generate note (SAVE THIS!)
curl -X POST http://localhost:4000/api/mixer/generate-note

# 2. Deposit 0.1 CRO
curl -X POST http://localhost:4000/api/mixer/deposit \
  -H "Content-Type: application/json" \
  -d '{ "commitment": "0x..." }'

# 3. Withdraw to ANY address (unlinkable!)
curl -X POST http://localhost:4000/api/mixer/withdraw \
  -H "Content-Type: application/json" \
  -d '{ "note": {...}, "leafIndex": 4, "recipient": "0x..." }'
```

### Deployed Contracts (Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| Settlement | [`0xae6E14caD8D4f43947401fce0E4717b8D17b4382`](https://testnet.cronoscan.com/address/0xae6E14caD8D4f43947401fce0E4717b8D17b4382) | Authorized payments |
| ZKMixer | [`0xfAef6b16831d961CBd52559742eC269835FF95FF`](https://testnet.cronoscan.com/address/0xfAef6b16831d961CBd52559742eC269835FF95FF) | Private mixer |

---

## 📜 License
MIT
