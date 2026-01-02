import type { Address } from 'viem'
import { sepolia, hardhat } from 'wagmi/chains'

// Import ABIs from shared
import AssetPassportABI from '../../../shared/abi/AssetPassport.json'
import EventRegistryABI from '../../../shared/abi/EventRegistry.json'

export { AssetPassportABI, EventRegistryABI }

// Contract addresses by chain ID
// Update these after deployment
const contractAddresses: Record<
  number,
  { assetPassport: Address; eventRegistry: Address }
> = {
  [sepolia.id]: {
    assetPassport: '0x0000000000000000000000000000000000000000' as Address,
    eventRegistry: '0x0000000000000000000000000000000000000000' as Address,
  },
  [hardhat.id]: {
    assetPassport: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address,
    eventRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as Address,
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
