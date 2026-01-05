import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { sepolia, hardhat } from 'wagmi/chains'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo'
const sepoliaRpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'

export const config = getDefaultConfig({
  appName: 'VeriPass',
  projectId,
  chains: [sepolia, hardhat],
  transports: {
    [sepolia.id]: http(sepoliaRpcUrl),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
})

export const supportedChains = [sepolia, hardhat] as const
