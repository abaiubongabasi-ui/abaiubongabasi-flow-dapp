import { useReadContract } from 'wagmi';
import { contracts } from '../lib/contracts';
import { useContractWriteWithErrorHandling } from './use-contract-write-with-error-handling';

// Hook for batch minting in a collection with enhanced error handling
export function useBatchMintCollection(
  collectionAddress: `0x${string}`,
  options?: {
    onSuccess?: (hash: `0x${string}`) => void
    onError?: (error: Error) => void
  }
) {
  const {
    write,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  } = useContractWriteWithErrorHandling({
    successMessage: 'NFTs batch minted successfully!',
    pendingMessage: 'Batch minting NFTs...',
    ...options,
  });

  const batchMint = (to: `0x${string}`, quantity: bigint) => {
    write({
      address: collectionAddress,
      abi: contracts.collection.abi,
      functionName: 'batchMint',
      args: [to, quantity],
    });
  };

  return {
    batchMint,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Hook for getting collection name
export function useCollectionName(collectionAddress?: `0x${string}`) {
  return useReadContract({
    address: collectionAddress,
    abi: contracts.collection.abi,
    functionName: 'name',
    query: {
      enabled: !!collectionAddress,
    },
  });
}

// Hook for getting collection symbol
export function useCollectionSymbol(collectionAddress?: `0x${string}`) {
  return useReadContract({
    address: collectionAddress,
    abi: contracts.collection.abi,
    functionName: 'symbol',
    query: {
      enabled: !!collectionAddress,
    },
  });
}

// Hook for getting collection max supply
export function useCollectionMaxSupply(collectionAddress?: `0x${string}`) {
  return useReadContract({
    address: collectionAddress,
    abi: contracts.collection.abi,
    functionName: 'maxSupply',
    query: {
      enabled: !!collectionAddress,
    },
  });
}

// Hook for getting collection total supply
export function useCollectionTotalSupply(collectionAddress?: `0x${string}`) {
  return useReadContract({
    address: collectionAddress,
    abi: contracts.collection.abi,
    functionName: 'totalSupply',
    query: {
      enabled: !!collectionAddress,
    },
  });
}

// Hook for getting collection token URI
export function useCollectionTokenURI(collectionAddress?: `0x${string}`, tokenId?: bigint) {
  return useReadContract({
    address: collectionAddress,
    abi: contracts.collection.abi,
    functionName: 'tokenURI',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: !!collectionAddress && tokenId !== undefined,
    },
  });
}

// Hook for getting collection token owner
export function useCollectionTokenOwner(collectionAddress?: `0x${string}`, tokenId?: bigint) {
  return useReadContract({
    address: collectionAddress,
    abi: contracts.collection.abi,
    functionName: 'ownerOf',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: !!collectionAddress && tokenId !== undefined,
    },
  });
}

// Hook for getting collection owner (creator)
export function useCollectionOwner(collectionAddress?: `0x${string}`) {
  return useReadContract({
    address: collectionAddress,
    abi: contracts.collection.abi,
    functionName: 'owner',
    query: {
      enabled: !!collectionAddress,
    },
  });
}

// Hook for setting collection base URI with enhanced error handling
export function useSetCollectionBaseURI(
  collectionAddress: `0x${string}`,
  options?: {
    onSuccess?: (hash: `0x${string}`) => void
    onError?: (error: Error) => void
  }
) {
  const {
    write,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  } = useContractWriteWithErrorHandling({
    successMessage: 'Base URI updated successfully',
    pendingMessage: 'Updating base URI...',
    ...options,
  });

  const setBaseURI = (newBaseURI: string) => {
    write({
      address: collectionAddress,
      abi: contracts.collection.abi,
      functionName: 'setBaseURI',
      args: [newBaseURI],
    });
  };

  return {
    setBaseURI,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Hook for approving collection NFT with enhanced error handling
export function useApproveCollectionNFT(
  collectionAddress: `0x${string}`,
  options?: {
    onSuccess?: (hash: `0x${string}`) => void
    onError?: (error: Error) => void
  }
) {
  const {
    write,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  } = useContractWriteWithErrorHandling({
    successMessage: 'NFT approved successfully',
    pendingMessage: 'Approving NFT...',
    ...options,
  });

  const approve = (to: `0x${string}`, tokenId: bigint) => {
    write({
      address: collectionAddress,
      abi: contracts.collection.abi,
      functionName: 'approve',
      args: [to, tokenId],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Hook for setting approval for all in collection with enhanced error handling
export function useSetApprovalForAllCollection(
  collectionAddress: `0x${string}`,
  options?: {
    onSuccess?: (hash: `0x${string}`) => void
    onError?: (error: Error) => void
  }
) {
  const {
    write,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  } = useContractWriteWithErrorHandling({
    successMessage: 'Approval set successfully',
    pendingMessage: 'Setting approval...',
    ...options,
  });

  const setApprovalForAll = (operator: `0x${string}`, approved: boolean) => {
    write({
      address: collectionAddress,
      abi: contracts.collection.abi,
      functionName: 'setApprovalForAll',
      args: [operator, approved],
    });
  };

  return {
    setApprovalForAll,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Hook for checking if approved for all in collection
export function useIsApprovedForAllCollection(
  collectionAddress?: `0x${string}`,
  owner?: `0x${string}`,
  operator?: `0x${string}`
) {
  return useReadContract({
    address: collectionAddress,
    abi: contracts.collection.abi,
    functionName: 'isApprovedForAll',
    args: owner && operator ? [owner, operator] : undefined,
    query: {
      enabled: !!collectionAddress && !!owner && !!operator,
    },
  });
}

// Hook for getting collection royalty info
export function useCollectionRoyaltyInfo(
  collectionAddress?: `0x${string}`,
  tokenId?: bigint,
  salePrice?: bigint
) {
  return useReadContract({
    address: collectionAddress,
    abi: contracts.collection.abi,
    functionName: 'royaltyInfo',
    args: tokenId !== undefined && salePrice !== undefined ? [tokenId, salePrice] : undefined,
    query: {
      enabled: !!collectionAddress && tokenId !== undefined && salePrice !== undefined,
    },
  });
}
