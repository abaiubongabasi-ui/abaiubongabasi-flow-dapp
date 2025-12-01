import { CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'

interface SuccessMessageProps {
  title?: string
  message: string
}

export function SuccessMessage({ title = 'Success', message }: SuccessMessageProps) {
  return (
    <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertTitle className="text-green-800 dark:text-green-200">{title}</AlertTitle>
      <AlertDescription className="text-green-700 dark:text-green-300">
        {message}
      </AlertDescription>
    </Alert>
  )
}
