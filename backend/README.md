# VeriPass Backend API

Backend API service for the VeriPass decentralized asset passport system. Provides off-chain data storage, Web3 authentication, and oracle integration for blockchain-verified asset lifecycle management.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Key Features](#key-features)

## Overview

The VeriPass Backend serves as the off-chain data layer for the VeriPass system, storing detailed asset metadata, event evidence, and service records. It integrates with smart contracts on Sepolia testnet to provide a complete asset provenance tracking solution.

**What it does:**
- Stores detailed asset metadata (manufacturer, model, serial number, images)
- Manages event evidence data (maintenance records, inspections, certifications)
- Provides Web3 wallet-based authentication (MetaMask)
- Manages verification request queue for the oracle
- Stores dummy service provider and service record data
- Calculates deterministic hashes for blockchain verification

## Tech Stack

- **Runtime**: Node.js (TypeScript)
- **Framework**: Hono.js (lightweight web framework)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Authentication**: JWT + Web3 (ethers.js)
- **Blockchain**: ethers.js (Sepolia testnet)

## Prerequisites

- Node.js 18+ or Bun
- PostgreSQL 14+ (or Docker)
- npm or bun package manager

## Installation

```bash
# Clone the repository (if not already done)
cd backend

# Install dependencies
npm install
# or
bun install
```

## Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure the `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_URL=postgresql://postgres:postgres@localhost:5432/veripass

# JWT (generate a secure 32+ character string)
JWT_SECRET=your-secure-jwt-secret-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173

# Oracle (must match the oracle's API key)
ORACLE_API_KEY=your-oracle-api-key-at-least-32-characters-long

# Blockchain (Sepolia testnet)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ASSET_PASSPORT_ADDRESS=0xE515A68227b1471C61c6b012eB0d450c08392d36
EVENT_REGISTRY_ADDRESS=0x2d389a0fc6A3d86eF3C94FaCf2F252EDfB3265e9
```

**Important**:
- Get Sepolia RPC URL from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
- Generate secure random strings for JWT_SECRET and ORACLE_API_KEY
- Contract addresses are already deployed on Sepolia

## Database Setup

### Option 1: Using Docker (Recommended)

```bash
# Start PostgreSQL container
cd ../infrastructure
docker-compose up -d

# Verify database is running
docker-compose ps
```

### Option 2: Local PostgreSQL

Install PostgreSQL locally and create a database:
```sql
CREATE DATABASE veripass;
```

### Run Migrations

```bash
# Push schema to database
npm run db:push

# Seed dummy data (service providers and records)
npm run db:seed

# Optional: Open Drizzle Studio to view database
npm run db:studio
```

## Running the Application

### Development Mode

```bash
npm run dev
# or
bun run dev
```

The server will start at `http://localhost:3000` with hot reload enabled.

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Verify Server is Running

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "VeriPass Backend API",
  "environment": "development",
  "timestamp": "2026-01-03T12:00:00.000Z"
}
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### 1. Get Nonce for Wallet Signing
```http
POST /api/auth/nonce
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "nonce": "0x1234567890abcdef..."
}
```

**Purpose**: Generate a unique nonce for the wallet to sign. This nonce expires in 5 minutes.

#### 2. Verify Signature & Get JWT Token
```http
POST /api/auth/verify
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "Sign this message to authenticate with VeriPass.\nNonce: 0x1234567890abcdef...",
  "signature": "0xabcdef1234567890..."
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "address": "0x742d35cc6634c0532925a3b844bc9e7595f0beb"
}
```

**Purpose**: Verify the wallet signature and receive a JWT token for authenticated requests.

