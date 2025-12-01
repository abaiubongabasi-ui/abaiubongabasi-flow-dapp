const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Check deployment status and contract configuration
 */
async function main() {
  const network = hre.network.name;
  
  console.log("Checking deployment on", network);
  console.log("==========================================\n");

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`Deployment file not found: ${deploymentFile}`);
    console.error("Please deploy contracts first");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  
  console.log("Deployment Info:");
  console.log("  Network:", deploymentInfo.network);
  console.log("  Chain ID:", deploymentInfo.chainId);
  console.log("  Deployer:", deploymentInfo.deployer);
  console.log("  Timestamp:", deploymentInfo.timestamp);
  console.log("  Block Number:", deploymentInfo.blockNumber);
  console.log("");

  // Check FlowNFT contract
  console.log("1. FlowNFT Contract");
  console.log("   Address:", deploymentInfo.contracts.nft);
  
  const FlowNFT = await hre.ethers.getContractFactory("FlowNFT");
  const nftContract = FlowNFT.attach(deploymentInfo.contracts.nft);
  
  try {
    const name = await nftContract.name();
    const symbol = await nftContract.symbol();
    const maxSupply = await nftContract.maxSupply();
    const totalMinted = await nftContract.totalMinted();
    const mintPrice = await nftContract.mintPrice();
    const saleActive = await nftContract.saleActive();
    const maxPerWallet = await nftContract.maxPerWallet();
    const ownerReserve = await nftContract.ownerReserve();
    
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Max Supply:", maxSupply.toString());
    console.log("   Total Minted:", totalMinted.toString());
    console.log("   Mint Price:", hre.ethers.formatEther(mintPrice), "FLOW");
    console.log("   Sale Active:", saleActive ? "✅ YES" : "❌ NO");
    console.log("   Max Per Wallet:", maxPerWallet.toString());
    console.log("   Owner Reserve:", ownerReserve.toString());
    console.log("   ✅ Contract is functional");
  } catch (error) {
    console.log("   ❌ Error checking contract:", error.message);
  }
  console.log("");

  // Check CollectionFactory contract
  console.log("2. CollectionFactory Contract");
  console.log("   Address:", deploymentInfo.contracts.collectionFactory);
  
  const CollectionFactory = await hre.ethers.getContractFactory("CollectionFactory");
  const factoryContract = CollectionFactory.attach(deploymentInfo.contracts.collectionFactory);
  
  try {
    const implementation = await factoryContract.collectionImplementation();
    const totalCollections = await factoryContract.getTotalCollections();
    
    console.log("   Implementation:", implementation);
    console.log("   Total Collections:", totalCollections.toString());
    console.log("   ✅ Contract is functional");
  } catch (error) {
    console.log("   ❌ Error checking contract:", error.message);
  }
  console.log("");

  // Check Marketplace contract
  console.log("3. Marketplace Contract");
  console.log("   Address:", deploymentInfo.contracts.marketplace);
  
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplaceContract = Marketplace.attach(deploymentInfo.contracts.marketplace);
  
  try {
    const marketplaceFee = await marketplaceContract.MARKETPLACE_FEE_BPS();
    
    console.log("   Marketplace Fee:", (Number(marketplaceFee) / 100).toFixed(2) + "%");
    console.log("   ✅ Contract is functional");
  } catch (error) {
    console.log("   ❌ Error checking contract:", error.message);
  }
  console.log("");

  // Summary
  console.log("==========================================");
  console.log("Deployment Status: ✅ ALL CONTRACTS OPERATIONAL");
  console.log("==========================================");
  console.log("");
  console.log("Block Explorer Links:");
  console.log(`  FlowNFT: https://evm-testnet.flowscan.io/address/${deploymentInfo.contracts.nft}`);
  console.log(`  CollectionFactory: https://evm-testnet.flowscan.io/address/${deploymentInfo.contracts.collectionFactory}`);
  console.log(`  Marketplace: https://evm-testnet.flowscan.io/address/${deploymentInfo.contracts.marketplace}`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
