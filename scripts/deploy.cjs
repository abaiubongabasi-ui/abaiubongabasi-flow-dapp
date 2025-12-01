const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deployment script for Flow NFT dApp contracts
 * Deploys contracts in the correct order and saves addresses to config
 */
async function main() {
  console.log("Starting deployment to", hre.network.name);
  console.log("==========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "FLOW\n");

  const deployedContracts = {};

  // ==========================================
  // 1. Deploy NFT Contract (FlowNFT)
  // ==========================================
  console.log("1. Deploying FlowNFT contract...");
  
  const FlowNFT = await hre.ethers.getContractFactory("FlowNFT");
  const nftContract = await FlowNFT.deploy(
    "Flow NFT", // name
    "FNFT", // symbol
    10000, // maxSupply
    100, // maxPerWallet
    500, // ownerReserve
    deployer.address, // royaltyReceiver
    500 // royaltyFee (5% = 500 basis points)
  );

  await nftContract.waitForDeployment();
  const nftAddress = await nftContract.getAddress();
  
  console.log("✓ FlowNFT deployed to:", nftAddress);
  deployedContracts.nft = nftAddress;
  console.log("");

  // ==========================================
  // 2. Deploy Collection Factory
  // ==========================================
  console.log("2. Deploying CollectionFactory contract...");
  
  const CollectionFactory = await hre.ethers.getContractFactory("CollectionFactory");
  const factoryContract = await CollectionFactory.deploy();

  await factoryContract.waitForDeployment();
  const factoryAddress = await factoryContract.getAddress();
  
  console.log("✓ CollectionFactory deployed to:", factoryAddress);
  deployedContracts.collectionFactory = factoryAddress;
  
  // Get the implementation address
  const implementationAddress = await factoryContract.collectionImplementation();
  console.log("  Collection implementation:", implementationAddress);
  deployedContracts.collectionImplementation = implementationAddress;
  console.log("");

  // ==========================================
  // 3. Deploy Marketplace Contract
  // ==========================================
  console.log("3. Deploying Marketplace contract...");
  
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplaceContract = await Marketplace.deploy();

  await marketplaceContract.waitForDeployment();
  const marketplaceAddress = await marketplaceContract.getAddress();
  
  console.log("✓ Marketplace deployed to:", marketplaceAddress);
  deployedContracts.marketplace = marketplaceAddress;
  console.log("");

  // ==========================================
  // Save deployment info
  // ==========================================
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployedContracts,
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  // Save to network-specific file
  const configDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configFile = path.join(configDir, `${hre.network.name}.json`);
  fs.writeFileSync(configFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("==========================================");
  console.log("Deployment Summary");
  console.log("==========================================");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);
  console.log("Deployer:", deployer.address);
  console.log("");
  console.log("Deployed Contracts:");
  console.log("  FlowNFT:", nftAddress);
  console.log("  CollectionFactory:", factoryAddress);
  console.log("  Collection Implementation:", implementationAddress);
  console.log("  Marketplace:", marketplaceAddress);
  console.log("");
  console.log("✓ Deployment info saved to:", configFile);
  console.log("");

  // ==========================================
  // Verification instructions
  // ==========================================
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("==========================================");
    console.log("Contract Verification");
    console.log("==========================================");
    console.log("To verify contracts on block explorer, run:");
    console.log("");
    console.log(`npx hardhat verify --network ${hre.network.name} ${nftAddress} "Flow NFT" "FNFT" 10000 100 500 ${deployer.address} 500`);
    console.log("");
    console.log(`npx hardhat verify --network ${hre.network.name} ${factoryAddress}`);
    console.log("");
    console.log(`npx hardhat verify --network ${hre.network.name} ${marketplaceAddress}`);
    console.log("");
  }

  return deploymentInfo;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
