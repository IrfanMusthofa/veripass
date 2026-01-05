# VeriPass - Decentralized Asset Passport System

A blockchain-based asset verification system that creates tamper-proof digital passports for physical assets. VeriPass tracks ownership history and lifecycle events on an immutable ledger using ERC-721 NFTs.

## Architecture Overview

```
                          SYSTEM ARCHITECTURE

┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     Frontend (React + Vite)                            │  │
│  │  • Wallet Connection (RainbowKit)  • Asset Management UI               │  │
│  │  • Verification Display            • Event Timeline                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│    Backend      │    │     Blockchain      │    │     Oracle      │
│   (Hono.js)     │    │    (Hardhat/EVM)    │    │   (Scheduled)   │
│                 │    │                     │    │                 │
│ • JWT Auth      │    │ • AssetPassport     │    │ • Verification  │
│ • Metadata API  │    │   (ERC-721)         │    │   Processing    │
│ • Evidence API  │    │ • EventRegistry     │    │ • Event Submit  │
│ • PostgreSQL    │    │   (Append-only)     │    │                 │
└────────┬────────┘    └──────────┬──────────┘    └────────┬────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  ▼
                    ┌─────────────────────────┐
                    │   shared/ (ABIs +       │
                    │   Contract Addresses)   │
                    └─────────────────────────┘
```

## Core Features

### 1. Asset Minting

```
User                    Frontend                 Backend                  Blockchain
  │                        │                        │                        │
  │  Fill mint form        │                        │                        │
  │───────────────────────>│                        │                        │
  │                        │  POST /api/assets      │                        │
  │                        │  {manufacturer, model} │                        │
  │                        │───────────────────────>│                        │
  │                        │                        │  Store metadata        │
  │                        │                        │  Generate keccak256    │
  │                        │     { dataHash }       │  hash                  │
  │                        │<───────────────────────│                        │
  │                        │                        │                        │
  │                        │  mintPassport(recipient, dataHash)              │
  │                        │────────────────────────────────────────────────>│
  │                        │                        │                        │
  │                        │                        │     tokenId, txHash    │
  │                        │<────────────────────────────────────────────────│
  │   Success + Token ID   │                        │                        │
  │<───────────────────────│                        │                        │
```

### 2. Asset Verification

```
User                    Frontend                 Backend                  Blockchain
  │                        │                        │                        │
  │  View passport         │                        │                        │
  │───────────────────────>│                        │                        │
  │                        │  getAssetInfo(tokenId)                          │
  │                        │────────────────────────────────────────────────>│
  │                        │                        │      { metadataHash }  │
  │                        │<────────────────────────────────────────────────│
  │                        │                        │                        │
  │                        │  GET /api/assets/by-hash/:hash                  │
  │                        │───────────────────────>│                        │
  │                        │    { full metadata }   │                        │
  │                        │<───────────────────────│                        │
  │                        │                        │                        │
  │                        │  Compare hashes        │                        │
  │                        │  onChainHash === computed(metadata)             │
  │                        │                        │                        │
  │   Display badge:       │                        │                        │
  │   ✓ Verified (match)   │                        │                        │
  │   ✗ Mismatch           │                        │                        │
  │<───────────────────────│                        │                        │
```

### 3. Oracle Verification

```
User                    Frontend                 Backend                   Oracle                  Blockchain
  │                        │                        │                        │                        │
  │  Request verification  │                        │                        │                        │
  │───────────────────────>│                        │                        │                        │
  │                        │  POST /api/verification-requests               │                        │
  │                        │───────────────────────>│                        │                        │
  │                        │     { requestId }      │  Queue request         │                        │
  │                        │<───────────────────────│                        │                        │
  │   Pending status       │                        │                        │                        │
  │<───────────────────────│                        │                        │                        │
  │                        │                        │                        │                        │
  │                        │                        │  Poll pending requests │                        │
  │                        │                        │<───────────────────────│                        │
  │                        │                        │                        │                        │
  │                        │                        │                        │  Process & verify      │
  │                        │                        │                        │                        │
  │                        │                        │                        │  submitEvent(assetId,  │
  │                        │                        │                        │  eventType, dataHash)  │
  │                        │                        │                        │───────────────────────>│
  │                        │                        │                        │      { txHash }        │
  │                        │                        │                        │<───────────────────────│
  │                        │                        │                        │                        │
  │                        │                        │  Update status         │                        │
  │                        │                        │<───────────────────────│                        │
  │                        │                        │                        │                        │
  │  View verified event in timeline               │                        │                        │
  │<───────────────────────────────────────────────────────────────────────────────────────────────────│
```

