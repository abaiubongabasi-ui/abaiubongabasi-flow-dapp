const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Set mint price on the deployed NFT contract
 * Default: 0.001 FLOW (reasonable for testnet)
 */
async function main() {
  const network = process.argv[2] || hre.network.name;
  const newPrice = process.argv[3] || "0.001"; // Default to 0.001 FLOW
  
  console.log("Setting mint price on", network);
  console.log("==========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network}.json`);
  
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

  // Check current mint price
  const currentPrice = await nftContract.mintPrice();
  console.log("Current mint price:", hre.ethers.formatEther(currentPrice), "FLOW");

  // Convert new price to wei
  const newPriceWei = hre.ethers.parseEther(newPrice);
  console.log("New mint price:", newPrice, "FLOW");
  console.log("");

  if (currentPrice === newPriceWei) {
    console.log("✓ Mint price is already set to", newPrice, "FLOW");
    return;
  }

  // Set new mint price
  console.log("Setting new mint price...");
  const tx = await nftContract.setMintPrice(newPriceWei);
  console.log("Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("✓ Transaction confirmed");

  // Verify new price
  const updatedPrice = await nftContract.mintPrice();
  console.log("\nUpdated mint price:", hre.ethers.formatEther(updatedPrice), "FLOW");

  if (updatedPrice === newPriceWei) {
    console.log("\n✓ Mint price successfully updated!");
  } else {
    console.log("\n✗ Failed to update mint price");
  }

  console.log("\n==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
