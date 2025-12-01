import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { formatEther } from 'viem'
import { createPublicClient, http } from 'viem'
import { flowTestnet } from 'viem/chains'
import {
  useCollectionName,
  useCollectionSymbol,
  useCollectionMaxSupply,
  useCollectionTotalSupply,
} from '../hooks/use-collection-contract'
import { useGetListingsByCollection } from '../hooks/use-marketplace-contract'
import { NFTCard } from '../components/nft-card'
import { NFTGridSkeleton } from '../components/loading-skeleton'
import { PaginationControls } from '../components/pagination-controls'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '../components/ui/empty'
import { Card, CardContent } from '../components/ui/card'
import { PackageOpen } from 'lucide-react'
import { abis } from '../lib/contracts'

interface CollectionSearchParams {
  page?: number
}

export const Route = createFileRoute('/collection/$address')({
  component: CollectionDetailPage,
  validateSearch: (search: Record<string, unknown>): CollectionSearchParams => {
    return {
      page: Number(search?.page) || 1,
    }
  },
})

interface NFTMetadata {
  name: string
  description: string
  image: string
}

interface CollectionNFT {
  tokenId: string
  owner: string
  metadata?: NFTMetadata
  isListed: boolean
  listingPrice?: bigint
}

const ITEMS_PER_PAGE = 20

// Helper function to fetch metadata from URI
async function fetchMetadataFromURI(uri: string): Promise<NFTMetadata | null> {
  console.log('Fetching metadata from URI:', { uri })
  try {
    let fetchUrl = uri
    
    // Convert IPFS URIs to HTTP gateway URLs first
    if (fetchUrl.startsWith('ipfs://')) {
      fetchUrl = fetchUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }

    const response = await fetch(fetchUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`)
    }

    const metadata = await response.json()

    // Convert image IPFS URIs to HTTP gateway URLs
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

function CollectionDetailPage() {
  const navigate = useNavigate({ from: '/collection/$address' })
  const { address } = Route.useParams()
  const { page = 1 } = Route.useSearch()

  const collectionAddress = address as `0x${string}`

  const [collectionNFTs, setCollectionNFTs] = useState<CollectionNFT[]>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
  const [metadataCache] = useState<Map<string, NFTMetadata>>(new Map())

  // Fetch collection metadata
  const { data: collectionName, isLoading: isLoadingName } = useCollectionName(collectionAddress)
  const { data: collectionSymbol, isLoading: isLoadingSymbol } = useCollectionSymbol(collectionAddress)
  const { data: maxSupply, isLoading: isLoadingMaxSupply } = useCollectionMaxSupply(collectionAddress)
  const { data: totalSupply, isLoading: isLoadingTotalSupply } = useCollectionTotalSupply(collectionAddress)

  // Fetch listings for this collection
  const { data: listingsData, isLoading: isLoadingListings } = useGetListingsByCollection(collectionAddress)

  // Create a map of listed token IDs for quick lookup
  const listingsMap = useMemo(() => {
    if (!listingsData || !Array.isArray(listingsData)) return new Map()

    const map = new Map<string, { price: bigint; active: boolean }>()
    const listings = listingsData as any[]

    listings.forEach((listing) => {
      if (listing.active) {
        map.set(listing.tokenId.toString(), {
          price: listing.price,
          active: listing.active,
        })
      }
    })

    return map
  }, [listingsData])

  // Fetch all NFTs in the collection
  useEffect(() => {
    async function fetchCollectionNFTs() {
      if (!totalSupply) return

      setIsLoadingNFTs(true)
      try {
        const client = createPublicClient({
          chain: flowTestnet,
          transport: http(),
        })

        const nfts: CollectionNFT[] = []
        const supply = Number(totalSupply)

        // Fetch each token in the collection (Collection contract starts from tokenId 1)
        for (let tokenId = 1; tokenId <= supply; tokenId++) {
          try {
            // Fetch owner
            const owner = await client.readContract({
              address: collectionAddress,
              abi: abis.collection,
              functionName: 'ownerOf',
              args: [BigInt(tokenId)],
            }) as string

            // Fetch token URI
            const tokenURI = await client.readContract({
              address: collectionAddress,
              abi: abis.collection,
              functionName: 'tokenURI',
              args: [BigInt(tokenId)],
            }) as string

            // Check if listed
            const listingInfo = listingsMap.get(tokenId.toString())
            const isListed = !!listingInfo
            const listingPrice = listingInfo?.price

            // Fetch metadata
            const cacheKey = `${collectionAddress}-${tokenId}`
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
              name: `${collectionName || 'NFT'} #${tokenId}`,
              description: '',
              image: `https://via.placeholder.com/400?text=NFT+${tokenId}`,
            }

            nfts.push({
              tokenId: tokenId.toString(),
              owner,
              metadata: finalMetadata,
              isListed,
              listingPrice,
            })
          } catch (error) {
            console.error(`Error fetching token ${tokenId}:`, error)
            // Skip tokens that fail to load
            continue
          }
        }

        setCollectionNFTs(nfts)
      } catch (error) {
        console.error('Error fetching collection NFTs:', error)
      } finally {
        setIsLoadingNFTs(false)
      }
    }

    fetchCollectionNFTs()
  }, [totalSupply, collectionAddress, listingsMap, collectionName, metadataCache])

  // Pagination
  const totalPages = Math.ceil(collectionNFTs.length / ITEMS_PER_PAGE)
  const paginatedNFTs = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return collectionNFTs.slice(start, end)
  }, [collectionNFTs, page])

  const handlePageChange = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    })
  }

  const handleNFTClick = (tokenId: string) => {
    navigate({
      to: '/nft/$contract/$tokenId',
      params: { contract: collectionAddress, tokenId },
    })
  }

  const isLoadingMetadata = isLoadingName || isLoadingSymbol || isLoadingMaxSupply || isLoadingTotalSupply
  const isLoading = isLoadingMetadata || isLoadingNFTs || isLoadingListings

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Collection Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {isLoadingName ? 'Loading...' : (collectionName as string) || 'Unknown Collection'}
            </h1>
            <p className="text-muted-foreground">
              {isLoadingSymbol ? '...' : (collectionSymbol as string) || 'N/A'}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Supply</p>
                <p className="text-2xl font-bold">
                  {isLoadingTotalSupply ? '...' : totalSupply?.toString() || '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Max Supply</p>
                <p className="text-2xl font-bold">
                  {isLoadingMaxSupply ? '...' : maxSupply?.toString() || '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Listed</p>
                <p className="text-2xl font-bold">{listingsMap.size}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contract</p>
                <p className="text-sm font-mono truncate">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && <NFTGridSkeleton count={ITEMS_PER_PAGE} />}

      {/* Empty State */}
      {!isLoading && collectionNFTs.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageOpen className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No NFTs in collection</EmptyTitle>
            <EmptyDescription>
              This collection doesn't have any NFTs yet
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* NFT Grid */}
      {!isLoading && collectionNFTs.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {paginatedNFTs.map((nft) => (
              <NFTCard
                key={`${collectionAddress}-${nft.tokenId}`}
                contractAddress={collectionAddress}
                tokenId={nft.tokenId}
                name={nft.metadata?.name || `NFT #${nft.tokenId}`}
                image={nft.metadata?.image || 'https://via.placeholder.com/400?text=NFT'}
                price={nft.isListed && nft.listingPrice ? formatEther(nft.listingPrice) : undefined}
                collectionName={collectionName as string}
                isListed={nft.isListed}
                onClick={() => handleNFTClick(nft.tokenId)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
