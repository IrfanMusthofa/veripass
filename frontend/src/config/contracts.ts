import type { Address } from 'viem'
import { sepolia, hardhat } from 'wagmi/chains'

// Import ABIs from shared
import AssetPassportABI from '../../../shared/abi/AssetPassport.json'
import EventRegistryABI from '../../../shared/abi/EventRegistry.json'

export { AssetPassportABI, EventRegistryABI }

// Get contract addresses from environment variables
const ASSET_PASSPORT_ADDRESS = import.meta.env.VITE_ASSET_PASSPORT_ADDRESS as Address
const EVENT_REGISTRY_ADDRESS = import.meta.env.VITE_EVENT_REGISTRY_ADDRESS as Address

// Contract addresses by chain ID
const contractAddresses: Record<
  number,
  { assetPassport: Address; eventRegistry: Address }
> = {
  [sepolia.id]: {
    assetPassport: ASSET_PASSPORT_ADDRESS,
    eventRegistry: EVENT_REGISTRY_ADDRESS,
  },
  [hardhat.id]: {
    assetPassport: ASSET_PASSPORT_ADDRESS,
    eventRegistry: EVENT_REGISTRY_ADDRESS,
  },
}

export function getContractAddresses(chainId: number) {
  const addresses = contractAddresses[chainId]
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }
  return addresses
}

// Default to sepolia
export const DEFAULT_CHAIN_ID = sepolia.id

