# VeriPass Provider API Testing Guide

This guide provides cURL commands for testing the Provider API endpoints.

## Prerequisites

1. Backend server running: `bun run dev`
2. Oracle worker running: `bun run dev:oracle`
3. Set your `PROVIDER_API_KEY` in `.env`
4. Database with at least one asset (run `bun run db:seed` if needed)

## Environment Variables

```bash
# Set these for easier testing
export API_URL="http://localhost:3000"
export PROVIDER_KEY="your-provider-api-key-at-least-32-characters-long"
```

---

## 1. Create Service Record - Maintenance

```bash
curl -X POST "${API_URL}/api/provider/service-records" \
  -H "Content-Type: application/json" \
  -H "X-Provider-Key: ${PROVIDER_KEY}" \
  -d '{
    "assetId": 1,
    "eventType": "MAINTENANCE",
    "eventName": "Routine Service",
    "serviceDate": "2024-12-15",
    "technicianName": "John Smith",
    "technicianNotes": "Watch is in excellent condition. All components functioning properly.",
    "workPerformed": [
      "Movement cleaning and lubrication",
      "Water resistance test",
      "Timing adjustment",
      "Case polishing"
    ],
    "partsReplaced": [
      {
        "name": "Gasket",
        "partNumber": "GK-2024-001",
        "quantity": 1
      },
      {
        "name": "Crown tube",
        "partNumber": "CT-2024-003",
        "quantity": 1
      }
    ]
  }'
```

---

## 2. Create Service Record - Verification

```bash
curl -X POST "${API_URL}/api/provider/service-records" \
  -H "Content-Type: application/json" \
  -H "X-Provider-Key: ${PROVIDER_KEY}" \
  -d '{
    "assetId": 1,
    "eventType": "VERIFICATION",
    "eventName": "Authenticity Verification",
    "serviceDate": "2024-12-15",
    "technicianName": "Expert Verifier",
    "technicianNotes": "All serial numbers verified. Authentic product confirmed.",
    "workPerformed": [
      "Serial number verification",
      "Movement inspection",
      "Documentation check"
    ]
  }'
```

---

## 3. Create Service Record - Warranty

```bash
curl -X POST "${API_URL}/api/provider/service-records" \
  -H "Content-Type: application/json" \
  -H "X-Provider-Key: ${PROVIDER_KEY}" \
  -d '{
    "assetId": 1,
    "eventType": "WARRANTY",
    "eventName": "Warranty Claim - Battery Replacement",
    "serviceDate": "2024-12-15",
    "technicianName": "Service Tech",
    "technicianNotes": "Battery replaced under warranty. 2-year warranty on new battery.",
    "workPerformed": [
      "Battery test",
      "Battery replacement",
      "Function test"
    ],
    "partsReplaced": [
      {
        "name": "Battery",
        "partNumber": "BAT-2024-SW",
        "quantity": 1
      }
    ]
  }'
```

---

## 4. Create Service Record - Certification

```bash
curl -X POST "${API_URL}/api/provider/service-records" \
  -H "Content-Type: application/json" \
  -H "X-Provider-Key: ${PROVIDER_KEY}" \
  -d '{
    "assetId": 1,
    "eventType": "CERTIFICATION",
    "eventName": "COSC Chronometer Certification",
    "serviceDate": "2024-12-15",
    "technicianName": "Certification Officer",
    "technicianNotes": "Movement passed all COSC tests. Certificate number: COSC-2024-12345",
    "workPerformed": [
      "Precision testing",
      "Temperature variation test",
      "Position variation test"
    ]
  }'
```

---

## 5. Get Service Record by Record ID

Replace `SR-1234567890-abcd1234` with the actual record ID from the create response.

```bash
curl -X GET "${API_URL}/api/provider/service-records/SR-1234567890-abcd1234" \
  -H "X-Provider-Key: ${PROVIDER_KEY}"
```

---

## 6. Get All Service Records for an Asset

```bash
curl -X GET "${API_URL}/api/provider/service-records/asset/1" \
  -H "X-Provider-Key: ${PROVIDER_KEY}"
```

---

## Expected Flow

1. **Create Service Record**: Provider submits a service record via API
2. **Oracle Processing**: Oracle picks up the record (polling every 30s by default)
3. **Blockchain Recording**: Oracle calculates hash, signs, and submits to blockchain
4. **Evidence Creation**: Oracle creates evidence record with `isVerified: true`
5. **Check Status**: Provider can poll the record status until `processingStatus: "COMPLETED"`

## Response Examples

### Successful Create Response

```json
{
  "success": true,
  "message": "Service record created successfully. It will be processed by the oracle.",
  "data": {
    "id": 1,
    "recordId": "SR-1704067200000-abc12345",
    "assetId": 1,
    "providerId": "default-provider",
    "eventType": "MAINTENANCE",
    "eventName": "Routine Service",
    "serviceDate": "2024-12-15",
    "technicianName": "John Smith",
    "technicianNotes": "Watch is in excellent condition.",
    "workPerformed": ["Movement cleaning", "Water resistance test"],
    "partsReplaced": [{"name": "Gasket", "partNumber": "GK-2024-001", "quantity": 1}],
    "verified": true,
    "createdAt": "2024-12-15T10:00:00.000Z",
    "updatedAt": null
  }
}
```

### Get Record Response (After Oracle Processing)

```json
{
  "success": true,
  "message": "Service record retrieved successfully",
  "data": {
    "id": 1,
    "recordId": "SR-1704067200000-abc12345",
    "assetId": 1,
    "providerId": "default-provider",
    "eventType": "MAINTENANCE",
    "eventName": "Routine Service",
    "serviceDate": "2024-12-15",
    "technicianName": "John Smith",
    "technicianNotes": "Watch is in excellent condition.",
    "workPerformed": ["Movement cleaning", "Water resistance test"],
    "partsReplaced": [{"name": "Gasket", "partNumber": "GK-2024-001", "quantity": 1}],
    "verified": true,
    "createdAt": "2024-12-15T10:00:00.000Z",
    "updatedAt": null,
    "processingStatus": "COMPLETED",
    "evidenceId": 5,
    "blockchainEventId": 3,
    "txHash": "0x1234567890abcdef..."
  }
}
```

## Error Responses

### Invalid API Key

```json
{
  "error": "Invalid or missing provider API key"
}
```

### Asset Not Found

```json
{
  "error": "Asset not found"
}
```

### Invalid Event Type

```json
{
  "error": "Validation failed",
  "details": {
    "eventType": "Invalid enum value. Expected 'MAINTENANCE' | 'VERIFICATION' | 'WARRANTY' | 'CERTIFICATION'"
  }
}
```

---

## One-liner Tests (Copy & Paste Ready)

### Quick Maintenance Record Test

```bash
curl -X POST "http://localhost:3000/api/provider/service-records" -H "Content-Type: application/json" -H "X-Provider-Key: your-provider-api-key-at-least-32-characters-long" -d '{"assetId":1,"eventType":"MAINTENANCE","eventName":"Quick Service","serviceDate":"2024-12-15","technicianName":"Tech","technicianNotes":"Service completed"}'
```

### Check Record Status

```bash
curl -X GET "http://localhost:3000/api/provider/service-records/YOUR_RECORD_ID" -H "X-Provider-Key: your-provider-api-key-at-least-32-characters-long"
```
