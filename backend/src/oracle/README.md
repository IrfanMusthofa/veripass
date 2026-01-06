# VeriPass Oracle Worker

Background service that processes service records and submits verified events to the blockchain.

## Quick Start

```bash
cd backend
bun run dev:oracle
```

## Architecture

```
┌─────────────────┐    poll     ┌─────────────────┐
│   PostgreSQL    │◄────────────│  OracleWorker   │
│ (service_records│             │   (worker.ts)   │
│  provider_a)    │             └────────┬────────┘
└─────────────────┘                      │
                                         │ process
                                         ▼
                              ┌─────────────────┐
                              │    Verifier     │
                              │  (verifier.ts)  │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
           ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
           │  Calculate   │   │   Sign Hash  │   │   Submit TX  │
           │    Hash      │   │   (wallet)   │   │  (blockchain)│
           └──────────────┘   └──────────────┘   └──────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `worker.ts` | Main worker class with polling loop |
| `verifier.ts` | Processes records: hash, sign, submit, create evidence |
| `blockchain.ts` | Contract interaction via ethers.js |
| `backend-client.ts` | Database queries for service records |

## Processing Flow

1. **Poll** - Fetch unprocessed service records from `service_records_provider_a`
2. **Validate** - Check record is verified by provider
3. **Hash** - Calculate deterministic keccak256 hash (matches frontend algorithm)
4. **Sign** - Sign hash with oracle wallet
5. **Submit** - Call `recordVerifiedEvent()` on EventRegistry contract
6. **Evidence** - Create evidence record in database with CONFIRMED status

## Configuration

Required in `backend/.env`:

```bash
ORACLE_PRIVATE_KEY=0x...       # Oracle wallet private key (64 hex chars)
ORACLE_API_KEY=...             # API key for oracle authentication
SEPOLIA_RPC_URL=https://...    # Blockchain RPC endpoint
EVENT_REGISTRY_ADDRESS=0x...   # Deployed EventRegistry contract
POLL_INTERVAL=15000            # Polling interval in ms (default: 15s)
```

## Oracle Registration

The oracle wallet must be registered as a trusted oracle on EventRegistry before processing:

```bash
# In contracts/
bun hardhat run scripts/add-authorized.ts --network sepolia
```

Or programmatically:
```solidity
eventRegistry.addTrustedOracle(oracleAddress)
```

## Status Tracking

Service records are tracked through `processed_service_records` table:

| Status | Description |
|--------|-------------|
| `PENDING` | Queued for processing |
| `PROCESSING` | Currently being processed |
| `COMPLETED` | Successfully submitted to blockchain |
| `FAILED` | Processing failed (check errorMessage) |

## Shutdown

Graceful shutdown on SIGINT/SIGTERM - completes current processing before exit.
