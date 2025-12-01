const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Enable sale on the deployed NFT contract
 * This needs to be run after deployment to allow public minting
 */
async function main() {
  const network = process.argv[2] || hre.network.name;

  console.log("Enabling sale on", network);
  console.log("==========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Load deployment info
  const deploymentFile = path.join(
    __dirname,
    "..",
    "deployments",
    `${network}.json`
  );

  if (!fs.existsSync(deploymentFile)) {
    console.error(`Deployment file not found: ${deploymentFile}`);
    console.error("Please deploy contracts first");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const nftAddress = deploymentInfo.contracts.nft;

  console.log("NFT Contract:", nftAddress);
  console.log("");

  // Get contract instance
  const FlowNFT = await hre.ethers.getContractFactory("FlowNFT");
  const nftContract = FlowNFT.attach(nftAddress);

  // Check current sale status
  const saleActive = await nftContract.saleActive();
  console.log("Current sale status:", saleActive ? "ACTIVE" : "INACTIVE");

  if (saleActive) {
    console.log("✓ Sale is already active!");
    return;
  }

  // Toggle sale
  console.log("\nToggling sale...");
  const tx = await nftContract.toggleSale();
  console.log("Transaction hash:", tx.hash);

  await tx.wait();
  console.log("✓ Transaction confirmed");

  // Verify sale is now active
  const newSaleStatus = await nftContract.saleActive();
  console.log("\nNew sale status:", newSaleStatus ? "ACTIVE" : "INACTIVE");

  if (newSaleStatus) {
    console.log("\n✓ Sale successfully enabled!");
    console.log("\nUsers can now mint NFTs from the dApp");
  } else {
    console.log("\n✗ Failed to enable sale");
  }

  console.log("\n==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
