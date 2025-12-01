import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'

interface ErrorPageProps {
  title?: string
  message?: string
  error?: Error | string
  onRetry?: () => void
  showHomeButton?: boolean
}

/**
 * Generic error page component
 * Can be used for various error scenarios
 */
export function ErrorPage({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  error,
  onRetry,
  showHomeButton = true,
}: ErrorPageProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {errorMessage && (
          <CardContent>
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {errorMessage}
              </p>
            </div>
          </CardContent>
        )}
        <CardFooter className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          )}
          {showHomeButton && (
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Go home
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Network error page
 */
export function NetworkErrorPage({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorPage
      title="Network error"
      message="Unable to connect to the network. Please check your connection and try again."
      onRetry={onRetry}
    />
  )
}

/**
 * Contract error page
 */
export function ContractErrorPage({ error, onRetry }: { error?: Error | string; onRetry?: () => void }) {
  return (
    <ErrorPage
      title="Contract error"
      message="There was an error interacting with the smart contract."
      error={error}
      onRetry={onRetry}
    />
  )
}

/**
 * Wallet error page
 */
export function WalletErrorPage({ error }: { error?: Error | string }) {
  return (
    <ErrorPage
      title="Wallet error"
      message="There was an error connecting to your wallet. Please try reconnecting."
      error={error}
      showHomeButton={true}
    />
  )
}
