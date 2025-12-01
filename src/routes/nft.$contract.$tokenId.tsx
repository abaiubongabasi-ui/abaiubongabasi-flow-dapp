import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { useCollectionTokenURI, useCollectionTokenOwner, useCollectionRoyaltyInfo, useCollectionName, useIsApprovedForAllCollection, useSetApprovalForAllCollection } from '../hooks/use-collection-contract'
import { useTokenURI, useNFTOwner, useRoyaltyInfo, useIsApprovedForAll, useSetApprovalForAll } from '../hooks/use-nft-contract'
import { useGetListing, useListNFT, useCancelListing, useBuyNFT, useMarketplaceFee } from '../hooks/use-marketplace-contract'
import { contracts } from '../lib/contracts'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { LoadingSpinner } from '../components/loading-spinner'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { toast } from 'sonner'

export const Route = createFileRoute('/nft/$contract/$tokenId')({
  component: NFTDetailPage,
})

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string
  }>
}

function NFTDetailPage() {
  const { contract, tokenId } = Route.useParams()
  const { address: userAddress } = useAccount()
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [listPrice, setListPrice] = useState('')
  const [isListDialogOpen, setIsListDialogOpen] = useState(false)
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false)

  const contractAddress = contract as `0x${string}`
  const tokenIdBigInt = contract && tokenId ? BigInt(tokenId) : BigInt(0)
  const isNFTContract = contractAddress?.toLowerCase() === contracts.nft.address?.toLowerCase()

  // Fetch NFT data based on contract type
  const { data: nftTokenURI } = useTokenURI(isNFTContract ? tokenIdBigInt : undefined)
  const { data: collectionTokenURI } = useCollectionTokenURI(!isNFTContract ? contractAddress : undefined, !isNFTContract ? tokenIdBigInt : undefined)
  const tokenURI = (isNFTContract ? nftTokenURI : collectionTokenURI) as string | undefined

  const { data: nftOwner } = useNFTOwner(isNFTContract ? tokenIdBigInt : undefined)
  const { data: collectionOwner } = useCollectionTokenOwner(!isNFTContract ? contractAddress : undefined, !isNFTContract ? tokenIdBigInt : undefined)
  const owner = (isNFTContract ? nftOwner : collectionOwner) as `0x${string}` | undefined

  const { data: collectionNameData } = useCollectionName(!isNFTContract ? contractAddress : undefined)
  const collectionName = collectionNameData ? String(collectionNameData) : undefined

  // Fetch listing info
  const { data: listing, refetch: refetchListing } = useGetListing(contractAddress, tokenIdBigInt)
  const isListed = listing && (listing as any)[4] // active field
  const listingSeller = listing ? (listing as any)[0] as `0x${string}` : undefined

  // Fetch royalty info (use a sample price for display)
  const samplePrice = parseEther('1')
  const { data: nftRoyalty } = useRoyaltyInfo(isNFTContract ? tokenIdBigInt : undefined, samplePrice)
  const { data: collectionRoyalty } = useCollectionRoyaltyInfo(!isNFTContract ? contractAddress : undefined, !isNFTContract ? tokenIdBigInt : undefined, samplePrice)
  const royaltyInfo = isNFTContract ? nftRoyalty : collectionRoyalty
  // ERC-2981 returns (receiver, royaltyAmount) where royaltyAmount is in wei for the given price
  // Calculate percentage: (royaltyAmount / samplePrice) * 100
  const royaltyAmountWei = royaltyInfo ? (royaltyInfo as any)[1] : BigInt(0)
  const royaltyPercentage = royaltyAmountWei ? (Number(royaltyAmountWei) / Number(samplePrice)) * 100 : 0

  // Fetch marketplace fee
  const { data: marketplaceFee } = useMarketplaceFee()
  const marketplaceFeePercentage = marketplaceFee ? Number(marketplaceFee) / 100 : 2.5

  // Check approval status
  const { data: isApprovedForAll } = isNFTContract
    ? useIsApprovedForAll(owner, contracts.marketplace.address)
    : useIsApprovedForAllCollection(contractAddress, owner, contracts.marketplace.address)

  // Approval hooks
  const { setApprovalForAll: setNFTApproval, isPending: isApprovingNFT, isConfirming: isConfirmingNFTApproval, isSuccess: isNFTApprovalSuccess } = useSetApprovalForAll()
  const { setApprovalForAll: setCollectionApproval, isPending: isApprovingCollection, isConfirming: isConfirmingCollectionApproval, isSuccess: isCollectionApprovalSuccess } = useSetApprovalForAllCollection(contractAddress)

  const isApproving = isApprovingNFT || isApprovingCollection
  const isConfirmingApproval = isConfirmingNFTApproval || isConfirmingCollectionApproval
  const isApprovalSuccess = isNFTApprovalSuccess || isCollectionApprovalSuccess

  // Listing hooks
  const { listNFT, isPending: isListing, isConfirming: isConfirmingList, isSuccess: isListSuccess } = useListNFT()
  const { cancelListing, isPending: isCanceling, isConfirming: isConfirmingCancel, isSuccess: isCancelSuccess } = useCancelListing()
  const { buyNFT, isPending: isBuying, isConfirming: isConfirmingBuy, isSuccess: isBuySuccess } = useBuyNFT()

  // If NFT is listed, it's in marketplace escrow, so check against the listing seller
  // Otherwise, check against the actual owner
  const isOwner: boolean = Boolean(
    userAddress && (
      isListed
        ? listingSeller?.toLowerCase() === userAddress?.toLowerCase()
        : owner?.toLowerCase() === userAddress?.toLowerCase()
    )
  )
  const isSeller: boolean = Boolean(listing && userAddress && listingSeller?.toLowerCase() === userAddress?.toLowerCase())

  console.log("NFTDetailPage", { owner, userAddress, listing, contractAddress, nftContractAddress: contracts.nft.address, })

  // Validate params - check after all hooks
  if (!contract || !tokenId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Invalid NFT parameters</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Fetch metadata from token URI
  useEffect(() => {
    async function fetchMetadata() {
      if (!tokenURI) return

      try {
        setIsLoadingMetadata(true)
        setMetadataError(null)

        // Convert IPFS URIs to HTTP gateway URLs
        let url = tokenURI as string

        if (url.startsWith('ipfs://')) {
          url = url.replace('ipfs://', 'https://ipfs.io/ipfs/')
        }

        // Fetch metadata
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to fetch metadata')
        }

        const data = await response.json()

        // Convert image IPFS URIs to HTTP gateway URLs
        if (data.image && data.image.startsWith('ipfs://')) {
          data.image = data.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
        }

        setMetadata(data)
      } catch (error) {
        console.error('Error fetching metadata:', error)
        setMetadataError('Failed to load NFT metadata')
        // Set fallback metadata
        setMetadata({
          name: `NFT #${tokenId}`,
          description: 'Metadata unavailable',
          image: 'https://via.placeholder.com/600?text=NFT',
        })
      } finally {
        setIsLoadingMetadata(false)
      }
    }

    fetchMetadata()
  }, [tokenURI, tokenId])

  // Handle approval success
  useEffect(() => {
    if (isApprovalSuccess) {
      toast.success('Approval Successful', {
        description: 'You can now list this NFT for sale',
      })
    }
  }, [isApprovalSuccess])

  // Handle list success
  useEffect(() => {
    if (isListSuccess) {
      toast.success('NFT Listed', {
        description: 'Your NFT has been listed for sale',
      })
      setIsListDialogOpen(false)
      setListPrice('')
      refetchListing()
    }
  }, [isListSuccess, refetchListing])

  // Handle cancel success
  useEffect(() => {
    if (isCancelSuccess) {
      toast.success('Listing Cancelled', {
        description: 'Your NFT listing has been cancelled',
      })
      refetchListing()
    }
  }, [isCancelSuccess, refetchListing])

  // Handle buy success
  useEffect(() => {
    if (isBuySuccess) {
      toast.success('Purchase Successful', {
        description: 'You are now the owner of this NFT',
      })
      setIsBuyDialogOpen(false)
      refetchListing()
    }
  }, [isBuySuccess, refetchListing])

  function handleApprove() {
    if (isNFTContract) {
      setNFTApproval(contracts.marketplace.address, true)
    } else {
      setCollectionApproval(contracts.marketplace.address, true)
    }
  }

  function handleListNFT() {
    if (!listPrice || parseFloat(listPrice) <= 0) {
      toast.error('Invalid Price', {
        description: 'Please enter a valid price greater than 0',
      })
      return
    }

    try {
      const priceInWei = parseEther(listPrice)
      listNFT(contractAddress, tokenIdBigInt, priceInWei)
    } catch (error) {
      toast.error('Invalid Price', {
        description: 'Please enter a valid price',
      })
    }
  }

  function handleCancelListing() {
    cancelListing(contractAddress, tokenIdBigInt)
  }

  function handleBuyNFT() {
    if (!listing) return

    const price = (listing as any)[3] as bigint
    buyNFT(contractAddress, tokenIdBigInt, price)
  }

  if (isLoadingMetadata) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" text="Loading NFT details..." />
      </div>
    )
  }

  if (metadataError && !metadata) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{metadataError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const listingPrice = listing && (listing as any)[3] ? formatEther((listing as any)[3] as bigint) : null
  const royaltyAmount = listingPrice ? (parseFloat(listingPrice) * royaltyPercentage / 100).toFixed(4) : null
  const marketplaceFeeAmount = listingPrice ? (parseFloat(listingPrice) * marketplaceFeePercentage / 100).toFixed(4) : null
  const sellerAmount = listingPrice && royaltyAmount && marketplaceFeeAmount
    ? (parseFloat(listingPrice) - parseFloat(royaltyAmount) - parseFloat(marketplaceFeeAmount)).toFixed(4)
    : null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
                <img
                  src={metadata?.image || 'https://via.placeholder.com/600?text=NFT'}
                  alt={metadata?.name || 'NFT'}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://via.placeholder.com/600?text=NFT'
                  }}
                />
                {isListed && (
                  <Badge className="absolute top-4 right-4" variant="secondary">
                    Listed for Sale
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attributes */}
          {metadata?.attributes && metadata.attributes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attributes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {metadata.attributes.map((attr, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase">{attr.trait_type}</p>
                      <p className="font-semibold">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-4">
          <div>
            {collectionName && (
              <p className="text-sm text-muted-foreground mb-2">{collectionName}</p>
            )}
            <h1 className="text-4xl font-bold mb-2">{metadata?.name || `NFT #${tokenId}`}</h1>
            <p className="text-muted-foreground">{metadata?.description || 'No description available'}</p>
            {metadataError && (
              <Alert className="mt-4">
                <AlertDescription>
                  <p className="font-semibold mb-1">Metadata Error</p>
                  <p className="text-xs mb-2">{metadataError}</p>
                  {tokenURI && (
                    <p className="text-xs font-mono break-all">Token URI: {tokenURI}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Owner Info */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Contract Address</p>
                <p className="font-mono text-sm break-all">{contract}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Token ID</p>
                <p className="font-mono text-sm">{tokenId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-mono text-sm break-all">{isListed ? listingSeller : owner || 'Unknown'}</p>
                {isOwner && (
                  <Badge variant="secondary" className="mt-1">You own this NFT</Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Royalty</p>
                <p className="font-semibold">{royaltyPercentage}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Listing/Purchase Section */}
          {isListed && (
            <Card>
              <CardHeader>
                <CardTitle>Current Listing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-3xl font-bold">{listingPrice || '0'} FLOW</p>
                </div>

                {!isSeller && userAddress && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => setIsBuyDialogOpen(true)}
                      className="w-full"
                      size="lg"
                      isLoading={Boolean(isBuying || isConfirmingBuy)}
                      disabled={Boolean(isBuying || isConfirmingBuy)}
                    >
                      {Boolean(isBuying || isConfirmingBuy) ? 'Processing...' : 'Buy Now'}
                    </Button>
                  </div>
                )}

                {isSeller && (
                  <Button
                    onClick={handleCancelListing}
                    variant="destructive"
                    className="w-full"
                    isLoading={Boolean(isCanceling || isConfirmingCancel)}
                    disabled={Boolean(isCanceling || isConfirmingCancel)}
                  >
                    {Boolean(isCanceling || isConfirmingCancel) ? 'Cancelling...' : 'Cancel Listing'}
                  </Button>
                )}

                {!userAddress && (
                  <Alert>
                    <AlertDescription>Connect your wallet to purchase this NFT</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {!isListed && isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>List for Sale</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setIsListDialogOpen(true)}
                  className="w-full"
                  size="lg"
                >
                  List NFT for Sale
                </Button>
              </CardContent>
            </Card>
          )}

          {!isListed && !isOwner && !userAddress && (
            <Alert>
              <AlertDescription>This NFT is not currently listed for sale</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* List Dialog */}
      <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List NFT for Sale</DialogTitle>
            <DialogDescription>
              Set a price for your NFT. Buyers will pay this amount plus gas fees.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Price (FLOW)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                disabled={Boolean(isApproving || isConfirmingApproval || isListing || isConfirmingList)}
              />
            </div>

            {!isApprovedForAll && (
              <Alert>
                <AlertDescription>
                  You need to approve the marketplace to transfer your NFT before listing.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsListDialogOpen(false)}
              disabled={Boolean(isApproving || isConfirmingApproval || isListing || isConfirmingList)}
            >
              Cancel
            </Button>
            {!isApprovedForAll ? (
              <Button
                onClick={handleApprove}
                isLoading={Boolean(isApproving || isConfirmingApproval)}
                disabled={Boolean(isApproving || isConfirmingApproval)}
              >
                {Boolean(isApproving || isConfirmingApproval) ? 'Approving...' : 'Approve Marketplace'}
              </Button>
            ) : (
              <Button
                onClick={handleListNFT}
                isLoading={Boolean(isListing || isConfirmingList)}
                disabled={Boolean(isListing || isConfirmingList || !listPrice)}
              >
                {Boolean(isListing || isConfirmingList) ? 'Listing...' : 'List NFT'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buy Dialog */}
      <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase NFT</DialogTitle>
            <DialogDescription>
              Review the price breakdown before confirming your purchase.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">NFT Price</span>
              <span className="font-semibold">{listingPrice} FLOW</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Royalty ({royaltyPercentage}%)</span>
              <span>{royaltyAmount} FLOW</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Marketplace Fee ({marketplaceFeePercentage}%)</span>
              <span>{marketplaceFeeAmount} FLOW</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Seller Receives</span>
              <span>{sellerAmount} FLOW</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">{listingPrice} FLOW</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBuyDialogOpen(false)}
              disabled={Boolean(isBuying || isConfirmingBuy)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBuyNFT}
              isLoading={Boolean(isBuying || isConfirmingBuy)}
              disabled={Boolean(isBuying || isConfirmingBuy)}
            >
              {Boolean(isBuying || isConfirmingBuy) ? 'Processing...' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
