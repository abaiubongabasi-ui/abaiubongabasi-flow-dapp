import FlowNftArtifact from "../../abi/FlowNFT.json";
import MarketplaceArtifact from "../../abi/Marketplace.json";
import CollectionFactoryArtifact from "../../abi/CollectionFactory.json";
import CollectionArtifact from "../../abi/Collection.json";

// Contract addresses from environment variables
export const contracts = {
  nft: {
    address: (import.meta.env.VITE_NFT_CONTRACT_ADDRESS || "") as `0x${string}`,
    abi: FlowNftArtifact.abi,
  },
  marketplace: {
    address: (import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS ||
      "") as `0x${string}`,
    abi: MarketplaceArtifact.abi,
  },
  collectionFactory: {
    address: (import.meta.env.VITE_COLLECTION_FACTORY_ADDRESS ||
      "") as `0x${string}`,
    abi: CollectionFactoryArtifact.abi,
  },
  collection: {
    abi: CollectionArtifact.abi,
  },
} as const;

// Export ABIs separately for convenience
export const abis = {
  nft: FlowNftArtifact.abi,
  marketplace: MarketplaceArtifact.abi,
  collectionFactory: CollectionFactoryArtifact.abi,
  collection: CollectionArtifact.abi,
} as const;
