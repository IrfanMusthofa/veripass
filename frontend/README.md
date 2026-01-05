# VeriPass Frontend

React application for the VeriPass decentralized asset passport system.

## Tech Stack

- **Framework**: React 19 + Vite 7
- **Web3**: wagmi 3.1 + RainbowKit 2.2
- **Data Fetching**: TanStack Query 5
- **Animations**: Framer Motion 12
- **Styling**: Tailwind CSS 4.1 with Notion-inspired design system
- **Routing**: React Router 7

## Getting Started

### Prerequisites

- Node.js 20+ or Bun
- MetaMask or compatible Web3 wallet

### Installation

```bash
cd frontend
bun install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `VITE_API_URL` - Backend API URL (default: http://localhost:3000)
- `VITE_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID for production

### Development

```bash
bun run dev
```

The app will be available at http://localhost:5173

### Build

```bash
bun run build
bun run preview  # Preview production build
```

## Architecture

### Data Flow

```
                     ┌─────────────────┐
                     │    Frontend     │
                     │  (React + wagmi)│
                     └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │  Backend   │  │ Blockchain │  │   Oracle   │
       │   (API)    │  │  (Direct)  │  │  (Verify)  │
       └────────────┘  └────────────┘  └────────────┘
              │               │               │
              │               ▼               │
              │        ┌────────────┐         │
              └───────►│  Contracts │◄────────┘
                       └────────────┘
```

### Core Features

1. **Asset Minting**
   - Structured form with manufacturer, model, serial number
   - Backend stores metadata, returns cryptographic hash
   - Frontend submits hash to smart contract

2. **Asset Verification**
   - Fetches metadata hash from blockchain
   - Retrieves full metadata from backend
   - Compares hashes to verify integrity

3. **Oracle Verification**
   - Users request verification through backend
   - Oracle processes and submits to blockchain
   - Status displayed in event timeline

### Directory Structure

```
src/
├── components/
│   ├── common/         # Button, Card, Input, Modal, etc.
│   ├── design-system/  # Typography, Skeleton
│   ├── events/         # EventTimeline, EventCard
│   ├── layout/         # Header, Footer, Layout
│   ├── passport/       # MintForm, PassportDetails
│   └── verification/   # VerificationBadge, RequestForm
├── hooks/
│   ├── api/            # Backend API hooks
│   └── contracts/      # Blockchain contract hooks
├── lib/
│   ├── api.ts          # API client
│   ├── animations.ts   # Framer Motion variants
│   └── hash.ts         # Keccak256 hashing
├── pages/              # Route pages
├── providers/          # Context providers
├── styles/             # CSS including Notion theme
└── types/              # TypeScript types
```

## Design System

### Notion-Inspired Theme

The UI follows Notion's design language:

- **Colors**: Warm grays, subtle shadows, blue accents
- **Typography**: System font stack with clear hierarchy
- **Spacing**: 4px base unit system
- **Animations**: Subtle, purposeful motion

### Key CSS Variables

```css
--color-bg-primary: #ffffff;
--color-bg-secondary: #f7f6f3;
--color-text-primary: #37352f;
--color-accent-blue: #2383e2;
--color-accent-green: #0f7b6c;
```

## Testing with Local Blockchain

### 1. Start Hardhat Node

```bash
cd ../contracts
bun hardhat node
```

### 2. Deploy Contracts

```bash
bun hardhat run scripts/deploy.ts --network localhost
```

### 3. Configure MetaMask

Add Hardhat network:
- **Network Name**: Hardhat Local
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 31337
- **Currency**: ETH

Import test account:
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 4. Start Backend

```bash
cd ../backend
bun run dev
```

### 5. Start Frontend

```bash
cd ../frontend
bun run dev
```

## Graceful Degradation

When the backend is unavailable, the frontend operates in "offline mode":

| Feature | Online | Offline |
|---------|--------|---------|
| View passports | Full metadata | Hash only |
| Mint passports | Structured form | Legacy JSON |
| Record events | With evidence | Direct to chain |
| Verification | Full flow | Disabled |

## API Integration

### Authentication

Uses Web3 wallet signature for authentication:

1. `POST /api/auth/nonce` - Get signing nonce
2. User signs message with wallet
3. `POST /api/auth/verify` - Verify signature, get JWT
4. JWT stored in localStorage for subsequent requests

### Key Endpoints

- `POST /api/assets` - Create asset metadata
- `GET /api/assets/by-hash/:hash` - Get asset by hash
- `POST /api/evidence` - Create evidence record
- `POST /api/verification-requests` - Request oracle verification

## Scripts

```bash
bun run dev       # Start dev server
bun run build     # Production build
bun run lint      # Run ESLint
bun run preview   # Preview production build
```
