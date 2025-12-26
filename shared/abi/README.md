# Contract ABI Directory

This directory contains the compiled ABI (Application Binary Interface) files for VeriPass smart contracts. These files are the **single source of truth** for contract interfaces across all packages.

## Contents

After contract compilation and export, this directory will contain:

| File                  | Description                                      |
|-----------------------|--------------------------------------------------|
| `AssetPassport.json`  | ABI for the ERC-721 asset passport contract      |
| `EventRegistry.json`  | ABI for the append-only event registry contract  |

## Generation

ABI files are generated automatically by Hardhat during compilation and exported by the deploy script:

```bash
cd contracts
npm run compile      # Compiles contracts, generates ABIs in artifacts/
npm run export-abi   # Copies ABIs to shared/abi/
```

Or during deployment:

```bash
npm run deploy:sepolia  # Deploys and exports ABIs automatically
```

## Format

Each ABI file is a JSON array of function and event definitions:

```json
[
  {
    "type": "function",
    "name": "mintPassport",
    "inputs": [...],
    "outputs": [...],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "PassportMinted",
    "inputs": [...]
  }
]
```

## Usage

### In Frontend (with Vite path alias)

```typescript
import AssetPassportABI from "@shared/abi/AssetPassport.json";
import { ethers } from "ethers";

const contract = new ethers.Contract(address, AssetPassportABI, signer);
```

### In Oracle/Backend (relative import)

```typescript
import EventRegistryABI from "../../shared/abi/EventRegistry.json";
```

## Important Notes

1. **Do not edit these files manually** - They are auto-generated
2. **Do not copy to other directories** - Always import from here
3. **Commit to version control** - Enables development without local compilation
4. **Matches deployed contracts** - ABI must match the deployed contract version
