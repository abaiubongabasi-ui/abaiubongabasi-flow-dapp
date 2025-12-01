# Flow NFT dApp

A full-stack decentralized application for minting, listing, buying, and selling NFTs on the Flow blockchain using Flow EVM.

## 🎯 Features

- **NFT Minting**: Create individual NFTs with custom metadata and royalties (0-10%)
- **Collection Creation**: Launch NFT collections with batch minting capabilities (up to 10,000 tokens)
- **Marketplace**: List NFTs for sale, browse listings, and purchase digital assets
- **Royalty System**: Automatic royalty distribution to creators on secondary sales
- **Portfolio Management**: View and manage owned NFTs with real-time updates
- **IPFS Storage**: Decentralized metadata and image storage via Pinata
- **Responsive Design**: Mobile-first UI with accessibility support (WCAG 2.1 Level AA)

## 🛠 Tech Stack

### Smart Contracts

- **Language**: Solidity 0.8.20
- **Framework**: Hardhat with TypeScript
- **Libraries**: OpenZeppelin (ERC-721, ERC-2981, Ownable, ReentrancyGuard)
- **Standards**: ERC-721, ERC-2981 (royalties), EIP-1167 (minimal proxy pattern)
- **Network**: Flow EVM (testnet: Chain ID 545, mainnet: Chain ID 747)

### Frontend

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router v1 (file-based routing)
- **Blockchain Integration**: Wagmi v2, Viem
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest, React Testing Library

## 📁 Project Structure

```
/
├── contracts/              # Solidity smart contracts
│   ├── NFT.sol            # ERC-721 NFT contract with royalties
│   ├── Collection.sol     # Collection contract template
│   ├── CollectionFactory.sol  # Factory for deploying collections
│   └── Marketplace.sol    # Marketplace with listing/buying logic
│
├── scripts/               # Deployment and utility scripts
│   ├── deploy.js         # Main deployment script
│   ├── verify.js         # Contract verification script
│   ├── generate-config.js # Generate frontend config from deployments
│   └── check-balance.js  # Check wallet balance
│
├── test/                  # Smart contract tests
│
├── src/                   # Frontend application
│   ├── routes/           # TanStack Router file-based routes
│   │   ├── index.tsx     # Home/landing page
│   │   ├── mint.tsx      # Mint single NFT
│   │   ├── mint/
│   │   │   └── collection.tsx  # Mint collection
│   │   ├── marketplace.tsx     # Browse listings
│   │   ├── my-nfts.tsx        # User's owned NFTs
│   │   ├── collection/
│   │   │   └── $address.tsx   # Collection detail
│   │   └── nft/
│   │       └── $contract.$tokenId.tsx  # NFT detail
│   │
│   ├── components/       # React components
│   │   ├── ui/          # Shadcn UI components
│   │   ├── wallet-connect.tsx
│   │   ├── nft-card.tsx
│   │   └── ...
│   │
│   ├── hooks/           # Custom React hooks
│   │   ├── use-nft-contract.ts
│   │   ├── use-marketplace-contract.ts
│   │   └── ...
│   │
│   ├── lib/             # Utilities and helpers
│   │   ├── wagmi.ts    # Wagmi configuration
│   │   └── contracts.ts # Contract addresses and ABIs
│   │
│   └── types/           # TypeScript type definitions
│
├── deployments/          # Deployment artifacts
│   └── contracts.json   # Deployed contract addresses (generated)
│
├── .env.example         # Environment variables template
├── .env.testnet.example # Testnet-specific configuration
├── .env.mainnet.example # Mainnet-specific configuration
├── hardhat.config.cjs   # Hardhat configuration
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: Package manager (install with `npm install -g pnpm`)
- **Wallet**: MetaMask or compatible wallet with Flow testnet tokens
- **Flow Testnet Tokens**: Get from [Flow Faucet](https://testnet-faucet.onflow.org/)

### Installation

1. **Clone the repository**:

```bash
git clone <repository-url>
cd flow-nft-dapp
```

2. **Install dependencies**:

```bash
pnpm install
```

3. **Set up environment variables**:

For testnet development:

```bash
pnpm run setup:testnet
# or manually: cp .env.testnet.example .env
```

For mainnet deployment:

```bash
pnpm run setup:mainnet
# or manually: cp .env.mainnet.example .env
```

4. **Configure your `.env` file**:

```bash
# Required: Deployment wallet private key
PRIVATE_KEY=your_private_key_here

