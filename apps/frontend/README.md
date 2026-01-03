# SnowRail Frontend

A modern fintech dashboard for the Cronos x402 Agentic Treasury system.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Web3**: RainbowKit + wagmi + viem
- **State**: TanStack Query
- **Notifications**: Sonner
- **Theme**: next-themes (dark mode by default)

## Features

- **Dashboard**: Overview of treasury balance, active intents, and recent activity
- **Agent Console**: Interactive AI-powered chat with action preview and execution timeline
- **Intents**: Create and manage payment intents with smart conditions
- **Settlement**: Track and manage batch settlements
- **x402 Modal**: Automatic payment handling for 402 responses

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# From monorepo root
npm install

# Or from this directory
cd apps/frontend
npm install
```

### Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Configure your environment variables:

```env
# Required: WalletConnect Project ID
# Get one at https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Backend URL for BFF proxy (default: http://localhost:4000)
BACKEND_URL=http://localhost:4000
```

### Development

```bash
# From monorepo root
npm run dev

# Or from this directory
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Dashboard layout group
│   │   ├── dashboard/      # Main dashboard page
│   │   ├── agent/          # Agent console page
│   │   ├── intents/        # Payment intents page
│   │   └── settlement/     # Settlement tracking page
│   ├── api/
│   │   └── proxy/          # BFF proxy API route
│   └── page.tsx            # Landing page
├── components/
│   ├── layout/             # Layout components (Sidebar, Topbar)
│   ├── ui/                 # shadcn/ui components
│   └── *.tsx               # Feature components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── services/               # API service functions
└── styles/                 # Global styles
```

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Main dashboard with stats and activity |
| `/agent` | AI agent console with chat interface |
| `/intents` | Payment intents management |
| `/settlement` | Settlement tracking and management |

## API Proxy

The frontend includes a BFF (Backend For Frontend) proxy at `/api/proxy/[...path]` that:

- Forwards requests to the backend API
- Propagates all headers including x402 payment headers
- Preserves HTTP status codes (including 402 Payment Required)

## x402 Payment Flow

The frontend handles 402 responses automatically:

1. API request returns 402 with payment headers
2. `PaymentRequiredModal` shows payment details
3. User confirms payment in wallet
4. Transaction is submitted and confirmed
5. Original request is automatically retried

## Network Configuration

The frontend is configured for Cronos Testnet:

- **Chain ID**: 338
- **RPC URL**: https://evm-t3.cronos.org
- **Currency**: TCRO

## License

MIT
