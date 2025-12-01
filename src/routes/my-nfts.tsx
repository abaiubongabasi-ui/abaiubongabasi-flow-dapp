import { createFileRoute } from '@tanstack/react-router'
import { useAccount, useWatchContractEvent } from 'wagmi'
import { useState, useEffect } from 'react'
import { formatEther, parseEther } from 'viem'
import { createPublicClient, http } from 'viem'
import { flowTestnet } from 'viem/chains'
import { toast } from 'sonner'
import { NFTCard } from '../components/nft-card'
import { NFTGridSkeleton } from '../components/loading-skeleton'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '../components/ui/empty'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Wallet, Tag, X } from 'lucide-react'
import { contracts } from '../lib/contracts'
import { useListNFT, useCancelListing } from '../hooks/use-marketplace-contract'
import { useSetApprovalForAll, useIsApprovedForAll } from '../hooks/use-nft-contract'

export const Route = createFileRoute('/my-nfts')({
  component: MyNFTsPage,
})

interface NFTMetadata {
  name: string
  description: string
  image: string
}

interface OwnedNFT {
  contractAddress: string
  tokenId: string
  metadata?: NFTMetadata
  collectionName?: string
  isListed: boolean
  listingPrice?: bigint
}

// Helper function to fetch metadata from URI
async function fetchMetadataFromURI(uri: string): Promise<NFTMetadata | null> {
  try {
    let fetchUrl = uri
    if (uri.startsWith('ipfs://')) {
      fetchUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }

    const response = await fetch(fetchUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`)
    }

    const metadata = await response.json()

    let imageUrl = metadata.image || ''
    if (imageUrl.startsWith('ipfs://')) {
      imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }

    return {
      name: metadata.name || 'Unnamed NFT',
      description: metadata.description || '',
      image: imageUrl,
    }
  } catch (error) {
    console.error('Error fetching metadata from URI:', error)
    return null
  }
}

function MyNFTsPage() {
  const { address, isConnected } = useAccount()
  const [ownedNFTs, setOwnedNFTs] = useState<OwnedNFT[]>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<OwnedNFT | null>(null)
  const [listPrice, setListPrice] = useState('')
  const [metadataCache] = useState<Map<string, NFTMetadata>>(new Map())

  // Check if marketplace is approved
  const { data: isApproved, refetch: refetchApproval } = useIsApprovedForAll(
    address,
    contracts.marketplace.address
  )

  // Approval hook
  const {
    setApprovalForAll,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
  } = useSetApprovalForAll()

  // List NFT hook
  const {
    listNFT,
    isPending: isListPending,
    isConfirming: isListConfirming,
    isSuccess: isListSuccess,
  } = useListNFT()

  // Cancel listing hook
  const {
    cancelListing,
    isPending: isCancelPending,
    isConfirming: isCancelConfirming,
    isSuccess: isCancelSuccess,
  } = useCancelListing()

  // Watch for Transfer events to update owned NFTs
  useWatchContractEvent({
    address: contracts.nft.address,
    abi: contracts.nft.abi,
    eventName: 'Transfer',
    onLogs: (logs) => {
      // Check if any transfer involves the current user
      const userInvolved = logs.some(
        (log: any) => log.args?.from === address || log.args?.to === address
      )
      if (userInvolved) {
        // Refetch owned NFTs
        fetchOwnedNFTs()
        toast.success('NFT ownership updated')
      }
    },
  })

  // Watch for marketplace events
  useWatchContractEvent({
    address: contracts.marketplace.address,
    abi: contracts.marketplace.abi,
    eventName: 'NFTListed',
    onLogs: (logs) => {
      const userListing = logs.some((log: any) => log.args?.seller === address)
      if (userListing) {
        fetchOwnedNFTs()
      }
    },
  })

  useWatchContractEvent({
    address: contracts.marketplace.address,
    abi: contracts.marketplace.abi,
    eventName: 'NFTSold',
    onLogs: (logs) => {
      const userSold = logs.some((log: any) => log.args?.seller === address)
      if (userSold) {
        toast.success('NFT sold successfully!')
        fetchOwnedNFTs()
      }
    },
  })

  useWatchContractEvent({
    address: contracts.marketplace.address,
    abi: contracts.marketplace.abi,
    eventName: 'ListingCancelled',
    onLogs: (logs) => {
      const userCancelled = logs.some((log: any) => log.args?.seller === address)
      if (userCancelled) {
        fetchOwnedNFTs()
      }
    },
  })

  // Fetch owned NFTs from a specific contract
  async function fetchNFTsFromContract(
    client: any,
    contractAddress: `0x${string}`,
    contractAbi: any,
    collectionName: string
  ): Promise<OwnedNFT[]> {
    const ownedTokens: OwnedNFT[] = []

    try {
      // Get total supply - try totalSupply first, then totalMinted
      let totalCount: bigint
      try {
        totalCount = await client.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: 'totalSupply',
        }) as bigint
      } catch {
        // If totalSupply doesn't exist, try totalMinted (for NFT.sol)
        totalCount = await client.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: 'totalMinted',
        }) as bigint
      }

      console.log(`Contract ${contractAddress} has total count:`, totalCount.toString())

      // Check each token ID to see if user owns it
      for (let tokenId = 1n; tokenId <= totalCount; tokenId++) {
        try {
          const owner = await client.readContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'ownerOf',
            args: [tokenId],
          }) as string

          // If user owns this token, fetch its details
          if (owner.toLowerCase() === address!.toLowerCase()) {
            // Fetch token URI
            const tokenURI = await client.readContract({
              address: contractAddress,
              abi: contractAbi,
              functionName: 'tokenURI',
              args: [tokenId],
            }) as string

            // Check if listed in marketplace
            const listing = await client.readContract({
              address: contracts.marketplace.address,
              abi: contracts.marketplace.abi,
              functionName: 'getListing',
              args: [contractAddress, tokenId],
            }) as any

            const isListed = listing && listing.active
            const listingPrice = isListed ? listing.price : undefined

            // Fetch metadata
            const cacheKey = `${contractAddress}-${tokenId.toString()}`
            let metadata: NFTMetadata | null = null

            if (metadataCache.has(cacheKey)) {
              metadata = metadataCache.get(cacheKey)!
            } else if (tokenURI) {
              metadata = await fetchMetadataFromURI(tokenURI)
              if (metadata) {
                metadataCache.set(cacheKey, metadata)
              }
            }

            const finalMetadata: NFTMetadata = metadata || {
              name: `NFT #${tokenId.toString()}`,
              description: `NFT from ${collectionName}`,
              image: `https://via.placeholder.com/400?text=NFT+${tokenId.toString()}`,
            }

            ownedTokens.push({
              contractAddress,
              tokenId: tokenId.toString(),
              metadata: finalMetadata,
              collectionName,
              isListed,
              listingPrice,
            })
          }
        } catch (error) {
          // Token might not exist or other error, skip it
          continue
        }
      }
    } catch (error) {
      console.error(`Error fetching NFTs from contract ${contractAddress}:`, error)
    }

    return ownedTokens
  }

  // Fetch owned NFTs from all sources
  async function fetchOwnedNFTs() {
    if (!address) return

    console.log('Starting to fetch owned NFTs for address:', address)
    setIsLoadingNFTs(true)
    try {
      const client = createPublicClient({
        chain: flowTestnet,
        transport: http(),
      })

      const allOwnedTokens: OwnedNFT[] = []

      // 1. Fetch NFTs from the main NFT contract
      console.log('Checking main NFT contract:', contracts.nft.address)
      if (contracts.nft.address && contracts.nft.address !== '0x0000000000000000000000000000000000000000') {
        let nftCollectionName = ''
        try {
          nftCollectionName = await client.readContract({
            address: contracts.nft.address,
            abi: contracts.nft.abi,
            functionName: 'name',
          }) as string
        } catch (err) {
          console.error('Error fetching NFT contract name:', err)
          nftCollectionName = `${contracts.nft.address.slice(0, 6)}...${contracts.nft.address.slice(-4)}`
        }

        console.log('Fetching NFTs from main contract:', nftCollectionName)
        const nftTokens = await fetchNFTsFromContract(
          client,
          contracts.nft.address,
          contracts.nft.abi,
          nftCollectionName
        )
        console.log('Found NFTs from main contract:', nftTokens.length)
        allOwnedTokens.push(...nftTokens)
      }

      // 2. Fetch all collections created by the user from CollectionFactory
      console.log('Checking CollectionFactory:', contracts.collectionFactory.address)
      if (contracts.collectionFactory.address && contracts.collectionFactory.address !== '0x0000000000000000000000000000000000000000') {
        try {
          const userCollections = await client.readContract({
            address: contracts.collectionFactory.address,
            abi: contracts.collectionFactory.abi,
            functionName: 'getCollectionsByCreator',
            args: [address],
          }) as `0x${string}`[]

          console.log('User collections found:', userCollections.length, userCollections)

          // Fetch NFTs from each collection
          for (const collectionAddress of userCollections) {
            let collectionName = ''
            try {
              collectionName = await client.readContract({
                address: collectionAddress,
                abi: contracts.collection.abi,
                functionName: 'name',
              }) as string
            } catch (err) {
              console.error('Error fetching collection name:', err)
              collectionName = `${collectionAddress.slice(0, 6)}...${collectionAddress.slice(-4)}`
            }

            console.log('Fetching NFTs from collection:', collectionName, collectionAddress)
            const collectionTokens = await fetchNFTsFromContract(
              client,
              collectionAddress,
              contracts.collection.abi,
              collectionName
            )
            console.log('Found NFTs from collection:', collectionTokens.length)
            allOwnedTokens.push(...collectionTokens)
          }
        } catch (error) {
          console.error('Error fetching user collections:', error)
        }
      }

      console.log('Total NFTs found:', allOwnedTokens.length)
      setOwnedNFTs(allOwnedTokens)
    } catch (error) {
      console.error('Error fetching owned NFTs:', error)
      toast.error('Failed to load your NFTs')
    } finally {
      setIsLoadingNFTs(false)
    }
  }

  // Fetch NFTs when address changes
  useEffect(() => {
    if (address) {
      fetchOwnedNFTs()
    }
  }, [address])

  // Handle approval success
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success('Marketplace approved successfully')
      refetchApproval()
    }
  }, [isApproveSuccess])

  // Handle list success
  useEffect(() => {
    if (isListSuccess) {
      toast.success('NFT listed successfully')
      setListDialogOpen(false)
      setSelectedNFT(null)
      setListPrice('')
      fetchOwnedNFTs()
    }
  }, [isListSuccess])

  // Handle cancel success
  useEffect(() => {
    if (isCancelSuccess) {
      toast.success('Listing cancelled successfully')
      fetchOwnedNFTs()
    }
  }, [isCancelSuccess])

  // Handle list for sale
  function handleListForSale(nft: OwnedNFT) {
    setSelectedNFT(nft)
    setListDialogOpen(true)
  }

  // Handle cancel listing
  function handleCancelListing(nft: OwnedNFT) {
    if (!nft.contractAddress || !nft.tokenId) return

    toast.loading('Cancelling listing...')
    cancelListing(nft.contractAddress as `0x${string}`, BigInt(nft.tokenId))
  }

  // Submit listing
  async function handleSubmitListing() {
    if (!selectedNFT || !listPrice) return

    const priceInWei = parseEther(listPrice)

    if (priceInWei <= 0n) {
      toast.error('Price must be greater than 0')
      return
    }

    // Check if marketplace is approved
    if (!isApproved) {
      toast.loading('Approving marketplace...')
      setApprovalForAll(contracts.marketplace.address, true)
      return
    }

    // List the NFT
    toast.loading('Listing NFT...')
    listNFT(
      selectedNFT.contractAddress as `0x${string}`,
      BigInt(selectedNFT.tokenId),
      priceInWei
    )
  }

  // Retry listing after approval
  useEffect(() => {
    if (isApproveSuccess && selectedNFT && listPrice && listDialogOpen) {
      const priceInWei = parseEther(listPrice)
      toast.loading('Listing NFT...')
      listNFT(
        selectedNFT.contractAddress as `0x${string}`,
        BigInt(selectedNFT.tokenId),
        priceInWei
      )
    }
  }, [isApproveSuccess])

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Empty className="border min-h-[400px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Wallet Not Connected</EmptyTitle>
            <EmptyDescription>
              Please connect your wallet to view your NFTs
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  const isProcessing = isApprovePending || isApproveConfirming || isListPending || isListConfirming || isCancelPending || isCancelConfirming

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My NFTs</h1>
        <p className="text-muted-foreground">
          Manage your NFT collection
        </p>
      </div>

      {/* Loading State */}
      {isLoadingNFTs && <NFTGridSkeleton count={8} />}

      {/* Empty State */}
      {!isLoadingNFTs && ownedNFTs.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Tag className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No NFTs found</EmptyTitle>
            <EmptyDescription>
              You don't own any NFTs yet. Start by minting your first NFT!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* NFT Grid */}
      {!isLoadingNFTs && ownedNFTs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ownedNFTs.map((nft) => (
            <div key={`${nft.contractAddress}-${nft.tokenId}`} className="relative">
              <NFTCard
                contractAddress={nft.contractAddress}
                tokenId={nft.tokenId}
                name={nft.metadata?.name || `NFT #${nft.tokenId}`}
                image={nft.metadata?.image || 'https://via.placeholder.com/400?text=NFT'}
                price={nft.isListed && nft.listingPrice ? formatEther(nft.listingPrice) : undefined}
                collectionName={nft.collectionName}
                isListed={nft.isListed}
              />
              <div className="mt-3 flex gap-2">
                {nft.isListed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleCancelListing(nft)}
                    isLoading={isProcessing}
                    disabled={isProcessing}
                  >
                    {!isProcessing && <X className="h-4 w-4 mr-2" />}
                    Cancel Listing
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => handleListForSale(nft)}
                    isLoading={isProcessing}
                    disabled={isProcessing}
                  >
                    {!isProcessing && <Tag className="h-4 w-4 mr-2" />}
                    List for Sale
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List for Sale Dialog */}
      <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List NFT for Sale</DialogTitle>
            <DialogDescription>
              Set a price for your NFT. The marketplace will take a 2.5% fee on the sale.
            </DialogDescription>
          </DialogHeader>

          {selectedNFT && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <img
                  src={selectedNFT.metadata?.image || 'https://via.placeholder.com/100?text=NFT'}
                  alt={selectedNFT.metadata?.name || 'NFT'}
                  className="w-20 h-20 object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://via.placeholder.com/100?text=NFT'
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedNFT.metadata?.name || `NFT #${selectedNFT.tokenId}`}</h3>
                  <p className="text-sm text-muted-foreground">Token ID: {selectedNFT.tokenId}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (FLOW)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  You will receive {listPrice ? (Number(listPrice) * 0.975).toFixed(4) : '0.00'} FLOW after marketplace fee
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setListDialogOpen(false)
                setSelectedNFT(null)
                setListPrice('')
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitListing}
              isLoading={isProcessing}
              disabled={!listPrice || Number(listPrice) <= 0 || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'List NFT'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