# Required: WalletConnect project ID (get from cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Required: Pinata JWT for IPFS uploads (get from app.pinata.cloud)
VITE_PINATA_JWT=your_pinata_jwt_here
```

> ⚠️ **Security Warning**: Never commit your `.env` file or share your private key!

## 🔧 Development

### IPFS Setup (Pinata)

This dApp uses Pinata for IPFS storage of NFT metadata and images.

1. **Sign up for Pinata**:

   - Visit [app.pinata.cloud](https://app.pinata.cloud) and create a free account

2. **Create API Key**:

   - Navigate to API Keys → New Key
   - Enable permissions: `pinFileToIPFS` and `pinJSONToIPFS`
   - Generate key and copy the JWT token

3. **Add to environment**:

```bash
VITE_PINATA_JWT=your_jwt_token_here
```

4. **Restart dev server**:

```bash
pnpm dev
```

Without Pinata configured, the app will show a warning and use mock IPFS URIs (for UI testing only).

### Smart Contract Development

#### Compile Contracts

```bash
pnpm compile
```

#### Run Tests

```bash
pnpm hardhat:test
```

#### Check Deployment Wallet Balance

```bash
# Testnet
pnpm check-balance:testnet

# Mainnet
pnpm check-balance:mainnet
```

#### Deploy Contracts

**To Flow EVM Testnet**:

```bash
pnpm deploy:testnet
```

**To Flow EVM Mainnet**:

```bash
pnpm deploy:mainnet
```

After deployment:

- Contract addresses are saved to `deployments/contracts.json`
- Frontend configuration is automatically generated
- Update your `.env` file with the deployed contract addresses

#### Verify Contracts on Block Explorer

**Testnet**:

```bash
pnpm verify:testnet
```

**Mainnet**:

```bash
pnpm verify:mainnet
```

#### Utility Scripts

**Enable/Disable NFT Sale**:

```bash
pnpm run enable-sale:testnet   # Enable public minting
pnpm run enable-sale:mainnet
```

**Set Mint Price**:

```bash
pnpm run set-mint-price:testnet   # Default: 0.001 FLOW
pnpm run set-mint-price:mainnet
```

### NFT Metadata Structure

For detailed information about NFT metadata structure, token URI generation, and IPFS upload workflows, see the **[Documentation](docs/README.md)**.

**Quick Overview**:

- Single NFTs use individual metadata URIs stored on IPFS
- Collections use a base URI with automatic token ID and `.json` appending
- Token IDs start from 1 for both single NFTs and collections
- The contract automatically generates URIs as: `baseURI + tokenId + ".json"`
- Frontend converts IPFS URIs to HTTP gateway URLs for fetching

**Example Collection Setup**:

```bash
# Base URI: ipfs://bafybeic.../
# Token 1 URI: ipfs://bafybeic.../1.json
# Token 2 URI: ipfs://bafybeic.../2.json
```

**Documentation**:
- [Quick Reference](docs/METADATA_SUMMARY.md) - Fast answers
- [Complete Guide](docs/METADATA.md) - Full documentation
- [Display Guide](docs/METADATA_DISPLAY.md) - Frontend implementation
- [Flow Diagrams](docs/METADATA_FLOW_DIAGRAM.md) - Visual guides

### Frontend Development

#### Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

#### Build for Production

```bash
pnpm build
```

#### Preview Production Build

```bash
pnpm preview
```

#### Type Checking

```bash
pnpm type-check
```

#### Run Frontend Tests

```bash
# Run once
pnpm test

