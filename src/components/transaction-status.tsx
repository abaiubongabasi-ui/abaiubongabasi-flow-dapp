import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '~/lib/utils'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'

interface TransactionStatusProps {
  status: 'idle' | 'pending' | 'confirming' | 'success' | 'error'
  txHash?: string
  error?: string
  className?: string
}

export function TransactionStatus({
  status,
  txHash,
  error,
  className,
}: TransactionStatusProps) {
  if (status === 'idle') return null

  return (
    <Alert
      className={cn(
        'transition-all duration-300',
        status === 'success' && 'border-green-500 bg-green-50 dark:bg-green-950',
        status === 'error' && 'border-red-500 bg-red-50 dark:bg-red-950',
        (status === 'pending' || status === 'confirming') &&
          'border-blue-500 bg-blue-50 dark:bg-blue-950',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {status === 'pending' && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
        )}
        {status === 'confirming' && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
        )}
        {status === 'success' && (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        )}
        {status === 'error' && (
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        )}

        <div className="flex-1">
          <AlertTitle className="mb-1">
            {status === 'pending' && 'Confirm in Wallet'}
            {status === 'confirming' && 'Transaction Confirming'}
            {status === 'success' && 'Transaction Successful'}
            {status === 'error' && 'Transaction Failed'}
          </AlertTitle>
          <AlertDescription>
            {status === 'pending' &&
              'Please confirm the transaction in your wallet'}
            {status === 'confirming' &&
              'Your transaction is being confirmed on the blockchain'}
            {status === 'success' && 'Your transaction has been confirmed'}
            {status === 'error' && (error || 'An error occurred')}
            {txHash && (
              <div className="mt-2 text-xs font-mono break-all">
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}

interface InlineTransactionStatusProps {
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error?: Error | null
  pendingText?: string
  confirmingText?: string
  successText?: string
}

export function InlineTransactionStatus({
  isPending,
  isConfirming,
  isSuccess,
  error,
  pendingText = 'Confirm in wallet...',
  confirmingText = 'Confirming...',
  successText = 'Success!',
}: InlineTransactionStatusProps) {
  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{pendingText}</span>
      </div>
    )
  }

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{confirmingText}</span>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        <span>{successText}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="h-4 w-4" />
        <span>{error.message}</span>
      </div>
    )
  }

  return null
}
