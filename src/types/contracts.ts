// Contract types and interfaces

export interface Listing {
  seller: `0x${string}`;
  nftContract: `0x${string}`;
  tokenId: bigint;
  price: bigint;
  active: boolean;
  listedAt: bigint;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface CollectionInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  maxSupply: bigint;
  totalSupply: bigint;
  owner: `0x${string}`;
}

export interface NFTInfo {
  contractAddress: `0x${string}`;
  tokenId: bigint;
  owner: `0x${string}`;
  tokenURI: string;
  metadata?: NFTMetadata;
}

export interface RoyaltyInfo {
  receiver: `0x${string}`;
  amount: bigint;
}

// Contract addresses type
export interface ContractAddresses {
  nft: `0x${string}`;
  marketplace: `0x${string}`;
  collectionFactory: `0x${string}`;
}

// Transaction status types
export type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

// Marketplace constants
export const MARKETPLACE_FEE_BPS = 250; // 2.5%
export const BPS_DENOMINATOR = 10000;
export const MAX_ROYALTY_BPS = 1000; // 10%
