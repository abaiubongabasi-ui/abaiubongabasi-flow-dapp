const fs = require("fs");
const path = require("path");

/**
 * Generate frontend configuration from deployment files
 * Creates a contracts.json file with addresses and ABIs for the frontend
 */
async function main() {
  const network = process.argv[2] || "flow-testnet";
  
  console.log("Generating frontend config for", network);
  console.log("==========================================\n");

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`Deployment file not found: ${deploymentFile}`);
    console.error("Please deploy contracts first using: npx hardhat run scripts/deploy.js --network", network);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  // Load contract ABIs
  const nftArtifact = require("../artifacts/contracts/NFT.sol/FlowNFT.json");
  const collectionArtifact = require("../artifacts/contracts/Collection.sol/Collection.json");
  const factoryArtifact = require("../artifacts/contracts/CollectionFactory.sol/CollectionFactory.json");
  const marketplaceArtifact = require("../artifacts/contracts/Marketplace.sol/Marketplace.json");

  // Create frontend config
  const frontendConfig = {
    network: network,
    chainId: deploymentInfo.chainId,
    contracts: {
      nft: {
        address: deploymentInfo.contracts.nft,
        abi: nftArtifact.abi,
      },
      collectionFactory: {
        address: deploymentInfo.contracts.collectionFactory,
        abi: factoryArtifact.abi,
      },
      collection: {
        // Implementation address for reference
        implementation: deploymentInfo.contracts.collectionImplementation,
        abi: collectionArtifact.abi,
      },
      marketplace: {
        address: deploymentInfo.contracts.marketplace,
        abi: marketplaceArtifact.abi,
      },
    },
    deployedAt: deploymentInfo.timestamp,
    deployer: deploymentInfo.deployer,
  };

  // Save to src/lib directory
  const outputDir = path.join(__dirname, "..", "src", "lib");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `contracts-${network}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(frontendConfig, null, 2));

  console.log("✓ Frontend config generated:", outputFile);
  console.log("");
  console.log("Contract Addresses:");
  console.log("  NFT:", deploymentInfo.contracts.nft);
  console.log("  CollectionFactory:", deploymentInfo.contracts.collectionFactory);
  console.log("  Marketplace:", deploymentInfo.contracts.marketplace);
  console.log("");
  console.log("==========================================");
  console.log("Configuration Complete");
  console.log("==========================================");
  console.log("");
  console.log("Update your .env file with these addresses:");
  console.log(`VITE_NFT_CONTRACT_ADDRESS=${deploymentInfo.contracts.nft}`);
  console.log(`VITE_COLLECTION_FACTORY_ADDRESS=${deploymentInfo.contracts.collectionFactory}`);
  console.log(`VITE_MARKETPLACE_CONTRACT_ADDRESS=${deploymentInfo.contracts.marketplace}`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
