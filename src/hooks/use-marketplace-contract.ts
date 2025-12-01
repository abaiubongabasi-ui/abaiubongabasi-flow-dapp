import { useReadContract } from "wagmi";
import { contracts } from "../lib/contracts";
import { useContractWriteWithErrorHandling } from "./use-contract-write-with-error-handling";

// Hook for listing NFT with enhanced error handling
export function useListNFT(options?: {
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}) {
  const { write, hash, isPending, isConfirming, isSuccess, error, reset } =
    useContractWriteWithErrorHandling({
      successMessage: "NFT listed for sale successfully",
      pendingMessage: "Listing NFT...",
      ...options,
    });

  const listNFT = (
    nftContract: `0x${string}`,
    tokenId: bigint,
    price: bigint
  ) => {
    write({
      address: contracts.marketplace.address,
      abi: contracts.marketplace.abi,
      functionName: "listNFT",
      args: [nftContract, tokenId, price],
    });
  };

  return {
    listNFT,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Hook for buying NFT with enhanced error handling
export function useBuyNFT(options?: {
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}) {
  const { write, hash, isPending, isConfirming, isSuccess, error, reset } =
    useContractWriteWithErrorHandling({
      successMessage: "NFT purchased successfully!",
      pendingMessage: "Purchasing NFT...",
      ...options,
    });

  const buyNFT = (
    nftContract: `0x${string}`,
    tokenId: bigint,
    value: bigint
  ) => {
    write({
      address: contracts.marketplace.address,
      abi: contracts.marketplace.abi,
      functionName: "buyNFT",
      args: [nftContract, tokenId],
      value: value,
    } as any);
  };

  return {
    buyNFT,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Hook for canceling listing with enhanced error handling
export function useCancelListing(options?: {
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}) {
  const { write, hash, isPending, isConfirming, isSuccess, error, reset } =
    useContractWriteWithErrorHandling({
      successMessage: "Listing cancelled successfully",
      pendingMessage: "Cancelling listing...",
      ...options,
    });

  const cancelListing = (nftContract: `0x${string}`, tokenId: bigint) => {
    write({
      address: contracts.marketplace.address,
      abi: contracts.marketplace.abi,
      functionName: "cancelListing",
      args: [nftContract, tokenId],
    });
  };

  return {
    cancelListing,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Hook for getting listing details
export function useGetListing(nftContract?: `0x${string}`, tokenId?: bigint) {
  return useReadContract({
    address: contracts.marketplace.address,
    abi: contracts.marketplace.abi,
    functionName: "getListing",
    args:
      nftContract && tokenId !== undefined ? [nftContract, tokenId] : undefined,
    query: {
      enabled: !!nftContract && tokenId !== undefined,
    },
  });
}

// Hook for getting all active listings with pagination
export function useGetAllActiveListings(
  offset: bigint = 0n,
  limit: bigint = 20n
) {
  return useReadContract({
    address: contracts.marketplace.address,
    abi: contracts.marketplace.abi,
    functionName: "getAllActiveListings",
    args: [offset, limit],
  });
}

// Hook for getting listings by collection
export function useGetListingsByCollection(nftContract?: `0x${string}`) {
  return useReadContract({
    address: contracts.marketplace.address,
    abi: contracts.marketplace.abi,
    functionName: "getListingsByCollection",
    args: nftContract ? [nftContract] : undefined,
    query: {
      enabled: !!nftContract,
    },
  });
}

// Hook for getting listings by seller
export function useGetListingsBySeller(seller?: `0x${string}`) {
  return useReadContract({
    address: contracts.marketplace.address,
    abi: contracts.marketplace.abi,
    functionName: "getListingsBySeller",
    args: seller ? [seller] : undefined,
    query: {
      enabled: !!seller,
    },
  });
}

// Hook for getting total active listings count
export function useGetTotalActiveListings() {
  return useReadContract({
    address: contracts.marketplace.address,
    abi: contracts.marketplace.abi,
    functionName: "getTotalActiveListings",
  });
}

// Hook for getting marketplace fee
export function useMarketplaceFee() {
  return useReadContract({
    address: contracts.marketplace.address,
    abi: contracts.marketplace.abi,
    functionName: "MARKETPLACE_FEE_BPS",
  });
}
