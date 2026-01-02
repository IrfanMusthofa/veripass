import { keccak256, toBytes } from 'viem';

/**
 * Hash metadata to bytes32 for on-chain storage
 * @param metadata - String or object to hash
 * @returns bytes32 hash as hex string
 */
export function hashMetadata(metadata: string | object): `0x${string}` {
  const data = typeof metadata === 'string'
    ? metadata
    : JSON.stringify(metadata);
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