## Folder Structure

```
veripass/
├── contracts/          # Hardhat + Solidity smart contracts
│   ├── contracts/      # Solidity source files
│   ├── scripts/        # Deployment and utility scripts
│   └── test/           # Contract tests
├── frontend/           # Vite + React SPA
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/      # React hooks (API + contracts)
│   │   ├── lib/        # Utilities (API client, animations)
│   │   ├── pages/      # Route pages
│   │   ├── providers/  # Context providers
│   │   └── types/      # TypeScript types
│   └── public/         # Static assets
├── backend/            # Hono.js API server
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   └── db/         # Database (Drizzle ORM)
│   └── oracle/         # Oracle worker
├── shared/             # Cross-layer artifacts
│   └── abi/            # Contract ABIs + addresses
└── README.md           # This file
```

## Quick Start

### Prerequisites

- Node.js 20+ or Bun
- PostgreSQL 14+
- MetaMask or compatible Web3 wallet
- Git

### 1. Clone and Install

```bash
git clone <repository-url>
cd veripass

# Install all dependencies
cd contracts && bun install && cd ..
cd backend && bun install && cd ..
cd frontend && bun install && cd ..
```

### 2. Start Local Blockchain

```bash
# Terminal 1: Start Hardhat node
cd contracts
bun hardhat node
```

This starts a local Ethereum node at `http://127.0.0.1:8545` with Chain ID `31337`.

### 3. Deploy Contracts

```bash
# Terminal 2: Deploy contracts
cd contracts
bun hardhat run scripts/deploy.ts --network localhost
bun hardhat run scripts/export-abi.ts  # Export ABIs to shared/
```

### 4. Configure MetaMask

#### Add Hardhat Network

1. Open MetaMask
2. Click network dropdown -> "Add Network" -> "Add a network manually"
3. Enter these details:

| Field | Value |
|-------|-------|
| Network Name | Hardhat Local |
| New RPC URL | http://127.0.0.1:8545 |
| Chain ID | 31337 |
| Currency Symbol | ETH |
| Block Explorer URL | (leave empty) |

#### Import Test Account

Hardhat provides pre-funded test accounts. Import Account #0:

```
Address:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Balance:     10000 ETH
```

**Warning**: This is a publicly known test key. Never use it for real funds.

### 5. Setup Database

```bash
# Ensure PostgreSQL is running
# Create database
createdb veripass

# Terminal 3: Run migrations
cd backend
cp .env.example .env
# Edit .env with your database credentials
bun run db:push
bun run db:seed  # Optional: seed test data
```

### 6. Start Backend

```bash
# Terminal 3 (continued)
cd backend
bun run dev
```

Backend runs at `http://localhost:3000`.

### 7. Start Frontend

```bash
# Terminal 4
cd frontend
cp .env.example .env
bun run dev
```

Frontend runs at `http://localhost:5173`.

### 8. Test the System

1. Open `http://localhost:5173` in your browser
2. Connect MetaMask (use Hardhat Local network)
3. Click "Sign In" to authenticate with the backend
4. Navigate to "Mint" to create your first passport
5. View your passport and verify the data integrity

## Environment Configuration

### contracts/.env

```bash
POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

### backend/.env

```bash
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/veripass
JWT_SECRET=your_jwt_secret_here
ORACLE_PRIVATE_KEY=your_oracle_wallet_key
RPC_URL=http://127.0.0.1:8545
```

### frontend/.env

```bash
VITE_API_URL=http://localhost:3000
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Smart Contracts** | Solidity 0.8.28, Hardhat, OpenZeppelin 5.x, TypeChain |
| **Frontend** | React 19, Vite 7, wagmi 3.1, RainbowKit 2.2, TanStack Query 5, Framer Motion 12, Tailwind CSS 4.1 |
| **Backend** | Hono.js, Drizzle ORM, PostgreSQL, JWT Auth |
| **Shared** | TypeScript, Auto-generated ABIs |

