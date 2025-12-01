import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import { Button } from '~/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { useMintNFT, useMintPrice, useTotalMinted } from '~/hooks/use-nft-contract'
import { formatEther } from 'viem'

export const Route = createFileRoute('/mint/')({
  component: MintPage,
})

interface MintFormValues {
  name: string
  description: string
  image: File | null
  royaltyPercentage: number
}

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string
  }>
}

import { uploadFileToIPFS, uploadMetadataToIPFS } from '~/lib/ipfs'
import { Alert, AlertDescription } from '~/components/ui/alert'

// Helper function to create and upload metadata to IPFS
async function createMetadata(
  name: string,
  description: string,
  imageUri: string,
  royaltyPercentage: number,
  tokenId: number
): Promise<string> {
  const metadata: NFTMetadata = {
    name,
    description,
    image: imageUri,
    attributes: [
      {
        trait_type: 'Royalty Percentage',
        value: royaltyPercentage.toString(),
      },
    ],
  }

  return uploadMetadataToIPFS(metadata, tokenId)
}

function MintPage() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const { data: mintPrice } = useMintPrice()
  const { data: totalMinted } = useTotalMinted()
  const { mint, hash, isPending, isConfirming, isSuccess, error } = useMintNFT()
  
  const mintPriceValue = mintPrice ? BigInt(mintPrice.toString()) : 0n
  const nextTokenId = totalMinted ? Number(totalMinted) + 1 : 1

  const form = useForm<MintFormValues>({
    defaultValues: {
      name: '',
      description: '',
      image: null,
      royaltyPercentage: 5,
    },
  })

  // Track if we've already navigated
  const [hasNavigated, setHasNavigated] = useState(false)

  // Handle image file selection
  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      form.setValue('image', file)
      form.clearErrors('image')
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle form submission
  async function onSubmit(values: MintFormValues) {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    // Validate form
    if (!values.name || values.name.length === 0) {
      toast.error('NFT name is required')
      return
    }
    if (values.name.length > 100) {
      toast.error('Name must be less than 100 characters')
      return
    }
    if (!values.description || values.description.length === 0) {
      toast.error('Description is required')
      return
    }
    if (values.description.length > 1000) {
      toast.error('Description must be less than 1000 characters')
      return
    }
    if (!values.image) {
      toast.error('Image is required')
      return
    }
    if (values.image.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(values.image.type)) {
      toast.error('Only JPEG, PNG, GIF, and WebP images are supported')
      return
    }
    if (values.royaltyPercentage < 0 || values.royaltyPercentage > 10) {
      toast.error('Royalty must be between 0% and 10%')
      return
    }

    try {
      setIsUploading(true)
      
      // Step 1: Upload image to IPFS with token ID
      toast.info('Uploading image to IPFS...')
      let imageUri: string
      try {
        imageUri = await uploadFileToIPFS(values.image, nextTokenId)
        toast.success('Image uploaded successfully')
      } catch (error) {
        toast.error('Failed to upload image to IPFS')
        console.error('Image upload error:', error)
        setIsUploading(false)
        return
      }
      
      // Step 2: Create and upload metadata JSON to IPFS
      toast.info('Uploading metadata to IPFS...')
      let metadataUri: string
      try {
        metadataUri = await createMetadata(
          values.name,
          values.description,
          imageUri,
          values.royaltyPercentage,
          nextTokenId
        )
        toast.success('Metadata uploaded successfully')
      } catch (error) {
        toast.error('Failed to upload metadata to IPFS')
        console.error('Metadata upload error:', error)
        setIsUploading(false)
        return
      }
      
      setIsUploading(false)
      
      // Step 3: Call mint function with tokenURI
      toast.info('Preparing transaction...')
      
      console.log('Metadata URI:', metadataUri)
      console.log('Image URI:', imageUri)
      
      // Calculate mint cost (single NFT)
      const totalCost = mintPriceValue
      
      if (totalCost === 0n) {
        toast.error('Unable to fetch mint price. Please try again.')
        return
      }
      
      // Mint NFT with IPFS metadata URI
      mint(metadataUri, totalCost)
      
    } catch (err) {
      setIsUploading(false)
      console.error('Minting error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      toast.error(`Failed to prepare NFT: ${errorMessage}`)
    }
  }

  // Reset form after successful mint
  if (isSuccess && !hasNavigated) {
    form.reset()
    setImagePreview(null)
  }

  // Handle transaction success
  if (isSuccess && !hasNavigated) {
    setHasNavigated(true)
    toast.success('NFT minted successfully!', {
      description: hash ? `Transaction: ${hash.slice(0, 10)}...${hash.slice(-8)}` : undefined,
    })
    
    // Navigate to My NFTs page after a short delay
    setTimeout(() => {
      navigate({ to: '/my-nfts' })
    }, 2000)
  }

  // Handle transaction error
  if (error && !isPending && !isConfirming) {
    const errorMessage = error.message.includes('User rejected')
      ? 'Transaction was rejected'
      : error.message.includes('insufficient funds')
      ? 'Insufficient funds for transaction'
      : `Transaction failed: ${error.message}`
    
    toast.error(errorMessage)
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to mint NFTs
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const isPinataConfigured = !!import.meta.env.VITE_PINATA_JWT

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mint Single NFT</h1>
          <p className="text-muted-foreground">
            Create your unique NFT with custom metadata and royalties
          </p>
        </div>

        {!isPinataConfigured && (
          <Alert className="mb-6">
            <AlertDescription>
              <p className="font-semibold mb-1">⚠️ IPFS Not Configured</p>
              <p className="text-sm">
                Pinata JWT is not configured. NFT metadata will use mock IPFS URIs and won't be retrievable.
                See <code className="text-xs bg-muted px-1 py-0.5 rounded">docs/IPFS_SETUP.md</code> for setup instructions.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>NFT Details</CardTitle>
            <CardDescription>
              Fill in the details for your NFT. All fields are required.
            </CardDescription>
            {mintPriceValue > 0n && (
              <p className="text-sm font-medium text-foreground mt-2">
                Mint Price: {formatEther(mintPriceValue)} FLOW
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NFT Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome NFT" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of your NFT (max 100 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your NFT..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A detailed description of your NFT (max 1000 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageChange}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload an image for your NFT (max 5MB, JPEG/PNG/GIF/WebP)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {imagePreview && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium mb-2">Image Preview</p>
                    <img
                      src={imagePreview}
                      alt="NFT preview"
                      className="max-w-full h-auto max-h-[300px] rounded-md object-contain"
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="royaltyPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Royalty Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          placeholder="5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Set royalty percentage for secondary sales (0-10%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isPending || isConfirming || isUploading}
                  disabled={isPending || isConfirming || isUploading}
                >
                  {isUploading
                    ? 'Uploading Metadata...'
                    : isPending
                    ? 'Confirm in Wallet...'
                    : isConfirming
                    ? 'Minting NFT...'
                    : 'Mint NFT'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
