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

export default addresses;
