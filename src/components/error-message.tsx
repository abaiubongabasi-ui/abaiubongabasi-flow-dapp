import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Button } from './ui/button'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ title = 'Error', message, onRetry }: ErrorMessageProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

interface ErrorPageProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorPage({ title = 'Something went wrong', message, onRetry }: ErrorPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full">
        <ErrorMessage title={title} message={message} onRetry={onRetry} />
      </div>
    </div>
  )
}
