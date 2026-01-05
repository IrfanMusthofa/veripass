// Contract addresses by network
// Update these after deployment

export interface ContractAddresses {
  assetPassport: string;
  eventRegistry: string;
}

const addresses: Record<string, ContractAddresses> = {
  // Sepolia testnet - UPDATE AFTER DEPLOYMENT
  sepolia: {
    assetPassport: "", // npx hardhat ignition deploy ... --network sepolia
    eventRegistry: "",
  },
  // Local development
  localhost: {
    assetPassport: "",
    eventRegistry: "",
  },
  // Mainnet (future)
  mainnet: {
    assetPassport: "",
    eventRegistry: "",
  },
};

export function getAddresses(network: string): ContractAddresses {
  const addr = addresses[network];
  if (!addr) {
    throw new Error(`Unknown network: ${network}. Available: ${Object.keys(addresses).join(", ")}`);
  }
  if (!addr.assetPassport || !addr.eventRegistry) {
    throw new Error(`Contracts not deployed on ${network}. Update shared/abi/addresses.ts after deployment.`);
  }
  return addr;
}

export default addresses;
