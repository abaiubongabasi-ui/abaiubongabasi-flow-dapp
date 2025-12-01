import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from 'viem'

/**
 * Error types for better error handling
 */
export enum ErrorType {
  USER_REJECTED = 'USER_REJECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
  CONTRACT_REVERT = 'CONTRACT_REVERT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  WALLET_ERROR = 'WALLET_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface ParsedError {
  type: ErrorType
  message: string
  originalError: Error
  details?: string
  retryable: boolean
}

/**
 * Parse contract revert errors to extract meaningful messages
 */
function parseContractError(error: ContractFunctionRevertedError): string {
  const revertReason = error.data?.errorName || error.shortMessage

  // Map common contract errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'NotTokenOwner': 'You do not own this NFT',
    'InvalidRoyaltyPercentage': 'Royalty percentage must be between 0% and 10%',
    'InsufficientPayment': 'Insufficient payment for this transaction',
    'ListingNotActive': 'This listing is no longer active',
    'MaxSupplyExceeded': 'Maximum supply has been reached',
    'UnauthorizedAccess': 'You are not authorized to perform this action',
    'ERC721InsufficientApproval': 'NFT approval required. Please approve the marketplace contract first',
    'ERC721NonexistentToken': 'This NFT does not exist',
  }

  if (revertReason && errorMap[revertReason]) {
    return errorMap[revertReason]
  }

  return revertReason || 'Transaction reverted by contract'
}

/**
 * Parse transaction errors and return user-friendly messages
 */
export function parseTransactionError(error: unknown): ParsedError {
  // Handle user rejection
  if (error instanceof UserRejectedRequestError) {
    return {
      type: ErrorType.USER_REJECTED,
      message: 'Transaction cancelled',
      originalError: error,
      details: 'You rejected the transaction in your wallet',
      retryable: true,
    }
  }

  // Handle contract revert errors
  if (error instanceof ContractFunctionRevertedError) {
    const message = parseContractError(error)
    return {
      type: ErrorType.CONTRACT_REVERT,
      message,
      originalError: error,
      details: error.shortMessage,
      retryable: false,
    }
  }

  // Handle base errors from viem
  if (error instanceof BaseError) {
    const errorMessage = error.shortMessage || error.message

    // Check for insufficient funds
    if (errorMessage.includes('insufficient funds') || errorMessage.includes('exceeds balance')) {
      return {
        type: ErrorType.INSUFFICIENT_FUNDS,
        message: 'Insufficient funds',
        originalError: error,
        details: 'You do not have enough funds to complete this transaction',
        retryable: false,
      }
    }

    // Check for gas errors
    if (errorMessage.includes('gas') || errorMessage.includes('intrinsic')) {
      return {
        type: ErrorType.INSUFFICIENT_GAS,
        message: 'Insufficient gas',
        originalError: error,
        details: 'Not enough gas to execute this transaction',
        retryable: true,
      }
    }

    // Check for network errors
    if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error',
        originalError: error,
        details: 'Unable to connect to the network. Please check your connection and try again',
        retryable: true,
      }
    }

    return {
      type: ErrorType.UNKNOWN,
      message: 'Transaction failed',
      originalError: error,
      details: errorMessage,
      retryable: true,
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const errorMessage = error.message

    // Check for wallet errors
    if (errorMessage.includes('wallet') || errorMessage.includes('MetaMask')) {
      return {
        type: ErrorType.WALLET_ERROR,
        message: 'Wallet error',
        originalError: error,
        details: errorMessage,
        retryable: true,
      }
    }

    return {
      type: ErrorType.UNKNOWN,
      message: 'An error occurred',
      originalError: error,
      details: errorMessage,
      retryable: true,
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: ErrorType.UNKNOWN,
      message: 'An error occurred',
      originalError: new Error(error),
      details: error,
      retryable: true,
    }
  }

  // Unknown error type
  return {
    type: ErrorType.UNKNOWN,
    message: 'An unexpected error occurred',
    originalError: new Error('Unknown error'),
    details: 'Please try again',
    retryable: true,
  }
}

/**
 * Get user-friendly error message for display
 */
export function getErrorMessage(error: unknown): string {
  const parsed = parseTransactionError(error)
  return parsed.message
}

/**
 * Get detailed error message for display
 */
export function getErrorDetails(error: unknown): string | undefined {
  const parsed = parseTransactionError(error)
  return parsed.details
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const parsed = parseTransactionError(error)
  return parsed.retryable
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): string {
  const parsed = parseTransactionError(error)
  return `[${parsed.type}] ${parsed.message}${parsed.details ? ` - ${parsed.details}` : ''}`
}

/**
 * Estimate gas error message with cost
 */
export function getGasErrorMessage(estimatedGas?: bigint, gasPrice?: bigint): string {
  if (estimatedGas && gasPrice) {
    const estimatedCost = (estimatedGas * gasPrice) / BigInt(1e18)
    return `Insufficient funds for gas. Estimated cost: ${estimatedCost.toString()} FLOW`
  }
  return 'Insufficient funds for gas'
}

/**
 * Format gas cost for display
 */
export function formatGasCost(gas: bigint, gasPrice: bigint): string {
  const cost = (gas * gasPrice) / BigInt(1e18)
  const costNumber = Number(cost) / 1e18
  return costNumber.toFixed(6)
}

/**
 * Check if error is a user rejection
 */
export function isUserRejection(error: unknown): boolean {
  const parsed = parseTransactionError(error)
  return parsed.type === ErrorType.USER_REJECTED
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const parsed = parseTransactionError(error)
  return parsed.type === ErrorType.NETWORK_ERROR
}

/**
 * Check if error is insufficient funds
 */
export function isInsufficientFunds(error: unknown): boolean {
  const parsed = parseTransactionError(error)
  return parsed.type === ErrorType.INSUFFICIENT_FUNDS || parsed.type === ErrorType.INSUFFICIENT_GAS
}