#### 3. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "address": "0x742d35cc6634c0532925a3b844bc9e7595f0beb"
}
```

---

### Asset Endpoints

#### 1. Create Asset
```http
POST /api/assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "assetId": 1,
  "manufacturer": "Rolex",
  "model": "Submariner",
  "serialNumber": "ABC123456",
  "manufacturedDate": "2024-01-15",
  "description": "Luxury dive watch",
  "images": ["https://example.com/image1.jpg"],
  "metadata": {
    "color": "black",
    "material": "stainless steel"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "assetId": 1,
  "dataHash": "0x1234abcd...",
  "manufacturer": "Rolex",
  "model": "Submariner",
  "serialNumber": "ABC123456",
  "manufacturedDate": "2024-01-15",
  "description": "Luxury dive watch",
  "images": ["https://example.com/image1.jpg"],
  "metadata": { "color": "black", "material": "stainless steel" },
  "createdAt": "2026-01-03T12:00:00.000Z"
}
```

**Purpose**: Store off-chain asset metadata. The `dataHash` should match the hash stored on-chain in the AssetPassport contract.

#### 2. Get Asset by Hash
```http
GET /api/assets/by-hash/0x1234abcd...
```

**Response**: Same as create response

**Purpose**: Retrieve asset metadata by its hash (useful when you only have the on-chain hash).

#### 3. Get Asset by ID
```http
GET /api/assets/123
```

**Response**: Same as create response

**Purpose**: Retrieve asset metadata by asset ID.

---

### Evidence Endpoints

#### 1. Create Evidence
```http
POST /api/evidence
Authorization: Bearer <token>
Content-Type: application/json

{
  "assetId": 1,
  "eventType": "MAINTENANCE",
  "eventDate": "2024-12-01",
  "providerId": "rolex-service-jakarta",
  "providerName": "Rolex Service Center Jakarta",
  "description": "Routine maintenance performed",
  "files": [
    {
      "url": "https://example.com/invoice.pdf",
      "type": "application/pdf",
      "name": "Service Invoice"
    }
  ],
  "metadata": {
    "technician": "John Doe",
    "workPerformed": ["Movement cleaning", "Water resistance test"]
  }
}
```

**Response:**
```json
{
  "id": 1,
  "assetId": 1,
  "dataHash": "0xabcd1234...",
  "eventType": "MAINTENANCE",
  "eventDate": "2024-12-01",
  "providerId": "rolex-service-jakarta",
  "providerName": "Rolex Service Center Jakarta",
  "description": "Routine maintenance performed",
  "files": [...],
  "metadata": {...},
  "isVerified": false,
  "verifiedBy": null,
  "blockchainEventId": null,
  "txHash": null,
  "createdAt": "2026-01-03T12:00:00.000Z",
  "verifiedAt": null
}
```

**Event Types**: `MAINTENANCE`, `VERIFICATION`, `WARRANTY`, `CERTIFICATION`, `CUSTOM`

**Purpose**: Store event evidence data off-chain. Can be submitted by owner (self-reported) or oracle (verified).

#### 2. Get Evidence by Hash
```http
GET /api/evidence/by-hash/0xabcd1234...
```

**Purpose**: Retrieve evidence details by its data hash.

#### 3. Get Evidence by Asset ID
```http
GET /api/evidence/asset/1
```

**Response**: Array of evidence objects

**Purpose**: Get all evidence records for a specific asset.

---

### Verification Request Endpoints

#### 1. Create Verification Request
```http
POST /api/verification-requests
Content-Type: application/json

{
  "assetId": 1,
  "requestType": "SERVICE_VERIFICATION",
  "providerId": "rolex-service-jakarta",
  "requestedBy": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "id": 1,
  "requestId": "VR-1735905600000-abc123",
  "assetId": 1,
  "requestType": "SERVICE_VERIFICATION",
  "providerId": "rolex-service-jakarta",
  "requestedBy": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
  "status": "PENDING",
  "blockchainEventId": null,
  "txHash": null,
  "dataHash": null,
  "evidenceId": null,
  "errorMessage": null,
  "createdAt": "2026-01-03T12:00:00.000Z",
  "processedAt": null
}
```

**Request Types**: `SERVICE_VERIFICATION`, `AUTHENTICITY_CHECK`

**Purpose**: Queue a verification request for the oracle to process.

#### 2. Get Pending Verification Requests (Oracle Only)
```http
GET /api/verification-requests/pending
X-Oracle-Key: your-oracle-api-key
```

**Response**: Array of verification request objects with status `PENDING`

**Purpose**: Oracle polls this endpoint to find work.

#### 3. Update Verification Request (Oracle Only)
```http
PATCH /api/verification-requests/VR-1735905600000-abc123
X-Oracle-Key: your-oracle-api-key
Content-Type: application/json

{
  "status": "COMPLETED",
  "blockchainEventId": 123,
  "txHash": "0x1234abcd...",
  "dataHash": "0xabcd1234...",
  "evidenceId": 5
}
```

**Statuses**: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`

**Purpose**: Oracle updates request status after processing.

---

### Service Record Endpoints

#### 1. Get Service Records by Asset ID
```http
GET /api/service-records/1
```

