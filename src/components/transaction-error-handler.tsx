import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { parseTransactionError, isRetryableError } from '~/lib/error-handler'

interface TransactionErrorHandlerProps {
  error: Error | null
  onRetry?: () => void
  onDismiss?: () => void
}

/**
 * Component for displaying transaction errors with retry option
 * Provides user-friendly error messages and retry functionality for retryable errors
 */
export function TransactionErrorHandler({
  error,
  onRetry,
  onDismiss,
}: TransactionErrorHandlerProps) {
  if (!error) {
    return null
  }

  const parsedError = parseTransactionError(error)
  const canRetry = isRetryableError(error) && onRetry

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{parsedError.message}</AlertTitle>
      {parsedError.details && (
        <AlertDescription className="mt-2">{parsedError.details}</AlertDescription>
      )}
      {(canRetry || onDismiss) && (
        <div className="mt-4 flex gap-2">
          {canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      )}
    </Alert>
  )
}
