import { useState } from 'react'
import { useAccount, useBalance, useSwitchChain } from 'wagmi'
import { Wallet, ChevronDown, LogOut, Copy, Check, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { chains } from '../lib/wagmi'
import { useWallet } from '../hooks/use-wallet'

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount()
  const { data: balance } = useBalance({ address })
  const { switchChain } = useSwitchChain()
  const { connect, disconnect, connectors, isConnecting, resetConnecting } = useWallet()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  const handleConnect = async (connectorId: string) => {
    try {
      await connect(connectorId)
      setIsDialogOpen(false)
    } catch (error) {
      // Error is already handled in the hook
      // Just close the dialog
      setIsDialogOpen(false)
    }
  }

  // Reset connecting state when dialog is closed
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    // If dialog is closed while connecting, reset the state
    if (!open && isConnecting) {
      resetConnecting()
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {/* Network Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              {chain?.name || 'Unknown Network'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Switch Network</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {chains.map((availableChain) => (
              <DropdownMenuItem
                key={availableChain.id}
                onClick={() => switchChain({ chainId: availableChain.id })}
                disabled={chain?.id === availableChain.id}
              >
                {availableChain.name}
                {chain?.id === availableChain.id && ' (Current)'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Wallet className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{truncateAddress(address)}</span>
              <span className="sm:hidden">{address.slice(0, 6)}</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{truncateAddress(address)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={copyAddress}
                  >
                    {copiedAddress ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              {balance && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span className="text-sm font-medium">
                    {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                  </span>
                </div>
              )}
              {chain && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Network</span>
                  <span className="text-sm font-medium">{chain.name}</span>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={disconnect} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          onClick={() => {
            // Reset connecting state when opening dialog
            if (isConnecting) {
              resetConnecting()
            }
          }}
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to the Flow NFT dApp
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              variant="outline"
              onClick={() => handleConnect(connector.id)}
              disabled={isConnecting}
              className="justify-start h-auto py-4"
            >
              <Wallet className="mr-3 h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{connector.name}</span>
                <span className="text-xs text-muted-foreground">
                  {connector.type === 'injected' && 'Browser Extension'}
                  {connector.type === 'walletConnect' && 'Scan with WalletConnect'}
                  {connector.type === 'coinbaseWallet' && 'Coinbase Wallet'}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
