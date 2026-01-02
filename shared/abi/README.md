# VeriPass Shared ABI Package

This package provides contract ABIs and addresses for frontend/backend integration.

## Installation (from monorepo)

Frontend or backend packages can import directly:

```typescript
import { 
  AssetPassportABI, 
  EventRegistryABI, 
  getAddresses 
} from "../../shared/abi";
// or if using workspace alias:
import { ... } from "@veripass/abi";
```

## Quick Start

### Connect to Contracts

```typescript
import { ethers } from "ethers";
import { AssetPassportABI, EventRegistryABI, getAddresses } from "@veripass/abi";

const NETWORK = "sepolia";
const { assetPassport: PASSPORT_ADDR, eventRegistry: REGISTRY_ADDR } = getAddresses(NETWORK);

// Browser (MetaMask)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Or Node.js
// const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
// const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const assetPassport = new ethers.Contract(PASSPORT_ADDR, AssetPassportABI, signer);
const eventRegistry = new ethers.Contract(REGISTRY_ADDR, EventRegistryABI, signer);
```

### Mint Passport

```typescript
// Create metadata hash from off-chain JSON
const metadata = {
  manufacturer: "Rolex",
  model: "Submariner",
  serialNumber: "ABC123"
};
const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(metadata)));

// Mint (only authorized minters)
const tx = await assetPassport.mintPassport(recipientAddress, metadataHash);
const receipt = await tx.wait();

// Get token ID from event
const event = receipt.logs.find(log => log.topics[0] === assetPassport.interface.getEvent("PassportMinted").topicHash);
const tokenId = event.args.tokenId;
```

### Record Lifecycle Event

```typescript
// Only asset owner can record events
const eventData = { 
  type: "oil_change", 
  date: "2024-01-15", 
  mileage: 50000 
};
const dataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(eventData)));

// EventType: 0=MAINTENANCE, 1=VERIFICATION, 2=WARRANTY, 3=CERTIFICATION, 4=CUSTOM
const tx = await eventRegistry.recordEvent(tokenId, 0, dataHash);
await tx.wait();
```

### Read Asset Info

```typescript
const info = await assetPassport.getAssetInfo(tokenId);
console.log({
  metadataHash: info.metadataHash,
  mintTimestamp: Number(info.mintTimestamp),
  isActive: info.isActive
});

const owner = await assetPassport.ownerOf(tokenId);
console.log("Owner:", owner);
```

### Get Ownership History

```typescript
// Query Transfer events from blockchain
const filter = assetPassport.filters.Transfer(null, null, tokenId);
const events = await assetPassport.queryFilter(filter);

const history = events.map(e => ({
  from: e.args.from,
  to: e.args.to,
  block: e.blockNumber
}));
```

## After Deployment

1. Deploy contracts: `npx hardhat ignition deploy ignition/modules/AssetPassport.ts --network sepolia`
2. Copy addresses to `shared/abi/addresses.ts`
3. Frontend/backend can now use the package

## Types

```typescript
interface AssetInfo {
  metadataHash: string;  // bytes32
  mintTimestamp: number; // uint40
  isActive: boolean;
}

enum EventType {
  MAINTENANCE = 0,
  VERIFICATION = 1,
  WARRANTY = 2,
  CERTIFICATION = 3,
  CUSTOM = 4
}
```
