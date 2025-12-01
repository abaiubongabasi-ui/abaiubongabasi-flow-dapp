import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { decodeEventLog } from 'viem'
import { contracts } from '~/lib/contracts'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { useCreateCollection } from '~/hooks/use-collection-factory'
import { useBatchMintCollection } from '~/hooks/use-collection-contract'

export const Route = createFileRoute('/mint/collection')({
  component: MintCollectionPage,
})

interface CollectionFormValues {
  name: string
  symbol: string
  baseURI: string
  maxSupply: number
  royaltyPercentage: number
  initialMintQuantity: number
}

function MintCollectionPage() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const [hasNavigated, setHasNavigated] = useState(false)
  const [createdCollectionAddress, setCreatedCollectionAddress] = useState<`0x${string}` | null>(null)
  const [shouldBatchMint, setShouldBatchMint] = useState(false)

  const {
    createCollection,
    hash: createHash,
    isPending: isCreatePending,
    error: createError
  } = useCreateCollection()

  // Wait for collection creation transaction receipt
  const {
    data: createReceipt,
    isLoading: isCreateConfirming,
    isSuccess: isCreateSuccess
  } = useWaitForTransactionReceipt({
    hash: createHash,
  })

  const {
    batchMint,
    hash: batchMintHash,
    isPending: isBatchMintPending,
    isConfirming: isBatchMintConfirming,
    isSuccess: isBatchMintSuccess,
    error: batchMintError
  } = useBatchMintCollection(createdCollectionAddress || '0x0000000000000000000000000000000000000000')

  const form = useForm<CollectionFormValues>({
    defaultValues: {
      name: '',
      symbol: '',
      baseURI: '',
      maxSupply: 100,
      royaltyPercentage: 5,
      initialMintQuantity: 0,
    },
  })

  // Handle form submission
  async function onSubmit(values: CollectionFormValues) {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    // Validate collection name
    if (!values.name || values.name.length === 0) {
      toast.error('Collection name is required')
      return
    }
    if (values.name.length > 100) {
      toast.error('Collection name must be less than 100 characters')
      return
    }

    // Validate symbol
    if (!values.symbol || values.symbol.length < 3 || values.symbol.length > 5) {
      toast.error('Symbol must be between 3 and 5 characters')
      return
    }

    // Validate base URI
    if (!values.baseURI || values.baseURI.length === 0) {
      toast.error('Base URI is required')
      return
    }

    // Ensure base URI ends with a trailing slash
    if (!values.baseURI.endsWith('/')) {
      values.baseURI = values.baseURI + '/'
    }

    // Validate max supply
    if (values.maxSupply <= 0) {
      toast.error('Max supply must be greater than 0')
      return
    }
    if (values.maxSupply > 10000) {
      toast.error('Max supply cannot exceed 10,000')
      return
    }

    // Validate royalty percentage
    if (values.royaltyPercentage < 0 || values.royaltyPercentage > 10) {
      toast.error('Royalty must be between 0% and 10%')
      return
    }

    // Validate initial mint quantity
    if (values.initialMintQuantity < 0) {
      toast.error('Initial mint quantity cannot be negative')
      return
    }
    if (values.initialMintQuantity > values.maxSupply) {
      toast.error('Initial mint quantity cannot exceed max supply')
      return
    }

    try {
      toast.info('Preparing transaction...')

      // Convert royalty percentage to basis points (1% = 100 bps)
      const royaltyBps = Math.floor(values.royaltyPercentage * 100)

      // Store whether we need to batch mint after collection creation
      if (values.initialMintQuantity > 0) {
        setShouldBatchMint(true)
      }

      // Call createCollection function
      createCollection(
        values.name,
        values.symbol,
        values.baseURI,
        BigInt(values.maxSupply),
        royaltyBps
      )

    } catch (err) {
      console.error('Collection creation error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      toast.error(`Failed to create collection: ${errorMessage}`)
    }
  }

  // Extract collection address from transaction receipt
  useEffect(() => {
    if (isCreateSuccess && createReceipt && !createdCollectionAddress) {
      try {
        // Find the CollectionCreated event in the logs
        const collectionCreatedLog = createReceipt.logs.find((log) => {
          try {
            const decoded = decodeEventLog({
              abi: contracts.collectionFactory.abi,
              data: log.data,
              topics: log.topics,
            })
            return decoded.eventName === 'CollectionCreated'
          } catch {
            return false
          }
        })

        if (collectionCreatedLog) {
          const decoded = decodeEventLog({
            abi: contracts.collectionFactory.abi,
            data: collectionCreatedLog.data,
            topics: collectionCreatedLog.topics,
          })

          if (decoded.eventName === 'CollectionCreated' && decoded.args) {
            const args = decoded.args as unknown as { collectionAddress: `0x${string}`; creator: `0x${string}`; name: string; symbol: string; maxSupply: bigint }
            const collectionAddress = args.collectionAddress
            setCreatedCollectionAddress(collectionAddress)

            toast.success('Collection created successfully!', {
              description: `Address: ${collectionAddress.slice(0, 10)}...${collectionAddress.slice(-8)}`,
            })
          }
        }
      } catch (err) {
        console.error('Error extracting collection address:', err)
        toast.error('Collection created but failed to extract address')
      }
    }
  }, [isCreateSuccess, createReceipt, createdCollectionAddress])

  // Handle batch minting after collection creation
  if (createdCollectionAddress && shouldBatchMint && !isBatchMintPending && !isBatchMintConfirming && !isBatchMintSuccess && address) {
    const initialQuantity = form.getValues('initialMintQuantity')
    if (initialQuantity > 0) {
      toast.info('Batch minting NFTs...')
      batchMint(address, BigInt(initialQuantity))
      setShouldBatchMint(false)
    }
  }

  // Handle batch mint success
  if (isBatchMintSuccess && !hasNavigated) {
    toast.success('NFTs minted successfully!', {
      description: batchMintHash ? `Transaction: ${batchMintHash.slice(0, 10)}...${batchMintHash.slice(-8)}` : undefined,
    })

    setHasNavigated(true)

    // Navigate to collection detail page
    setTimeout(() => {
      if (createdCollectionAddress) {
        navigate({ to: '/collection/$address', params: { address: createdCollectionAddress } })
      }
    }, 2000)
  }

  // Handle collection creation success without batch minting
  if (isCreateSuccess && !shouldBatchMint && !hasNavigated && createdCollectionAddress) {
    setHasNavigated(true)

    // Navigate to collection detail page
    setTimeout(() => {
      navigate({ to: '/collection/$address', params: { address: createdCollectionAddress } })
    }, 2000)
  }

  // Handle errors
  if (createError && !isCreatePending && !isCreateConfirming) {
    const errorMessage = createError.message.includes('User rejected')
      ? 'Transaction was rejected'
      : createError.message.includes('insufficient funds')
        ? 'Insufficient funds for transaction'
        : `Transaction failed: ${createError.message}`

    toast.error(errorMessage)
  }

  if (batchMintError && !isBatchMintPending && !isBatchMintConfirming) {
    const errorMessage = batchMintError.message.includes('User rejected')
      ? 'Batch mint was rejected'
      : batchMintError.message.includes('insufficient funds')
        ? 'Insufficient funds for batch minting'
        : `Batch mint failed: ${batchMintError.message}`

    toast.error(errorMessage)
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to create NFT collections
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create NFT Collection</h1>
          <p className="text-muted-foreground">
            Launch a collection of related NFTs with batch minting capabilities
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Collection Details</CardTitle>
            <CardDescription>
              Fill in the details for your NFT collection. All fields are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collection Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My NFT Collection" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of your collection (max 100 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="MNFT"
                          maxLength={5}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormDescription>
                        A short symbol for your collection (3-5 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baseURI"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base URI</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ipfs://bafybeic.../"
                          {...field}
                          onBlur={(e) => {
                            // Automatically add trailing slash if missing
                            let value = e.target.value.trim()
                            if (value && !value.endsWith('/')) {
                              value = value + '/'
                              field.onChange(value)
                            }
                            field.onBlur()
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Base URI for metadata. Tokens will be at baseURI + tokenId + .json (e.g., ipfs://bafybeic.../ → ipfs://bafybeic.../1.json, 2.json, etc.)
                        <br />
                        <span className="text-amber-600 dark:text-amber-400">Note: Trailing slash will be added automatically</span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxSupply"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Supply</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10000"
                          placeholder="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of NFTs in this collection (1-10,000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="initialMintQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Mint Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of NFTs to mint immediately (optional, 0 to skip)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isCreatePending || isCreateConfirming || isBatchMintPending || isBatchMintConfirming}
                  disabled={isCreatePending || isCreateConfirming || isBatchMintPending || isBatchMintConfirming}
                >
                  {isCreatePending
                    ? 'Confirm in Wallet...'
                    : isCreateConfirming
                      ? 'Creating Collection...'
                      : isBatchMintPending
                        ? 'Confirm Batch Mint...'
                        : isBatchMintConfirming
                          ? 'Minting NFTs...'
                          : 'Create Collection'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {createdCollectionAddress && createdCollectionAddress !== '0x0000000000000000000000000000000000000000' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Collection Created!</CardTitle>
              <CardDescription>
                Your collection has been successfully deployed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Collection Address:</p>
                <code className="block p-3 bg-muted rounded-md text-sm break-all">
                  {createdCollectionAddress}
                </code>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate({ to: '/collection/$address', params: { address: createdCollectionAddress } })}
                >
                  View Collection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
