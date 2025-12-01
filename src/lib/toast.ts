import { toast as sonnerToast } from 'sonner'

/**
 * Toast notification helper functions
 * Provides consistent toast notifications throughout the application
 */

interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Display a success toast notification
 */
export function toastSuccess(message: string, options?: ToastOptions) {
  return sonnerToast.success(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  })
}

/**
 * Display an error toast notification
 */
export function toastError(message: string, options?: ToastOptions) {
  return sonnerToast.error(message, {
    description: options?.description,
    duration: options?.duration || 5000,
    action: options?.action,
  })
}

/**
 * Display an info toast notification
 */
export function toastInfo(message: string, options?: ToastOptions) {
  return sonnerToast.info(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  })
}

/**
 * Display a warning toast notification
 */
export function toastWarning(message: string, options?: ToastOptions) {
  return sonnerToast.warning(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  })
}

/**
 * Display a loading toast notification
 * Returns a toast ID that can be used to dismiss or update the toast
 */
export function toastLoading(message: string, options?: Omit<ToastOptions, 'action'>) {
  return sonnerToast.loading(message, {
    description: options?.description,
    duration: options?.duration || Infinity,
  })
}

/**
 * Display a promise toast that shows loading, success, and error states
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: Error) => string)
  }
) {
  return sonnerToast.promise(promise, messages)
}

/**
 * Dismiss a specific toast by ID
 */
export function toastDismiss(toastId?: string | number) {
  return sonnerToast.dismiss(toastId)
}

/**
 * Transaction-specific toast helpers
 */

export function toastTransactionPending(txHash?: string) {
  return toastLoading('Transaction pending...', {
    description: txHash ? `Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}` : undefined,
  })
}

export function toastTransactionSuccess(message: string, txHash?: string) {
  return toastSuccess(message, {
    description: txHash ? `Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}` : undefined,
  })
}

export function toastTransactionError(error: Error | string) {
  const message = typeof error === 'string' ? error : error.message
  return toastError('Transaction failed', {
    description: message,
  })
}

/**
 * Wallet-specific toast helpers
 */

export function toastWalletConnected(address: string) {
  return toastSuccess('Wallet connected', {
    description: `${address.slice(0, 6)}...${address.slice(-4)}`,
  })
}

export function toastWalletDisconnected() {
  return toastInfo('Wallet disconnected')
}

export function toastWalletError(error: Error | string) {
  const message = typeof error === 'string' ? error : error.message
  return toastError('Wallet error', {
    description: message,
  })
}

/**
 * NFT-specific toast helpers
 */

export function toastNFTMinted(tokenId: string) {
  return toastSuccess('NFT minted successfully!', {
    description: `Token ID: ${tokenId}`,
  })
}

export function toastNFTListed(tokenId: string, price: string) {
  return toastSuccess('NFT listed for sale', {
    description: `Token ID: ${tokenId} • Price: ${price}`,
  })
}

export function toastNFTPurchased(tokenId: string) {
  return toastSuccess('NFT purchased successfully!', {
    description: `Token ID: ${tokenId}`,
  })
}

export function toastListingCancelled(tokenId: string) {
  return toastSuccess('Listing cancelled', {
    description: `Token ID: ${tokenId}`,
  })
}
