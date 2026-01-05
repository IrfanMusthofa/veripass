import { keccak256, toBytes } from 'viem';

/**
 * Sort object keys recursively to ensure deterministic serialization
 * This matches the backend hash calculation for consistency
 */
function sortKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }

  if (typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
    }

    return sorted;
  }

  return obj;
}

/**
 * Hash metadata to bytes32 for on-chain storage
 * Uses sorted keys to ensure consistent hashing across frontend/backend
 * @param metadata - String or object to hash
 * @returns bytes32 hash as hex string
 */
export function hashMetadata(metadata: string | object): `0x${string}` {
  const data = typeof metadata === 'string'
    ? metadata
    : JSON.stringify(sortKeys(metadata));
  return keccak256(toBytes(data));
}

/**
 * Verify that data matches a given hash
 * @param data - Original data
 * @param hash - Expected hash
 * @returns true if data hashes to the expected value
 */
export function verifyHash(data: string | object, hash: string): boolean {
  return hashMetadata(data) === hash;
}