# Watch mode
pnpm test:watch
```

## 🌐 Deployment

### Smart Contract Deployment

1. **Prepare your deployment wallet**:

   - Create a new wallet for deployment (recommended)
   - Fund it with Flow tokens for gas fees
   - Add the private key to `.env`

2. **Deploy to testnet first**:

```bash
pnpm deploy:testnet
```

3. **Test thoroughly on testnet**:

   - Mint NFTs
   - Create collections
   - List and buy NFTs
   - Verify all functionality

4. **Deploy to mainnet**:

```bash
# Switch to mainnet configuration
pnpm run setup:mainnet
# Edit .env with mainnet values
pnpm deploy:mainnet
```

5. **Verify contracts**:

```bash
pnpm verify:mainnet
```

### Frontend Deployment

#### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:

```bash
pnpm add -g vercel
```

2. **Deploy**:

```bash
pnpm build
vercel --prod
```

3. **Configure environment variables** in Vercel dashboard:
   - Add all `VITE_*` variables from your `.env`
   - Include `VITE_PINATA_JWT` for IPFS uploads
   - Set `VITE_CHAIN_ID` and `VITE_NETWORK_NAME` for your target network

### Option 2: Netlify

1. **Install Netlify CLI**:

```bash
pnpm add -g netlify-cli
```

2. **Deploy**:

```bash
pnpm build
netlify deploy --prod --dir=dist
```

3. **Configure environment variables** in Netlify dashboard

### Option 3: Static Hosting (IPFS, AWS S3, etc.)

1. **Build the application**:

```bash
pnpm build
```

2. **Upload the `dist` folder** to your hosting provider

## ⚙️ Configuration

### Environment Variables

#### Required Variables

| Variable                            | Description                   | Example                                                             |
| ----------------------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `PRIVATE_KEY`                       | Deployment wallet private key | `0x123...`                                                          |
| `VITE_WALLETCONNECT_PROJECT_ID`     | WalletConnect project ID      | Get from [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `VITE_PINATA_JWT`                   | Pinata JWT for IPFS uploads   | Get from [app.pinata.cloud](https://app.pinata.cloud)               |
| `VITE_NFT_CONTRACT_ADDRESS`         | Deployed NFT contract address | Auto-populated after deployment                                     |
| `VITE_COLLECTION_FACTORY_ADDRESS`   | Deployed factory address      | Auto-populated after deployment                                     |
| `VITE_MARKETPLACE_CONTRACT_ADDRESS` | Deployed marketplace address  | Auto-populated after deployment                                     |

#### Network Configuration

**Testnet** (default):

```bash
VITE_CHAIN_ID=545
VITE_NETWORK_NAME=flow-testnet
VITE_FLOW_TESTNET_RPC_URL=https://testnet.evm.nodes.onflow.org
```

**Mainnet**:

```bash
VITE_CHAIN_ID=747
VITE_NETWORK_NAME=flow-mainnet
VITE_FLOW_MAINNET_RPC_URL=https://mainnet.evm.nodes.onflow.org
```

### Flow EVM Networks

| Network | Chain ID | RPC URL                              | Block Explorer                  |
| ------- | -------- | ------------------------------------ | ------------------------------- |
| Testnet | 545      | https://testnet.evm.nodes.onflow.org | https://evm-testnet.flowscan.io |
| Mainnet | 747      | https://mainnet.evm.nodes.onflow.org | https://evm.flowscan.io         |

## 📝 Development Workflow

### Complete Development Cycle

1. **Smart Contract Development**:

```bash
# Develop contracts in /contracts
# Write tests in /test
pnpm compile
pnpm hardhat:test
```

2. **Deploy to Testnet**:

```bash
pnpm deploy:testnet
# Contract addresses saved to deployments/contracts.json
```

3. **Update Frontend Configuration**:

```bash
# Automatically done by deploy script
# Or manually update .env with contract addresses
```

4. **Frontend Development**:

```bash
pnpm dev
# Develop features, test with testnet contracts
```

5. **Build and Test**:

```bash
pnpm build
pnpm preview
# Test production build locally
```

6. **Deploy to Production**:

```bash
# Deploy contracts to mainnet
pnpm deploy:mainnet

# Update .env with mainnet addresses
# Build and deploy frontend
pnpm build
vercel --prod
```

## 🧪 Testing

### Smart Contract Tests

```bash
# Run all contract tests
pnpm hardhat:test

# Run specific test file
npx hardhat test test/NFT.test.ts
```

### Frontend Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch
```

## 🔒 Security Considerations

### Smart Contracts

- All contracts use OpenZeppelin libraries for security
- ReentrancyGuard on marketplace functions
- Access control with Ownable pattern
- Input validation on all public functions
- Royalty percentage capped at 10%

### Frontend

- Never expose private keys
- All transactions require user approval
- Input sanitization and validation
- HTTPS only in production
- Secure wallet connection via Wagmi

### Best Practices

- Use separate wallets for deployment and testing
- Test thoroughly on testnet before mainnet deployment
- Verify contracts on block explorer
- Keep dependencies updated
- Regular security audits for production

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Insufficient funds for gas"

- **Solution**: Ensure your wallet has enough Flow tokens. Get testnet tokens from the [Flow Faucet](https://testnet-faucet.onflow.org/)

**Issue**: "Contract deployment failed"

- **Solution**: Check your private key is correct and wallet has sufficient balance

**Issue**: "Cannot connect wallet"

- **Solution**: Ensure you have a WalletConnect project ID in your `.env` file

**Issue**: "IPFS upload failed"

- **Solution**: Check your Pinata JWT is set correctly in `.env`. Get a free API key from [app.pinata.cloud](https://app.pinata.cloud)

**Issue**: "Sale is OFF" error when minting

- **Solution**: Run `pnpm run enable-sale:testnet` to enable public minting

**Issue**: "Wrong ETH amount" error

- **Solution**: Run `pnpm run set-mint-price:testnet` to set a reasonable mint price (default: 0.001 FLOW)

**Issue**: "Transaction reverted"

- **Solution**: Check contract addresses are correct in `.env` and contracts are deployed

**Issue**: "Build fails with TypeScript errors"

- **Solution**: Run `pnpm type-check` to see detailed errors, ensure all dependencies are installed

## 📚 Additional Resources

- [Flow EVM Documentation](https://developers.flow.com/evm/about)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Wagmi Documentation](https://wagmi.sh/)
- [TanStack Router Documentation](https://tanstack.com/router)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Flow blockchain team for Flow EVM
- OpenZeppelin for secure smart contract libraries
- Shadcn for the beautiful UI component library
- TanStack team for Router and Query libraries

---

**Need Help?** Open an issue or reach out to the community!
