import { useReadContract } from 'wagmi';
import { contracts } from '../lib/contracts';
import { useContractWriteWithErrorHandling } from './use-contract-write-with-error-handling';

// Hook for creating a collection with enhanced error handling
export function useCreateCollection(options?: {
  onSuccess?: (hash: `0x${string}`) => void
  onError?: (error: Error) => void
}) {
  const {
    write,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  } = useContractWriteWithErrorHandling({
    successMessage: 'Collection created successfully!',
    pendingMessage: 'Creating collection...',
    ...options,
  });

  const createCollection = (
    name: string,
    symbol: string,
    baseURI: string,
    maxSupply: bigint,
    royaltyBps: number
  ) => {
    write({
      address: contracts.collectionFactory.address,
      abi: contracts.collectionFactory.abi,
      functionName: 'createCollection',
      args: [name, symbol, baseURI, maxSupply, royaltyBps],
    });
  };

  return {
    createCollection,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Hook for getting collections by creator
export function useGetCollectionsByCreator(creator?: `0x${string}`) {
  return useReadContract({
    address: contracts.collectionFactory.address,
    abi: contracts.collectionFactory.abi,
    functionName: 'getCollectionsByCreator',
    args: creator ? [creator] : undefined,
    query: {
      enabled: !!creator,
    },
  });
}

// Hook for getting all collections
export function useGetAllCollections() {
  return useReadContract({
    address: contracts.collectionFactory.address,
    abi: contracts.collectionFactory.abi,
    functionName: 'getAllCollections',
  });
}

// Hook for getting total collections count
export function useGetTotalCollections() {
  return useReadContract({
    address: contracts.collectionFactory.address,
    abi: contracts.collectionFactory.abi,
    functionName: 'getTotalCollections',
  });
}

// Hook for getting creator collection count
export function useGetCreatorCollectionCount(creator?: `0x${string}`) {
  return useReadContract({
    address: contracts.collectionFactory.address,
    abi: contracts.collectionFactory.abi,
    functionName: 'getCreatorCollectionCount',
    args: creator ? [creator] : undefined,
    query: {
      enabled: !!creator,
    },
  });
}