## Smart Contracts

### AssetPassport (ERC-721)

NFT representing a unique digital passport for a physical asset.

**Key Functions:**
- `mintPassport(address to, bytes32 metadataHash)` - Mint new passport
- `getAssetInfo(uint256 tokenId)` - Get asset metadata hash
- `totalSupply()` - Get total minted passports

### EventRegistry (Append-Only)

Immutable ledger for asset lifecycle events.

**Key Functions:**
- `recordEvent(uint256 assetId, uint8 eventType, bytes32 dataHash)` - Record event
- `submitOracleEvent(uint256 assetId, uint8 eventType, bytes32 dataHash)` - Oracle-verified event
- `getAssetEvents(uint256 assetId)` - Get all events for an asset

**Event Types:**
- 0: MAINTENANCE
- 1: OWNERSHIP_TRANSFER
- 2: CERTIFICATION
- 3: SERVICE_RECORD
- 4: VERIFICATION

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/nonce` | Get signing nonce |
| POST | `/api/auth/verify` | Verify signature, get JWT |
| GET | `/api/auth/me` | Get current user |

### Assets

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assets` | Create asset metadata |
| GET | `/api/assets/:id` | Get asset by ID |
| GET | `/api/assets/by-hash/:hash` | Get asset by data hash |

### Evidence

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/evidence` | Create evidence record |
| GET | `/api/evidence/asset/:assetId` | Get evidence for asset |

### Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verification-requests` | Request oracle verification |
| GET | `/api/verification-requests/:id` | Get request status |

## Graceful Degradation

The frontend operates in "offline mode" when the backend is unavailable:

| Feature | Online Mode | Offline Mode |
|---------|------------|--------------|
| View passports | Full metadata display | Hash only |
| Mint passports | Structured form | Legacy JSON input |
| Record events | With evidence storage | Direct to blockchain |
| Verification | Full hash comparison | Disabled |

## Development Commands

### Contracts

```bash
cd contracts
bun hardhat compile          # Compile contracts
bun hardhat test             # Run tests
bun hardhat node             # Start local blockchain
bun hardhat run scripts/deploy.ts --network localhost
```

### Backend

```bash
cd backend
bun run dev                  # Start dev server
bun run db:push              # Push schema to database
bun run db:seed              # Seed database
bun run oracle               # Run oracle worker
```

### Frontend

```bash
cd frontend
bun run dev                  # Start dev server
bun run build                # Production build
bun run lint                 # Run ESLint
bun run preview              # Preview production build
```

## Cross-Layer Communication Rules

1. **Single Source of Truth**: The `shared/` directory is the ONLY source for contract interfaces
2. **No Manual Copying**: Deploy script automatically exports ABIs to `shared/`
3. **No Cross-Folder Imports**: Only `shared/` can be imported by other packages

```
ALLOWED:
  frontend/ -> shared/
  backend/  -> shared/

FORBIDDEN:
  frontend/ -> contracts/
  backend/  -> frontend/
```

## Testing Scenarios

### Full Mint Flow
1. Connect wallet
2. Sign in to backend
3. Fill mint form with asset details
4. Submit -> Backend stores metadata, returns hash
5. Confirm transaction -> Contract mints NFT
6. View passport with verification badge

### Verification Request Flow
1. Navigate to owned passport
2. Click "Request Verification"
3. Select verification type
4. Submit request
5. Oracle processes and submits to blockchain
6. View verified event in timeline

### Degraded Mode Testing
1. Stop backend server
2. Refresh frontend
3. Verify "Offline Mode" indicator appears
4. Test minting with legacy JSON form
5. Verify blockchain-only features still work
6. Restart backend and verify recovery

## Developer Mapping

| Developer | Package | Responsibility |
|-----------|---------|----------------|
| Dev A (Elbert) | contracts/ | Smart contract logic, deployment, ABI generation |
| Dev B (Irfan) | frontend/ | UI components, wallet integration, contract calls |
| Dev C (Dewo) | backend/, oracle/ | API endpoints, off-chain data, oracle verification |

## License

MIT