**Response:**
```json
[
  {
    "recordId": "SVC-2024-001",
    "assetId": 1,
    "providerId": "rolex-service-jakarta",
    "serviceType": "ROUTINE_MAINTENANCE",
    "serviceDate": "2024-12-01",
    "technician": "Ahmad Rizki",
    "workPerformed": ["Movement cleaning", "Water resistance test", "Gasket replacement"],
    "notes": "Watch in excellent condition",
    "verified": true
  }
]
```

**Service Types**: `ROUTINE_MAINTENANCE`, `REPAIR`, `INSPECTION`, `REPLACEMENT`

**Purpose**: Dummy service records that the oracle fetches to verify authenticity. In production, this would connect to real external service provider APIs.

---

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── index.ts           # Database connection
│   │   ├── schema.ts          # Drizzle schema definitions
│   │   └── seed.ts            # Seed dummy data
│   ├── dtos/
│   │   ├── auth.dto.ts        # Auth request/response types
│   │   ├── asset.dto.ts       # Asset validation schemas
│   │   ├── evidence.dto.ts    # Evidence validation schemas
│   │   └── verification.dto.ts # Verification schemas
│   ├── lib/
│   │   ├── config.ts          # Environment config
│   │   ├── enums.ts           # Shared enums
│   │   ├── exceptions.ts      # Custom error classes
│   │   └── hash.ts            # Deterministic hash utility
│   ├── middlewares/
│   │   ├── auth.middleware.ts # JWT authentication
│   │   └── oracle.middleware.ts # Oracle API key auth
│   ├── routes/
│   │   ├── auth.route.ts      # Auth endpoints
│   │   ├── asset.route.ts     # Asset endpoints
│   │   ├── evidence.route.ts  # Evidence endpoints
│   │   ├── verification.route.ts # Verification endpoints
│   │   └── service-record.route.ts # Service record endpoints
│   ├── services/
│   │   ├── auth.service.ts    # Auth business logic
│   │   ├── asset.service.ts   # Asset CRUD
│   │   ├── evidence.service.ts # Evidence CRUD
│   │   ├── verification.service.ts # Verification logic
│   │   └── service-record.service.ts # Service record retrieval
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   └── index.ts               # Application entry point
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
└── drizzle.config.ts          # Drizzle ORM config
```

## Key Features

### 1. Web3 Wallet Authentication
- No username/password required
- Sign message with MetaMask to authenticate
- JWT tokens for session management
- Nonce-based replay attack prevention

### 2. Deterministic Hashing
- Consistent hash generation using sorted JSON keys
- Ensures on-chain and off-chain hashes always match
- Used for data integrity verification

### 3. Oracle Integration
- Queue-based verification request system
- Oracle authenticates using API key
- Automatic status tracking (PENDING → PROCESSING → COMPLETED/FAILED)

### 4. Type-Safe Validation
- Zod schemas for all API inputs
- Dynamic enum validation from TypeScript enums
- Comprehensive error messages

### 5. Flexible Metadata Storage
- JSONB fields for extensible metadata
- Support for images, files, and custom fields
- Efficient indexing for fast queries

### 6. Database Schema
- **assets**: Asset metadata storage
- **evidence**: Event evidence data
- **service_providers**: Trusted provider registry
- **service_records**: Dummy service data for oracle
- **verification_requests**: Oracle work queue
- **auth_nonces**: Web3 auth nonces

---

## Development Tips

### Database Management

```bash
# View database in browser
npm run db:studio

# Generate new migration
npm run db:generate

# Push schema changes
npm run db:push

# Reset database (drop all tables)
# Then re-run db:push and db:seed
```

### Testing API Endpoints

Use tools like:
- Thunder Client (VS Code extension)
- Postman
- curl

Example curl command:
```bash
# Get nonce
curl -X POST http://localhost:3000/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

### Common Issues

**Database connection failed:**
- Ensure PostgreSQL is running (`docker-compose ps`)
- Check DB_URL in `.env` file

**CORS errors:**
- Update `FRONTEND_URL` in `.env` to match your frontend URL

**JWT errors:**
- Ensure JWT_SECRET is at least 32 characters
- Token might be expired (default: 7 days)

---

## Related Documentation

- [Smart Contracts](../contracts/)
- [Oracle Worker](../oracle/)
- [Frontend](../frontend/)
- [Architecture Overview](../BACKEND_ORACLE_PLAN.md)

## License

MIT
