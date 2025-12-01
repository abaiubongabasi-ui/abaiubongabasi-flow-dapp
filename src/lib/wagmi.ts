import { createConfig, http } from 'wagmi';
import { flowTestnet, flowMainnet } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Flow EVM chain configurations
const flowTestnetChain = {
  ...flowTestnet,
  id: 545,
  name: 'Flow EVM Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_FLOW_TESTNET_RPC_URL || 'https://testnet.evm.nodes.onflow.org'],
    },
    public: {
      http: ['https://testnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Flow Testnet Explorer',
      url: 'https://evm-testnet.flowscan.io',
    },
  },
};

const flowMainnetChain = {
  ...flowMainnet,
  id: 747,
  name: 'Flow EVM Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_FLOW_MAINNET_RPC_URL || 'https://mainnet.evm.nodes.onflow.org'],
    },
    public: {
      http: ['https://mainnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Flow Mainnet Explorer',
      url: 'https://evm.flowscan.io',
    },
  },
};

export const wagmiConfig = createConfig({
  chains: [flowTestnetChain, flowMainnetChain],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
      showQrModal: true,
    }),
    coinbaseWallet({
      appName: 'Flow NFT dApp',
    }),
  ],
  transports: {
    [flowTestnetChain.id]: http(),
    [flowMainnetChain.id]: http(),
  },
});

// Export chains for use in other parts of the app
export const chains = [flowTestnetChain, flowMainnetChain] as const;
export type Chain = typeof chains[number];
