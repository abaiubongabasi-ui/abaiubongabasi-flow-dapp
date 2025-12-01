import { useReadContract } from 'wagmi';
import { contracts } from '../lib/contracts';
import { useContractWriteWithErrorHandling } from './use-contract-write-with-error-handling';

// Hook for getting mint price
export function useMintPrice() {
  return useReadContract({
    address: contracts.nft.address,
    abi: contracts.nft.abi,
    functionName: 'mintPrice',
  });
}

// Hook for getting total minted count
export function useTotalMinted() {
  return useReadContract({
    address: contracts.nft.address,
    abi: contracts.nft.abi,
    functionName: 'totalMinted',
  });
}

// Hook for minting NFT with tokenURI (new contract)
export function useMintNFT(options?: {
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
    successMessage: 'NFT minted successfully!',
    pendingMessage: 'Minting NFT...',
    ...options,
  });

  const mint = (tokenURI: string, value: bigint) => {
    write({
      address: contracts.nft.address,
      abi: contracts.nft.abi,
      functionName: 'mint',
      args: [tokenURI],
      value: value,
    } as any);
  };

  return {
    mint,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Hook for batch minting NFTs with enhanced error handling
export function useBatchMintNFT(options?: {
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
    successMessage: 'NFTs minted successfully!',
    pendingMessage: 'Batch minting NFTs...',
    ...options,
  });

  const mintBatch = (quantity: number, value: bigint) => {
    write({
      address: contracts.nft.address,
      abi: contracts.nft.abi,
      functionName: 'mintBatch',
      args: [BigInt(quantity)],
      value: value,
    } as any);
  };

  return {
    mintBatch,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Hook for getting NFT token URI
export function useTokenURI(tokenId?: bigint) {
  return useReadContract({
    address: contracts.nft.address,
    abi: contracts.nft.abi,
    functionName: 'tokenURI',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

// Hook for getting NFT owner
export function useNFTOwner(tokenId?: bigint) {
  return useReadContract({
    address: contracts.nft.address,
    abi: contracts.nft.abi,
    functionName: 'ownerOf',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

// Hook for getting royalty info
export function useRoyaltyInfo(tokenId?: bigint, salePrice?: bigint) {
  return useReadContract({
    address: contracts.nft.address,
    abi: contracts.nft.abi,
    functionName: 'royaltyInfo',
    args: tokenId !== undefined && salePrice !== undefined ? [tokenId, salePrice] : undefined,
    query: {
      enabled: tokenId !== undefined && salePrice !== undefined,
    },
  });
}

// Hook for approving marketplace with enhanced error handling
export function useApproveNFT(options?: {
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
    successMessage: 'NFT approved successfully',
    pendingMessage: 'Approving NFT...',
    ...options,
  });

  const approve = (to: `0x${string}`, tokenId: bigint) => {
    write({
      address: contracts.nft.address,
      abi: contracts.nft.abi,
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

// Hook for setting approval for all with enhanced error handling
export function useSetApprovalForAll(options?: {
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
    successMessage: 'Approval set successfully',
    pendingMessage: 'Setting approval...',
    ...options,
  });

  const setApprovalForAll = (operator: `0x${string}`, approved: boolean) => {
    write({
      address: contracts.nft.address,
      abi: contracts.nft.abi,
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

// Hook for checking if approved
export function useIsApprovedForAll(owner?: `0x${string}`, operator?: `0x${string}`) {
  return useReadContract({
    address: contracts.nft.address,
    abi: contracts.nft.abi,
    functionName: 'isApprovedForAll',
    args: owner && operator ? [owner, operator] : undefined,
    query: {
      enabled: !!owner && !!operator,
    },
  });
}
