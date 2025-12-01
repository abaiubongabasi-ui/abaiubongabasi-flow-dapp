import { useEffect, useCallback } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseTransactionError, isUserRejection, isRetryableError } from '~/lib/error-handler'
import { toastError, toastSuccess, toastLoading, toastDismiss } from '~/lib/toast'

interface UseContractWriteWithErrorHandlingOptions {
  onSuccess?: (data: `0x${string}`) => void
  onError?: (error: Error) => void
  successMessage?: string
  pendingMessage?: string
}

/**
 * Enhanced hook for contract writes with comprehensive error handling
 * Wraps Wagmi's useWriteContract with automatic error parsing and user feedback
 */
export function useContractWriteWithErrorHandling(
  options: UseContractWriteWithErrorHandlingOptions = {}
) {
  const {
    onSuccess,
    onError,
    successMessage = 'Transaction successful',
    pendingMessage = 'Transaction pending...',
  } = options

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Track toast ID for dismissal
  let toastId: string | number | undefined

  // Handle write errors
  useEffect(() => {
    if (writeError && !isPending) {
      const parsedError = parseTransactionError(writeError)
      
      // Don't show toast for user rejection
      if (!isUserRejection(writeError)) {
        toastError(parsedError.message, {
          description: parsedError.details,
          action: isRetryableError(writeError)
            ? {
                label: 'Retry',
                onClick: () => {
                  reset()
                },
              }
            : undefined,
        })
      }

      if (onError) {
        onError(parsedError.originalError)
      }

      console.error('Transaction error:', parsedError)
    }
  }, [writeError, isPending, onError, reset])

  // Handle receipt errors
  useEffect(() => {
    if (receiptError) {
      const parsedError = parseTransactionError(receiptError)
      
      toastError('Transaction failed', {
        description: parsedError.details,
      })

      if (onError) {
        onError(parsedError.originalError)
      }

      console.error('Receipt error:', parsedError)
    }
  }, [receiptError, onError])

  // Show pending toast when confirming
  useEffect(() => {
    if (isConfirming && hash) {
      toastId = toastLoading(pendingMessage, {
        description: `Transaction: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
      })
    }

    return () => {
      if (toastId) {
        toastDismiss(toastId)
      }
    }
  }, [isConfirming, hash, pendingMessage])

  // Handle success
  useEffect(() => {
    if (isSuccess && hash) {
      if (toastId) {
        toastDismiss(toastId)
      }

      toastSuccess(successMessage, {
        description: `Transaction: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
      })

      if (onSuccess) {
        onSuccess(hash)
      }
    }
  }, [isSuccess, hash, successMessage, onSuccess])

  const write = useCallback(
    (args: Parameters<typeof writeContract>[0]) => {
      writeContract(args)
    },
    [writeContract]
  )

  return {
    write,
    writeContract,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    reset,
  }
}
