import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { formatEther } from 'viem'
import { useGetAllActiveListings } from '../hooks/use-marketplace-contract'
import { NFTCard } from '../components/nft-card'
import { NFTGridSkeleton } from '../components/loading-skeleton'
import { PaginationControls } from '../components/pagination-controls'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '../components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { PackageOpen, Search } from 'lucide-react'
import { abis } from '../lib/contracts'

interface MarketplaceSearchParams {
  page?: number
  sort?: string
  collection?: string
  search?: string
}

export const Route = createFileRoute('/marketplace')({
  component: MarketplacePage,
  validateSearch: (search: Record<string, unknown>): MarketplaceSearchParams => {
    return {
      page: Number(search?.page) || 1,
      sort: (search?.sort as string) || 'recent',
      collection: (search?.collection as string) || 'all',
      search: (search?.search as string) || '',
    }
  },
})

interface Listing {
  seller: string
  nftContract: string
  tokenId: bigint
  price: bigint
  active: boolean
  listedAt: bigint
}

interface NFTMetadata {
  name: string
  description: string
  image: string
}

interface EnrichedListing extends Listing {
  metadata?: NFTMetadata
  collectionName?: string
}

const ITEMS_PER_PAGE = 20

// Helper function to fetch metadata from URI
async function fetchMetadataFromURI(uri: string): Promise<NFTMetadata | null> {
  try {
    // Handle IPFS URIs
    let fetchUrl = uri
    if (uri.startsWith('ipfs://')) {
      // Use a public IPFS gateway
      fetchUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    
    const response = await fetch(fetchUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`)
    }
    
    const metadata = await response.json()
    
    // Handle IPFS image URIs
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

function MarketplacePage() {
  const navigate = useNavigate({ from: '/marketplace' })
  const { page = 1, sort = 'recent', collection = 'all', search = '' } = Route.useSearch()
  
  const [enrichedListings, setEnrichedListings] = useState<EnrichedListing[]>([])
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [metadataCache] = useState<Map<string, NFTMetadata>>(new Map())
  
  // Calculate offset for pagination
  const offset = BigInt((page - 1) * ITEMS_PER_PAGE)
  const limit = BigInt(ITEMS_PER_PAGE)
  
  // Fetch listings
  const { data: listingsData, isLoading: isLoadingListings } = useGetAllActiveListings(offset, limit)

  // Extract unique collection addresses for filter dropdown
  const uniqueCollections = useMemo(() => {
    if (!enrichedListings.length) return []
    const collections = new Set<string>()
    enrichedListings.forEach(listing => {
      if (listing.nftContract) {
        collections.add(listing.nftContract)
      }
    })
    return Array.from(collections)
  }, [enrichedListings])

  // Fetch metadata for listings
  useEffect(() => {
    async function fetchMetadata() {
      if (!listingsData || !Array.isArray(listingsData)) return
      
      setIsLoadingMetadata(true)
      const listings = listingsData as unknown as Listing[]
      
      const enriched = await Promise.all(
        listings.map(async (listing) => {
          const cacheKey = `${listing.nftContract}-${listing.tokenId.toString()}`
          
          // Check cache first
          if (metadataCache.has(cacheKey)) {
            return {
              ...listing,
              metadata: metadataCache.get(cacheKey),
            }
          }

          try {
            // Fetch tokenURI and collection name using viem's readContract
            const { createPublicClient, http } = await import('viem')
            const { flowTestnet } = await import('viem/chains')
            
            const client = createPublicClient({
              chain: flowTestnet,
              transport: http(),
            })

            // Fetch tokenURI
            const tokenURI = await client.readContract({
              address: listing.nftContract as `0x${string}`,
              abi: abis.nft,
              functionName: 'tokenURI',
              args: [listing.tokenId],
            }) as string

            // Fetch collection name
            let collectionName = ''
            try {
              collectionName = await client.readContract({
                address: listing.nftContract as `0x${string}`,
                abi: abis.nft,
                functionName: 'name',
              }) as string
            } catch {
              // If name() fails, use truncated address
              collectionName = `${listing.nftContract.slice(0, 6)}...${listing.nftContract.slice(-4)}`
            }

            // Fetch metadata from the tokenURI
            let metadata: NFTMetadata | null = null
            if (tokenURI) {
              metadata = await fetchMetadataFromURI(tokenURI)
            }

            // Use fetched metadata or fallback to placeholder
            const finalMetadata: NFTMetadata = metadata || {
              name: `NFT #${listing.tokenId.toString()}`,
              description: `NFT from ${collectionName}`,
              image: `https://via.placeholder.com/400?text=NFT+${listing.tokenId.toString()}`,
            }
            
            // Cache the metadata
            metadataCache.set(cacheKey, finalMetadata)
            
            return {
              ...listing,
              metadata: finalMetadata,
              collectionName,
            }
          } catch (error) {
            console.error('Error fetching metadata for', listing.nftContract, listing.tokenId.toString(), error)
            // Return listing with placeholder metadata
            const fallbackMetadata: NFTMetadata = {
              name: `NFT #${listing.tokenId.toString()}`,
              description: '',
              image: 'https://via.placeholder.com/400?text=NFT',
            }
            
            // Cache the fallback metadata to avoid repeated failures
            metadataCache.set(cacheKey, fallbackMetadata)
            
            return {
              ...listing,
              metadata: fallbackMetadata,
              collectionName: `${listing.nftContract.slice(0, 6)}...${listing.nftContract.slice(-4)}`,
            }
          }
        })
      )
      
      setEnrichedListings(enriched)
      setIsLoadingMetadata(false)
    }

    fetchMetadata()
  }, [listingsData, metadataCache])

  // Filter and sort listings
  const filteredAndSortedListings = useMemo(() => {
    let filtered = [...enrichedListings]

    // Filter by collection
    if (collection !== 'all') {
      filtered = filtered.filter(listing => listing.nftContract === collection)
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(listing => {
        const nameMatch = listing.metadata?.name?.toLowerCase().includes(searchLower)
        const tokenIdMatch = listing.tokenId.toString().includes(searchLower)
        return nameMatch || tokenIdMatch
      })
    }

    // Sort listings
    switch (sort) {
      case 'price-low':
        filtered.sort((a, b) => Number(a.price - b.price))
        break
      case 'price-high':
        filtered.sort((a, b) => Number(b.price - a.price))
        break
      case 'recent':
      default:
        filtered.sort((a, b) => Number(b.listedAt - a.listedAt))
        break
    }

    return filtered
  }, [enrichedListings, collection, search, sort])

  // Calculate total pages based on filtered results
  const totalPages = Math.ceil(filteredAndSortedListings.length / ITEMS_PER_PAGE)
  
  // Paginate filtered results
  const paginatedListings = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return filteredAndSortedListings.slice(start, end)
  }, [filteredAndSortedListings, page])

  const handlePageChange = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    })
  }

  const handleSortChange = (newSort: string) => {
    navigate({
      search: (prev) => ({ ...prev, sort: newSort, page: 1 }),
    })
  }

  const handleCollectionChange = (newCollection: string) => {
    navigate({
      search: (prev) => ({ ...prev, collection: newCollection, page: 1 }),
    })
  }

  const handleSearchChange = (newSearch: string) => {
    navigate({
      search: (prev) => ({ ...prev, search: newSearch, page: 1 }),
    })
  }

  const handleNFTClick = (contractAddress: string, tokenId: string) => {
    navigate({
      to: '/nft/$contract/$tokenId',
      params: { contract: contractAddress, tokenId },
    })
  }

  const isLoading = isLoadingListings || isLoadingMetadata

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">NFT Marketplace</h1>
        <p className="text-muted-foreground">
          Browse and purchase listed NFTs
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or token ID..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={collection} onValueChange={handleCollectionChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Collections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {uniqueCollections.map((addr) => (
              <SelectItem key={addr} value={addr}>
                {addr.slice(0, 6)}...{addr.slice(-4)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Listed</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && <NFTGridSkeleton count={ITEMS_PER_PAGE} />}

      {/* Empty State */}
      {!isLoading && paginatedListings.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageOpen className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No NFTs found</EmptyTitle>
            <EmptyDescription>
              {search || collection !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'There are no NFTs listed for sale at the moment'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* NFT Grid */}
      {!isLoading && paginatedListings.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {paginatedListings.map((listing) => (
              <NFTCard
                key={`${listing.nftContract}-${listing.tokenId.toString()}`}
                contractAddress={listing.nftContract}
                tokenId={listing.tokenId.toString()}
                name={listing.metadata?.name || `NFT #${listing.tokenId.toString()}`}
                image={listing.metadata?.image || 'https://via.placeholder.com/400?text=NFT'}
                price={formatEther(listing.price)}
                collectionName={listing.collectionName}
                isListed={true}
                onClick={() => handleNFTClick(listing.nftContract, listing.tokenId.toString())}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  )
}
