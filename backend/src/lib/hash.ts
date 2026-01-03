import { ethers } from "ethers";

/**
 * Sort object keys recursively to ensure deterministic serialization
 */
function sortKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }

  if (typeof obj === "object") {
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
 * Calculate deterministic keccak256 hash of data
 * This ensures the same data always produces the same hash
 * regardless of key ordering in JSON
 *
 * @param data - Data to hash (will be JSON stringified)
 * @returns Keccak256 hash as hex string with 0x prefix
 */
export function calculateHash(data: unknown): string {
  // Sort keys recursively to ensure consistent ordering
  const sorted = sortKeys(data);

  // Convert to JSON string
  const jsonString = JSON.stringify(sorted);

  // Convert to UTF-8 bytes
  const bytes = ethers.toUtf8Bytes(jsonString);

  // Calculate keccak256 hash
  const hash = ethers.keccak256(bytes);

  return hash;
}

/**
 * Verify that a hash matches the provided data
 *
 * @param data - Original data
 * @param expectedHash - Expected hash value
 * @returns True if hash matches, false otherwise
 */
export function verifyHash(data: unknown, expectedHash: string): boolean {
  const calculated = calculateHash(data);
  return calculated.toLowerCase() === expectedHash.toLowerCase();
}
