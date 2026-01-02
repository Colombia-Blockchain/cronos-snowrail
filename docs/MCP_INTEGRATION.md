# MCP Integration Guide

This document explains how to integrate with the **Cronos x402 Agentic Treasury MCP Server**.

## Overview

The Cronos x402 Agentic Treasury exposes its functionality via the **Model Context Protocol (MCP)**, allowing AI assistants like Claude, ChatGPT, and Cursor to interact with the treasury directly.

**MCP Endpoint:** `http://localhost:4000/mcp`

## Available Tools

| Tool | Description |
|------|-------------|
| `create_payment_intent` | Create a new conditional payment intent |
| `list_payment_intents` | List all payment intents |
| `get_payment_intent` | Get a specific intent by ID |
| `trigger_agent` | Evaluate and execute an intent with AI agent |
| `get_treasury_status` | Get treasury contract and wallet status |

---

## Claude Desktop Configuration

Add this to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "cronos-x402-treasury": {
      "type": "http",
      "url": "http://localhost:4000/mcp"
    }
  }
}
```

### With Crypto.com Market Data (Both Servers)

```json
{
  "mcpServers": {
    "cronos-x402-treasury": {
      "type": "http",
      "url": "http://localhost:4000/mcp"
    },
    "crypto-market-data": {
      "type": "http",
      "url": "https://mcp.crypto.com/market-data/mcp"
    }
  }
}
```

After saving, restart Claude Desktop completely.

---

## Testing the MCP Server

### 1. Check Available Tools

```bash
curl http://localhost:4000/mcp/tools
```

### 2. Test MCP Health

```bash
curl http://localhost:4000/mcp/health
```

### 3. Test Initialize (JSON-RPC)

```bash
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {},
    "id": 1
  }'
```

### 4. List Tools via MCP Protocol

```bash
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 2
  }'
```

### 5. Call a Tool

```bash
# Create a payment intent
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
    "id": 3
  }'
```

---

## Tool Schemas

### create_payment_intent

```json
{
  "amount": "1.5",
  "currency": "CRO",
  "recipient": "0x...",
  "conditionType": "manual | price-below",
  "conditionValue": "true | 0.15"
}
```

**Condition Types:**
- `manual`: Always executes when triggered
- `price-below`: Executes when CRO/USD price is below the specified value

### trigger_agent

```json
{
  "intentId": "uuid-of-intent"
}
```

### get_payment_intent

```json
{
  "intentId": "uuid-of-intent"
}
```

### list_payment_intents

No arguments required.

### get_treasury_status

No arguments required.

---

## Example Conversation with Claude

Once configured, you can ask Claude:

> "Create a payment intent for 0.5 CRO to address 0x123... with a manual trigger"

> "List all my payment intents"

> "Trigger the agent to evaluate intent abc-123"

> "What's the current treasury balance?"

---

## Architecture

```
┌─────────────────┐         ┌─────────────────────────────────┐
│  Claude/AI      │         │  Cronos x402 Treasury Backend   │
│  Assistant      │────────▶│                                 │
└─────────────────┘         │  ┌─────────────┐                │
                            │  │ MCP Server  │ POST /mcp      │
                            │  │ (JSON-RPC)  │                │
                            │  └──────┬──────┘                │
                            │         │                       │
                            │  ┌──────▼──────┐                │
                            │  │  Handlers   │                │
                            │  └──────┬──────┘                │
                            │         │                       │
                            │  ┌──────▼──────┐                │
                            │  │  Services   │                │
                            │  │ • Intent    │                │
                            │  │ • Agent     │                │
                            │  │ • Wallet    │                │
                            │  └──────┬──────┘                │
                            │         │                       │
                            │  ┌──────▼──────┐                │
                            │  │Orchestrator │                │
                            │  └──────┬──────┘                │
                            └─────────┼───────────────────────┘
                                      │
                            ┌─────────▼───────────┐
                            │   Cronos Blockchain  │
                            │   Settlement.sol     │
                            └─────────────────────┘
```

---

## Price Data Integration

The backend uses **Crypto.com MCP** as the primary source for real-time CRO prices, with **CoinGecko** as fallback.

This enables the `price-below` condition type to make autonomous decisions based on current market data.

**Flow:**
1. Agent evaluates a `price-below` condition
2. PriceService fetches from Crypto.com MCP (`https://mcp.crypto.com/market-data/mcp`)
3. If unavailable, falls back to CoinGecko API
4. Price is cached for 60 seconds
5. Agent compares price to threshold and decides EXECUTE or SKIP

---

## Hackathon Tracks

This MCP integration positions the project for:

### Track 4: Dev Tooling / Virtualization
- **Agent Runtime**: Executes conditional evaluations autonomously
- **MCP Server**: Allows any AI assistant to use x402 payments
- **Tool Discovery**: `/mcp/tools` endpoint for dynamic capability discovery
- **Protocol Standard**: Implements MCP 2024-11-05 specification

### Track 3: Crypto.com Ecosystem Integration
- Consumes Crypto.com Market Data MCP for real-time pricing
- Integrates with Cronos EVM for settlement

---

## Troubleshooting

### "Method not found" error
Ensure you're using the correct method names: `initialize`, `tools/list`, `tools/call`

### "Missing tool name" error
When calling `tools/call`, include the `name` parameter in `params`

### Connection refused
Make sure the backend is running on port 4000:
```bash
cd apps/backend && npm run dev
```

### Claude Desktop not showing tools
1. Verify the config file location is correct for your OS
2. Restart Claude Desktop completely (force quit)
3. Check `/mcp/health` endpoint is responding
