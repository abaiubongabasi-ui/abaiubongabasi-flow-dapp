import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { formatEther } from 'viem'
import { Sparkles, Palette, ShoppingBag, TrendingUp, ArrowRight } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { NFTCard } from '~/components/nft-card'
import { NFTGridSkeleton } from '~/components/loading-skeleton'
import { useGetAllActiveListings } from '~/hooks/use-marketplace-contract'
import { abis } from '~/lib/contracts'

export const Route = createFileRoute('/')({
  component: HomePage,
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

function HomePage() {
  const navigate = useNavigate()
  const [enrichedListings, setEnrichedListings] = useState<EnrichedListing[]>([])
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [metadataCache] = useState<Map<string, NFTMetadata>>(new Map())
  
  // Fetch recent listings (limit to 8 for featured section)
  const { data: listingsData, isLoading: isLoadingListings } = useGetAllActiveListings(0n, 8n)

  // Fetch metadata for listings
  useEffect(() => {
    async function fetchMetadata() {
      if (!listingsData || !Array.isArray(listingsData)) return
      
      setIsLoadingMetadata(true)
      const listings = listingsData as unknown as Listing[]
      
      const enriched = await Promise.all(
        listings.map(async (listing) => {
          const cacheKey = `${listing.nftContract}-${listing.tokenId.toString()}`
          
          if (metadataCache.has(cacheKey)) {
            return {
              ...listing,
              metadata: metadataCache.get(cacheKey),
            }
          }

          try {
            const { createPublicClient, http } = await import('viem')
            const { flowTestnet } = await import('viem/chains')
            
            const client = createPublicClient({
              chain: flowTestnet,
              transport: http(),
            })

            const tokenURI = await client.readContract({
              address: listing.nftContract as `0x${string}`,
              abi: abis.nft,
              functionName: 'tokenURI',
              args: [listing.tokenId],
            }) as string

            let collectionName = ''
            try {
              collectionName = await client.readContract({
                address: listing.nftContract as `0x${string}`,
                abi: abis.nft,
                functionName: 'name',
              }) as string
            } catch {
              collectionName = `${listing.nftContract.slice(0, 6)}...${listing.nftContract.slice(-4)}`
            }

            let metadata: NFTMetadata | null = null
            if (tokenURI) {
              metadata = await fetchMetadataFromURI(tokenURI)
            }

            const finalMetadata: NFTMetadata = metadata || {
              name: `NFT #${listing.tokenId.toString()}`,
              description: `NFT from ${collectionName}`,
              image: `https://via.placeholder.com/400?text=NFT+${listing.tokenId.toString()}`,
            }
            
            metadataCache.set(cacheKey, finalMetadata)
            
            return {
              ...listing,
              metadata: finalMetadata,
              collectionName,
            }
          } catch (error) {
            console.error('Error fetching metadata for', listing.nftContract, listing.tokenId.toString(), error)
            const fallbackMetadata: NFTMetadata = {
              name: `NFT #${listing.tokenId.toString()}`,
              description: '',
              image: 'https://via.placeholder.com/400?text=NFT',
            }
            
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

  const handleNFTClick = (contractAddress: string, tokenId: string) => {
    navigate({
      to: '/nft/$contract/$tokenId',
      params: { contract: contractAddress, tokenId },
    })
  }

  const isLoading = isLoadingListings || isLoadingMetadata

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      {/* Hero Section */}
      <div className="text-center mb-16 md:mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          <span>Built on Flow EVM</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Create, Trade & Collect NFTs
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto">
          Mint unique digital assets, launch collections, and trade on the marketplace with built-in royalties
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/mint">
            <Button size="lg" className="w-full sm:w-auto">
              <Palette className="mr-2 h-5 w-5" />
              Mint NFT
            </Button>
          </Link>
          <Link to="/marketplace">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Browse Marketplace
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 md:mb-20">
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Mint NFTs</CardTitle>
            <CardDescription>
              Create unique digital assets with custom metadata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Mint individual NFTs or launch entire collections with batch minting capabilities.
            </p>
            <Link to="/mint">
              <Button variant="ghost" size="sm" className="group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Trade on Marketplace</CardTitle>
            <CardDescription>
              List and purchase NFTs with ease
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Secure escrow system with automatic payment distribution and 2.5% marketplace fee.
            </p>
            <Link to="/marketplace">
              <Button variant="ghost" size="sm" className="group">
                Explore
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Earn Royalties</CardTitle>
            <CardDescription>
              Set royalties up to 10% on your creations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Automatic royalty distribution on every secondary sale using ERC-2981 standard.
            </p>
            <Link to="/mint/collection">
              <Button variant="ghost" size="sm" className="group">
                Create Collection
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Featured NFTs Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Featured NFTs</h2>
            <p className="text-muted-foreground">
              Discover recently listed NFTs on the marketplace
            </p>
          </div>
          <Link to="/marketplace" className="hidden sm:block">
            <Button variant="outline" className="group">
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && <NFTGridSkeleton count={8} />}

        {/* Empty State */}
        {!isLoading && enrichedListings.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No NFTs Listed Yet</p>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Be the first to mint and list NFTs on the marketplace
              </p>
              <Link to="/mint">
                <Button>
                  <Palette className="mr-2 h-4 w-4" />
                  Mint Your First NFT
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* NFT Grid */}
        {!isLoading && enrichedListings.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
              {enrichedListings.map((listing) => (
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
            
            {/* Mobile View All Button */}
            <div className="flex justify-center sm:hidden">
              <Link to="/marketplace">
                <Button variant="outline" className="group">
                  View All Listings
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
