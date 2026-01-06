# VeriPass Smart Contracts

Solidity contracts for the VeriPass decentralized asset passport system.

## Quick Start

```bash
bun install
bun hardhat compile
bun hardhat test
bun hardhat node                                      # Start local blockchain
bun hardhat run scripts/setup-local.ts --network localhost
```

## Contracts

### AssetPassport (ERC-721)

NFT representing asset ownership. Each token is a digital passport for a physical asset.

**Features:**
- Authorized minters pattern (only approved addresses can mint)
- Pausable transfers (emergency circuit breaker)
- Ownership hand tracking (counts custody changes per token)

| Function | Access | Description |
|----------|--------|-------------|
| `mintPassport(to, metadataHash)` | Minter/Owner | Mint new passport |
| `getAssetInfo(tokenId)` | Public | Get hash, timestamp, active status |
| `getOwnershipHand(tokenId)` | Public | Get custody transfer count |
| `addAuthorizedMinter(address)` | Owner | Authorize a minter |
| `removeAuthorizedMinter(address)` | Owner | Revoke minter access |
| `deactivatePassport(tokenId)` | Owner | Mark passport inactive |
| `pause()` / `unpause()` | Owner | Emergency stop transfers |

### EventRegistry (Append-Only)

Immutable ledger for asset lifecycle events.

**Features:**
- Owner events - Asset owners record their own events
- Oracle events - Trusted oracles submit verified events
- 5 event types: MAINTENANCE (0), VERIFICATION (1), WARRANTY (2), CERTIFICATION (3), CUSTOM (4)

| Function | Access | Description |
|----------|--------|-------------|
| `recordEvent(assetId, type, hash)` | Asset Owner | Record self-reported event |
| `recordVerifiedEvent(assetId, type, hash, sig)` | Oracle | Record oracle-verified event |
| `getEventsByAsset(assetId)` | Public | Get all events for asset |
| `getEventsByType(assetId, type)` | Public | Filter events by type |
| `addTrustedOracle(address)` | Owner | Register oracle |
| `removeTrustedOracle(address)` | Owner | Deregister oracle |

## Directory Structure

```
contracts/
├── contracts/
│   ├── AssetPassport.sol       # ERC-721 passport NFT
│   ├── EventRegistry.sol       # Append-only event log
│   ├── interfaces/             # IAssetPassport, IEventRegistry
│   └── errors/                 # VeriPassErrors.sol
├── scripts/
│   ├── deploy.ts               # Deploy both contracts
│   ├── setup-local.ts          # Full local dev setup
│   ├── setup-sepolia.ts        # Sepolia testnet setup
│   ├── add-authorized.ts       # Add minter/oracle interactively
│   └── export-abi.ts           # Export ABIs to shared/
└── test/
    └── AssetPassport.ts        # 33 test cases
```

## Networks

| Network | Chain ID | Usage |
|---------|----------|-------|
| localhost | 31337 | Local development |
| sepolia | 11155111 | Testnet |
| amoy | 80002 | Polygon testnet |

## Environment

```bash
cp .env.example .env
```

Required variables:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
DEPLOYER_PRIVATE_KEY=0x...
```

## Commands

```bash
# Development
bun hardhat compile                                   # Compile contracts
bun hardhat test                                      # Run all tests
bun hardhat node                                      # Start local blockchain

# Deployment
bun hardhat run scripts/setup-local.ts --network localhost
bun hardhat run scripts/setup-sepolia.ts --network sepolia

# Utilities
bun hardhat run scripts/export-abi.ts                 # Export ABIs to shared/
bun hardhat run scripts/add-authorized.ts --network localhost
bun hardhat run scripts/list-assets.ts --network localhost
```

## After Deployment

1. Copy contract addresses to environment files
2. Run `export-abi.ts` to update shared ABIs
3. Register oracle address if using oracle worker
