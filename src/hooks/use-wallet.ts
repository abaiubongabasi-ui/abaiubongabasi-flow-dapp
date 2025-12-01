import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { toast } from "sonner";

interface WalletState {
  isConnecting: boolean;
  error: Error | null;
}

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();

  const [state, setState] = useState<WalletState>({
    isConnecting: false,
    error: null,
  });

  // Handle connection errors - reset connecting state
  useEffect(() => {
    if (connectError) {
      const errorMessage = getErrorMessage(connectError);
      toast.error("Connection Failed", {
        description: errorMessage,
      });
      setState({ isConnecting: false, error: connectError });
    }
  }, [connectError]);

  // Reset connecting state when successfully connected
  useEffect(() => {
    if (isConnected && state.isConnecting) {
      setState({ isConnecting: false, error: null });
    }
  }, [isConnected, state.isConnecting]);

  const handleConnect = async (connectorId?: string) => {
    // Set a timeout to reset connecting state if it takes too long
    const timeoutId = setTimeout(() => {
      setState((prev) => ({ ...prev, isConnecting: false }));
    }, 30000); // 30 second timeout

    try {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      const connector = connectorId
        ? connectors.find((c) => c.id === connectorId)
        : connectors[0];

      if (!connector) {
        clearTimeout(timeoutId);
        setState((prev) => ({ ...prev, isConnecting: false }));
        throw new Error("No connector available");
      }

      const result = await connectAsync({ connector });

      clearTimeout(timeoutId);

      if (result) {
        toast.success("Wallet Connected", {
          description: "Your wallet has been successfully connected",
        });
      }

      setState((prev) => ({ ...prev, isConnecting: false }));
    } catch (error) {
      clearTimeout(timeoutId);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error as Error,
      }));

      // Only show error toast if it's not a user rejection
      const errorMessage = getErrorMessage(error as Error);
      if (!errorMessage.includes("rejected")) {
        toast.error("Connection Failed", {
          description: errorMessage,
        });
      }
    }
  };

  const handleDisconnect = () => {
    try {
      disconnect();
      setState({ isConnecting: false, error: null });
      toast.success("Wallet Disconnected", {
        description: "Your wallet has been disconnected",
      });
    } catch (error) {
      toast.error("Disconnection Failed", {
        description: "Failed to disconnect wallet",
      });
    }
  };

  const resetConnecting = () => {
    setState((prev) => ({ ...prev, isConnecting: false }));
  };

  return {
    address,
    isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    connect: handleConnect,
    disconnect: handleDisconnect,
    resetConnecting,
    connectors,
  };
}

function getErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes("user rejected") || message.includes("user denied")) {
    return "Connection request was rejected";
  }

  if (message.includes("already pending")) {
    return "A connection request is already pending";
  }

  if (message.includes("no provider")) {
    return "No wallet provider found. Please install a wallet extension.";
  }

  if (message.includes("chain")) {
    return "Network error. Please check your wallet network settings.";
  }

  return "Failed to connect wallet. Please try again.";
}
