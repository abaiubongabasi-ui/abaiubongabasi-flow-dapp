import { type Address } from 'viem';
import { BPS_DENOMINATOR, MAX_ROYALTY_BPS, MARKETPLACE_FEE_BPS } from '../types/contracts';

/**
 * Calculate royalty amount from sale price and royalty basis points
 */
export function calculateRoyalty(salePrice: bigint, royaltyBps: number): bigint {
  return (salePrice * BigInt(royaltyBps)) / BigInt(BPS_DENOMINATOR);
}

/**
 * Calculate marketplace fee from sale price
 */
export function calculateMarketplaceFee(salePrice: bigint): bigint {
  return (salePrice * BigInt(MARKETPLACE_FEE_BPS)) / BigInt(BPS_DENOMINATOR);
}

/**
 * Calculate seller proceeds after royalty and marketplace fee
 */
export function calculateSellerProceeds(
  salePrice: bigint,
  royaltyBps: number
): {
  royaltyAmount: bigint;
  marketplaceFee: bigint;
  sellerProceeds: bigint;
} {
  const royaltyAmount = calculateRoyalty(salePrice, royaltyBps);
  const marketplaceFee = calculateMarketplaceFee(salePrice);
  const sellerProceeds = salePrice - royaltyAmount - marketplaceFee;

  return {
    royaltyAmount,
    marketplaceFee,
    sellerProceeds,
  };
}

/**
 * Validate royalty percentage (0-10%)
 */
export function validateRoyaltyBps(royaltyBps: number): boolean {
  return royaltyBps >= 0 && royaltyBps <= MAX_ROYALTY_BPS;
}

/**
 * Convert royalty percentage to basis points
 * @param percentage - Royalty percentage (0-10)
 * @returns Basis points (0-1000)
 */
export function percentageToBps(percentage: number): number {
  return Math.round(percentage * 100);
}

/**
 * Convert basis points to percentage
 * @param bps - Basis points (0-1000)
 * @returns Percentage (0-10)
 */
export function bpsToPercentage(bps: number): number {
  return bps / 100;
}

/**
 * Format price in FLOW tokens
 */
export function formatFlowPrice(wei: bigint, decimals: number = 4): string {
  const flow = Number(wei) / 1e18;
  return flow.toFixed(decimals);
}

/**
 * Parse FLOW price to wei
 */
export function parseFlowPrice(flow: string): bigint {
  const value = parseFloat(flow);
  if (isNaN(value) || value < 0) {
    throw new Error('Invalid price');
  }
  return BigInt(Math.floor(value * 1e18));
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: Address, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Check if address is valid
 */
export function isValidAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get block explorer URL for transaction
 */
export function getExplorerTxUrl(txHash: string, chainId: number): string {
  const baseUrls: Record<number, string> = {
    545: 'https://evm-testnet.flowscan.io/tx',
    747: 'https://evm.flowscan.io/tx',
  };
  
  const baseUrl = baseUrls[chainId] || baseUrls[545];
  return `${baseUrl}/${txHash}`;
}

/**
 * Get block explorer URL for address
 */
export function getExplorerAddressUrl(address: Address, chainId: number): string {
  const baseUrls: Record<number, string> = {
    545: 'https://evm-testnet.flowscan.io/address',
    747: 'https://evm.flowscan.io/address',
  };
  
  const baseUrl = baseUrls[chainId] || baseUrls[545];
  return `${baseUrl}/${address}`;
}

/**
 * Get block explorer URL for NFT
 */
export function getExplorerNFTUrl(
  contractAddress: Address,
  tokenId: bigint,
  chainId: number
): string {
  const baseUrls: Record<number, string> = {
    545: 'https://evm-testnet.flowscan.io/token',
    747: 'https://evm.flowscan.io/token',
  };
  
  const baseUrl = baseUrls[chainId] || baseUrls[545];
  return `${baseUrl}/${contractAddress}?a=${tokenId}`;
}

/**
 * Fetch NFT metadata from URI
 */
export async function fetchNFTMetadata(tokenURI: string): Promise<any> {
  try {
    // Handle IPFS URIs
    let url = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    throw error;
  }
}

/**
 * Parse contract error message
 */
export function parseContractError(error: any): string {
  if (!error) return 'Unknown error';
  
  // Extract revert reason if available
  if (error.message) {
    // Check for common error patterns
    if (error.message.includes('user rejected')) {
      return 'Transaction rejected by user';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    if (error.message.includes('execution reverted')) {
      // Try to extract custom error message
      const match = error.message.match(/execution reverted: (.+)/);
      if (match) {
        return match[1];
      }
      return 'Transaction reverted';
    }
  }
  
  return error.message || 'Transaction failed';
}
