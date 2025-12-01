import { useState, useCallback } from "react";
import { parseTransactionError, ErrorType } from "~/lib/error-handler";
import {
  toastError,
  toastSuccess,
  toastTransactionPending,
  toastDismiss,
} from "~/lib/toast";

interface TransactionState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
}

interface TransactionHandlerOptions {
  onSuccess?: (data?: unknown) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  pendingMessage?: string;
}

/**
 * Custom hook for handling transactions with proper error handling and user feedback
 */
export function useTransactionHandler() {
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
  });

  const handleTransaction = useCallback(
    async <T>(
      transactionFn: () => Promise<T>,
      options: TransactionHandlerOptions = {}
    ): Promise<T | null> => {
      const {
        onSuccess,
        onError,
        successMessage = "Transaction successful",
        errorMessage,
      } = options;

      setState({
        isLoading: true,
        isSuccess: false,
        isError: false,
        error: null,
      });

      let toastId: string | number | undefined;

      try {
        // Show pending toast
        toastId = toastTransactionPending();

        // Execute transaction
        const result = await transactionFn();

        // Dismiss pending toast
        if (toastId) {
          toastDismiss(toastId);
        }

        // Update state
        setState({
          isLoading: false,
          isSuccess: true,
          isError: false,
          error: null,
        });

        // Show success toast
        toastSuccess(successMessage);

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        // Dismiss pending toast
        if (toastId) {
          toastDismiss(toastId);
        }

        // Parse error
        const parsedError = parseTransactionError(error);
        const errorObj = parsedError.originalError;

        // Update state
        setState({
          isLoading: false,
          isSuccess: false,
          isError: true,
          error: errorObj,
        });

        // Show error toast (skip for user rejection)
        if (parsedError.type !== ErrorType.USER_REJECTED) {
          toastError(errorMessage || parsedError.message, {
            description: parsedError.details,
          });
        }

        // Call error callback
        if (onError) {
          onError(errorObj);
        }

        // Log error
        console.error("Transaction error:", parsedError);

        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    handleTransaction,
    reset,
  };
}

/**
 * Hook for handling write transactions with retry capability
 */
export function useWriteTransactionHandler() {
  const { handleTransaction, ...state } = useTransactionHandler();
  const [retryFn, setRetryFn] = useState<(() => Promise<unknown>) | null>(null);
  const [retryOptions, setRetryOptions] = useState<TransactionHandlerOptions>(
    {}
  );

  const handleWriteTransaction = useCallback(
    async <T>(
      transactionFn: () => Promise<T>,
      options: TransactionHandlerOptions = {}
    ): Promise<T | null> => {
      // Store retry function and options
      setRetryFn(() => transactionFn);
      setRetryOptions(options);

      return handleTransaction(transactionFn, options);
    },
    [handleTransaction]
  );

  const retry = useCallback(async () => {
    if (retryFn) {
      return handleTransaction(retryFn, {
        ...retryOptions,
        successMessage: retryOptions.successMessage || "Transaction successful",
      });
    }
    return null;
  }, [retryFn, retryOptions, handleTransaction]);

  const clearRetry = useCallback(() => {
    setRetryFn(null);
    setRetryOptions({});
  }, []);

  return {
    ...state,
    handleWriteTransaction,
    retry,
    clearRetry,
    canRetry: !!retryFn && state.isError,
  };
}
