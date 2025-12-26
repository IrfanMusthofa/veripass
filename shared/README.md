# Shared Contract Interface Boundary

This directory contains the contract artifacts that are shared across all packages in the VeriPass monorepo. It serves as the **single source of truth** for contract ABIs and deployed addresses.

## Purpose

The `shared/` directory enables clean separation of concerns between development teams:

- **Dev A (Contracts)**: Produces ABIs and addresses after deployment
- **Dev B (Frontend)**: Consumes ABIs and addresses for contract interaction
- **Dev C (Oracle)**: Consumes ABIs and addresses for event submission

## Directory Structure

```
shared/
├── abi/                    # Contract ABI files (JSON)
│   ├── AssetPassport.json  # Generated after compilation
│   ├── EventRegistry.json  # Generated after compilation
│   └── README.md           # ABI documentation
├── addresses.json          # Deployed contract addresses by network
└── README.md               # This file
```

## Rules

### 1. No Manual Editing

The contents of this directory are **auto-generated** by the deployment scripts. Do not manually edit:

- `abi/*.json` files
- `addresses.json`

If you need to update these files, run the deployment script in `contracts/`:

```bash
cd contracts
npm run deploy:local    # or deploy:sepolia
```

### 2. Single Source of Truth

All packages must import ABIs and addresses from this directory. Never:

- Copy ABI files to other packages
- Hardcode contract addresses in code
- Create local copies of these files

### 3. Version Control

These files ARE committed to version control because:

- They enable frontend development without running contracts
- They provide a reference for the current contract state
- They allow CI/CD to build frontend without contract compilation

### 4. Network-Specific Addresses

The `addresses.json` file contains addresses for each network:

```json
{
  "localhost": {
    "AssetPassport": "0x...",
    "EventRegistry": "0x...",
    "deployedAt": "2024-01-01T00:00:00Z",
    "deployer": "0x..."
  },
  "sepolia": { ... },
  "mainnet": { ... }
}
```

Select the appropriate network based on your environment configuration.

## Importing in Other Packages

### Frontend (TypeScript)

```typescript
// vite.config.ts has @shared alias configured
import addresses from "@shared/addresses.json";
import AssetPassportABI from "@shared/abi/AssetPassport.json";

const address = addresses["sepolia"].AssetPassport;
const contract = new ethers.Contract(address, AssetPassportABI, provider);
```

### Oracle (TypeScript)

```typescript
// Use relative path from oracle package
import addresses from "../../shared/addresses.json";
import EventRegistryABI from "../../shared/abi/EventRegistry.json";
```

## Updating After Deployment

After deploying contracts, the deploy script automatically:

1. Copies compiled ABIs from `contracts/artifacts/` to `shared/abi/`
2. Updates `addresses.json` with new contract addresses
3. Adds deployment metadata (timestamp, deployer address)

To manually trigger ABI export without deployment:

```bash
cd contracts
npm run export-abi
```

## Troubleshooting

### "ABI file not found"

Run contract compilation first:

```bash
cd contracts
npm run compile
npm run export-abi
```

### "Address is zero address"

Contracts have not been deployed to the target network. Run deployment:

```bash
cd contracts
npm run deploy:sepolia  # or appropriate network
```

### "Network not in addresses.json"

The target network has not been deployed to yet. Check `addresses.json` for available networks or run deployment for your target network.
