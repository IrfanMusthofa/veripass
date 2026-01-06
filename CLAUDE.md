# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VeriPass is a blockchain-based asset verification system that creates tamper-proof digital passports for physical assets using ERC-721 NFTs. It's a three-tier dApp with Oracle integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend (React + Vite)                                             │
│ • RainbowKit wallet connection • wagmi for contract interactions    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────────┐   ┌─────────────────┐
│ Backend         │   │ Blockchain          │   │ Oracle          │
│ (Hono.js)       │   │ (Hardhat/EVM)       │   │ (Worker)        │
│ • JWT Auth      │   │ • AssetPassport     │   │ • Polls pending │
│ • PostgreSQL    │   │   (ERC-721)         │   │   records       │
│ • Drizzle ORM   │   │ • EventRegistry     │   │ • Submits to    │
│                 │   │   (append-only)     │   │   blockchain    │
└─────────────────┘   └─────────────────────┘   └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                      ┌─────────────────────┐
                      │ shared/ (ABIs)      │
                      └─────────────────────┘
```

## Development Commands

### Contracts
```bash
cd contracts
bun hardhat compile                              # Compile Solidity contracts
bun hardhat test                                 # Run contract tests
bun hardhat node                                 # Start local blockchain (port 8545)
bun hardhat run scripts/deploy.ts --network localhost  # Deploy contracts
bun hardhat run scripts/export-abi.ts            # Export ABIs to shared/
```

### Backend
```bash
cd backend
bun run dev                  # Start dev server (port 3000)
bun run db:push              # Push schema to database
bun run db:seed              # Seed test data
bun run db:studio            # Open Drizzle Studio (DB viewer)
bun run db:reset             # Drop all tables
bun run dev:oracle           # Run oracle worker in dev mode
```

### Frontend
```bash
cd frontend
bun run dev                  # Start dev server (port 5173)
bun run build                # Production build
bun run lint                 # Run ESLint
```

## Key Patterns

### Data Integrity
- Deterministic keccak256 hashing of sorted JSON structures
- On-chain hash compared against off-chain computed hash for verification
- Hash computation must match between frontend (`lib/hash.ts`) and backend (`lib/hash.ts`)

### Authentication
- Web3 wallet-based: nonce → sign → verify → JWT token
- Backend uses `authMiddleware` for JWT validation
- `flexibleAuthMiddleware` accepts JWT OR Oracle API key (X-Oracle-Key header)

### API Conventions
- All responses wrapped in `createSuccessResponse()` from `dtos/base.dto.ts`
- Custom exceptions: `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`
- Zod schemas for input validation in `dtos/` directory

### Frontend Providers (nested order in App.tsx)
- `Web3Provider` - wagmi + RainbowKit
- `AuthProvider` - JWT token and login state
- `ToastProvider` - Toast notifications

### Frontend Hooks Organization
- `/hooks/api/` - TanStack Query hooks for backend API
- `/hooks/contracts/` - wagmi hooks for smart contract interactions

### Oracle Processing
- Polls `service_records_provider_a` for provider-submitted records
- Automatically processes verified provider records (no user requests)
- Submits events to EventRegistry contract as trusted oracle
- Tracks status via `processed_service_records`: PENDING → PROCESSING → COMPLETED/FAILED
- Users submit CUSTOM events directly to blockchain (unverified, no oracle)

## Cross-Layer Rules

The `shared/` directory is the ONLY source for contract ABIs:
```
ALLOWED:     frontend/ → shared/    backend/ → shared/
FORBIDDEN:   frontend/ → contracts/  backend/ → frontend/
```

After contract changes, always run `export-abi.ts` to update shared ABIs.

## Smart Contracts

### AssetPassport (ERC-721)
- `mintPassport(address to, bytes32 metadataHash)` - Mint new passport
- `getAssetInfo(uint256 tokenId)` - Get asset metadata hash
- Authorized minters pattern, ownership tracking with hands counter

### EventRegistry
- `recordEvent(uint256 assetId, uint8 eventType, bytes32 dataHash)` - Record event
- `submitOracleEvent(...)` - Oracle-verified event
- Event types: MAINTENANCE(0), OWNERSHIP_TRANSFER(1), CERTIFICATION(2), SERVICE_RECORD(3), VERIFICATION(4)

## Graceful Degradation

Frontend operates in "offline mode" when backend unavailable:
- View passports: Hash only (no metadata)
- Mint: Legacy JSON input instead of structured form
- Verification: Disabled
- Blockchain operations: Still work directly

## Local Development Setup

1. Start PostgreSQL (via `infrastructure/docker-compose.yml`)
2. Start Hardhat node: `cd contracts && bun hardhat node`
3. Deploy contracts: `bun hardhat run scripts/deploy.ts --network localhost`
4. Export ABIs: `bun hardhat run scripts/export-abi.ts`
5. Setup backend: `cd backend && cp .env.example .env && bun run db:push && bun run dev`
6. Setup frontend: `cd frontend && cp .env.example .env && bun run dev`

MetaMask config for local testing:
- RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Test private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
