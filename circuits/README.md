# Noir ZK Circuits

Zero-knowledge circuits for the Cronos x402 Agentic Treasury.

## Prerequisites

Install Noir:

```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup -v 0.36.0
```

Verify installation:

```bash
nargo --version
```

## Available Circuits

### 1. mixer (Privacy Mixer)

**Contract:** [`0xfAef6b16831d961CBd52559742eC269835FF95FF`](https://testnet.cronoscan.com/address/0xfAef6b16831d961CBd52559742eC269835FF95FF)

Proves valid withdrawal from mixer WITHOUT revealing which deposit.

**Use Case:** Alice deposits 0.1 CRO. Later, Bob withdraws 0.1 CRO proving he knows a valid commitment. Observers CANNOT link Alice to Bob.

```
PRIVACY FLOW:
─────────────────────────────────────────────────────
Alice deposits → commitment = poseidon(nullifier, secret)
                     ↓
               Merkle Tree
                     ↓
Bob withdraws ← proves knowledge (nullifier, secret)
─────────────────────────────────────────────────────
```

**Public Inputs:**
- `root`: Merkle tree root (proves deposit exists)
- `nullifierHash`: Prevents double-spending
- `recipient`: Address receiving funds
- `relayer`: Relayer address (0 if none)
- `fee`: Relayer fee amount

**Private Inputs (NEVER revealed):**
- `nullifier`: Secret value for nullifierHash
- `secret`: Secret value for commitment
- `pathElements`: Merkle proof siblings
- `pathIndices`: Merkle proof directions

### 2. price_condition

Proves that `currentPrice < threshold` WITHOUT revealing the threshold.

**Use Case:** AI Agent can prove a price condition is met without exposing the exact trigger price to observers.

**Public Inputs:**
- `current_price`: Current market price (u64, scaled by 1e8)
- `intent_id_hash`: Hash of intent ID (prevents replay)
- `condition_met`: 1 if condition is true, 0 otherwise

**Private Inputs (NEVER revealed):**
- `threshold`: Price threshold

## Usage

### 1. Compile Circuits

```bash
cd circuits/mixer
nargo compile

cd ../price_condition
nargo compile
```

### 2. Run Tests

```bash
cd circuits/mixer
nargo test

cd ../price_condition
nargo test
```

### 3. Use via Backend API

**Mixer Flow (Most Common):**

```bash
# 1. Generate deposit note (SAVE THIS SECURELY!)
curl -X POST http://localhost:4000/api/mixer/generate-note
# Returns: { note: { nullifier, secret, commitment, nullifierHash } }

# 2. Deposit 0.1 CRO
curl -X POST http://localhost:4000/api/mixer/deposit \
  -H "Content-Type: application/json" \
  -d '{ "commitment": "0x..." }'
# Returns: { txHash, leafIndex }

# 3. Withdraw to ANY address (unlinkable!)
curl -X POST http://localhost:4000/api/mixer/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "note": { "nullifier": "0x...", "secret": "0x...", ... },
    "leafIndex": 4,
    "recipient": "0x..."
  }'
# Returns: { txHash, privacy: "Withdrawal is unlinkable to your deposit" }
```

**Price Condition Proof (via Agent):**

```typescript
// Agent automatically generates ZK proof for price-below conditions
const intent = await intentService.create({
  amount: "0.1",
  currency: "CRO",
  recipient: "0x...",
  condition: { type: "price-below", value: "0.10" }  // threshold is PRIVATE
});
// ZK proof generated without revealing the threshold
```

## Price Encoding

Prices are encoded as u64 with 8 decimal places:

| Price USD | Encoded Value |
|-----------|---------------|
| $0.08     | 8_000_000     |
| $0.10     | 10_000_000    |
| $1.00     | 100_000_000   |
| $100.00   | 10_000_000_000|

## Security Considerations

### price_condition
1. **Never log the threshold** - it's the private input
2. **Intent ID hash prevents replay** - each proof is bound to specific intent
3. **Threshold > 0 check** - prevents zero threshold attacks
4. **Price bounds check** - prevents overflow attacks

### private_transfer
1. **Never log sender, recipient, or amount** - all are private
2. **Nullifier prevents double-spending** - same transfer can't be used twice
3. **Balance check is enforced** - can't fake having sufficient balance
4. **Self-transfer blocked** - sender != recipient
5. **Zero amount blocked** - amount must be positive

## Files

```
circuits/
├── README.md
├── mixer/                    # Privacy mixer circuit
│   ├── Nargo.toml
│   ├── src/
│   │   └── main.nr           # Merkle tree + nullifier verification
│   └── target/
│       └── mixer.json
└── price_condition/          # Private price threshold circuit
    ├── Nargo.toml
    ├── src/
    │   └── main.nr
    └── target/
        └── price_condition.json
```

## Deployed Contracts

| Circuit | Contract | Address |
|---------|----------|---------|
| mixer | ZKMixer | [`0xfAef6b16831d961CBd52559742eC269835FF95FF`](https://testnet.cronoscan.com/address/0xfAef6b16831d961CBd52559742eC269835FF95FF) |
| price_condition | (Agent-only) | N/A - used off-chain |
