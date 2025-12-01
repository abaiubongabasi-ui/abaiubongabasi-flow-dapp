import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Badge } from './ui/badge'

interface NFTCardProps {
  contractAddress: string
  tokenId: string
  name: string
  image: string
  price?: string
  collectionName?: string
  isListed?: boolean
  onClick?: () => void
}

export function NFTCard({
  contractAddress,
  tokenId,
  name,
  image,
  price,
  collectionName,
  isListed = false,
  onClick,
}: NFTCardProps) {
  const content = (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/20">
      <CardHeader className="p-0">
        <div className="aspect-square relative overflow-hidden bg-muted">
          <img
            src={image}
            alt={name}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'https://via.placeholder.com/400?text=NFT'
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          {isListed && (
            <Badge className="absolute top-2 right-2 transition-transform duration-300 group-hover:scale-110" variant="secondary">
              Listed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">{name}</h3>
        {collectionName && (
          <p className="text-sm text-muted-foreground truncate">
            {collectionName}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Token ID: {tokenId}
        </p>
      </CardContent>
      {price && (
        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">Price</span>
            <span className="font-semibold group-hover:text-primary transition-colors">{price} FLOW</span>
          </div>
        </CardFooter>
      )}
    </Card>
  )

  if (onClick) {
    return <div onClick={onClick}>{content}</div>
  }

  return (
    <Link to="/nft/$contract/$tokenId" params={{ contract: contractAddress, tokenId }}>
      {content}
    </Link>
  )
}
