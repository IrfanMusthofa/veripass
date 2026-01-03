# VeriPass Oracle Worker

Automated worker that processes verification requests, fetches service provider data, and submits verified events to the blockchain.

## Prerequisites

- Node.js 18+ or Bun
- Private key with Sepolia ETH for gas fees

## Installation

```bash
cd oracle
npm install
# or
bun install
```

## Environment Setup

```bash
cp .env.example .env
```

Configure `.env`:

```env
# Backend API
BACKEND_API_URL=http://localhost:3000
ORACLE_API_KEY=your-oracle-api-key-at-least-32-characters-long

# Blockchain (Sepolia testnet)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ORACLE_PRIVATE_KEY=0x1234567890abcdef...  # Your oracle wallet private key

# Polling
POLL_INTERVAL=30000  # Poll every 30 seconds

# Contract addresses (already deployed)
ASSET_PASSPORT_ADDRESS=0xE515A68227b1471C61c6b012eB0d450c08392d36
EVENT_REGISTRY_ADDRESS=0x2d389a0fc6A3d86eF3C94FaCf2F252EDfB3265e9
```

**Important:**
- `ORACLE_API_KEY` must match backend's `ORACLE_API_KEY`
- Get Sepolia RPC from [Alchemy](https://www.alchemy.com/)
- Oracle wallet needs Sepolia ETH for gas ([Sepolia faucet](https://sepoliafaucet.com/))

## Running the Oracle

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## How It Works

1. **Poll** - Checks backend every 30s for pending verification requests
2. **Fetch** - Gets service records from backend API (dummy data for PoC)
3. **Validate** - Verifies service provider exists and records match
4. **Create Evidence** - Stores evidence data in backend
5. **Sign** - Creates cryptographic signature of data hash
6. **Submit** - Sends verified event to EventRegistry smart contract
7. **Update** - Marks request as COMPLETED with blockchain transaction hash

## Verification Flow

```
Verification Request (PENDING)
        “
Oracle polls /api/verification-requests/pending
        “
Update status to PROCESSING
        “
Fetch service records from /api/service-records/{assetId}
        “
Validate provider exists and data matches
        “
Create evidence via POST /api/evidence
        “
Sign evidence hash with oracle private key
        “
Submit to blockchain (EventRegistry.recordVerifiedEvent)
        “
Update request status to COMPLETED with txHash
```

## API Integration

Oracle authenticates using `X-Oracle-Key` header for these endpoints:

- `GET /api/verification-requests/pending` - Get work queue
- `PATCH /api/verification-requests/{requestId}` - Update request status
- `GET /api/service-records/{assetId}` - Fetch service data
- `POST /api/evidence` - Store verified evidence

## Contract Interaction

**EventRegistry.recordVerifiedEvent()**
```solidity
function recordVerifiedEvent(
    uint256 assetId,
    bytes32 dataHash,
    bytes memory signature
) external returns (uint256 eventId)
```

Oracle submits:
- `assetId` - Asset being verified
- `dataHash` - keccak256 hash of evidence data
- `signature` - Oracle's ECDSA signature of dataHash

Contract verifies signature matches authorized oracle address.

## Error Handling

Failed requests are marked with status `FAILED` and `errorMessage` containing:
- Service provider not found
- No service records found
- Blockchain transaction errors
- Signature verification failures
