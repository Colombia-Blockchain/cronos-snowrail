# Snowrail x402 Facilitator

Facilitator service for the x402 HTTP payment protocol on Cronos network. Handles payment verification and on-chain settlement via EIP-3009.

## Quick Start

```bash
npm install
cp .env.example .env  # Configure PRIVATE_KEY
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3002` |
| `PRIVATE_KEY` | Facilitator wallet private key | Required |
| `RPC_URL` | Cronos RPC endpoint | `https://evm-t3.cronos.org` |
| `CHAIN_ID` | Network chain ID | `338` |
| `USDC_CONTRACT_ADDRESS` | USDC token address | Cronos testnet USDC |

## API Endpoints

### `GET /health`
Health status check.

### `GET /version`
Version and build info.

### `GET /supported`
List supported payment schemes, networks, and tokens.

### `GET /verify`
Get JSON schema for verification requests.

### `POST /verify`
Verify a payment signature.

**Request:**
```json
{
  "paymentHeader": "base64-encoded-payment-token",
  "paymentRequirements": {
    "scheme": "eip-3009",
    "network": "cronos-testnet",
    "maxAmountRequired": "1000000",
    "resource": "https://api.example.com/resource",
    "payTo": "0x..."
  }
}
```

### `GET /settle`
Get JSON schema for settlement requests.

### `POST /settle`
Execute payment on-chain via EIP-3009.

**Request:** Same as `/verify`

**Response:**
```json
{
  "status": "success",
  "code": "SETTLEMENT_SUCCESS",
  "data": {
    "success": true,
    "transactionHash": "0x...",
    "settledAmount": "1000000"
  }
}
```

## Payment Header Format

Base64-encoded JSON:
```json
{
  "scheme": "eip-3009",
  "network": "cronos-testnet",
  "payload": {
    "from": "0x...",
    "to": "0x...",
    "value": "1000000",
    "validAfter": "1704067200",
    "validBefore": "1704153600",
    "nonce": "0x..."
  },
  "signature": { "v": 28, "r": "0x...", "s": "0x..." }
}
```

## Supported Schemes

- **eip-3009**: USDC transfers via `transferWithAuthorization`
- **exact**: Native CRO/TCRO transfers

## Networks

| Network | Chain ID |
|---------|----------|
| Cronos Testnet | 338 |
| Cronos Mainnet | 25 |
