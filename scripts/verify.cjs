const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Verification script for deployed contracts
 * Reads deployment info and verifies contracts on block explorer
 */
async function main() {
  const networkName = hre.network.name;
  
  if (networkName === "hardhat" || networkName === "localhost") {
    console.log("Skipping verification for local network");
    return;
  }

  console.log("Verifying contracts on", networkName);
  console.log("==========================================\n");

  // Load deployment info
  const configFile = path.join(__dirname, "..", "deployments", `${networkName}.json`);
  
  if (!fs.existsSync(configFile)) {
    console.error(`Deployment file not found: ${configFile}`);
    console.error("Please deploy contracts first using: npx hardhat run scripts/deploy.js --network", networkName);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(configFile, "utf8"));
  const { contracts, deployer } = deploymentInfo;

  // ==========================================
  // Verify FlowNft Contract
  // ==========================================
  console.log("1. Verifying FlowNft contract...");
  try {
    await hre.run("verify:verify", {
      address: contracts.nft,
      constructorArguments: [
        "Flow NFT",
        "FNFT",
        10000,
        100,
        500,
        "https://api.flownft.example/metadata/",
        deployer,
        500
      ],
    });
    console.log("✓ FlowNft verified\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✓ FlowNft already verified\n");
    } else {
      console.error("✗ FlowNft verification failed:", error.message, "\n");
    }
  }

  // ==========================================
  // Verify CollectionFactory Contract
  // ==========================================
  console.log("2. Verifying CollectionFactory contract...");
  try {
    await hre.run("verify:verify", {
      address: contracts.collectionFactory,
      constructorArguments: [],
    });
    console.log("✓ CollectionFactory verified\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✓ CollectionFactory already verified\n");
    } else {
      console.error("✗ CollectionFactory verification failed:", error.message, "\n");
    }
  }

  // ==========================================
  // Verify Marketplace Contract
  // ==========================================
  console.log("3. Verifying Marketplace contract...");
  try {
    await hre.run("verify:verify", {
      address: contracts.marketplace,
      constructorArguments: [],
    });
    console.log("✓ Marketplace verified\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✓ Marketplace already verified\n");
    } else {
      console.error("✗ Marketplace verification failed:", error.message, "\n");
    }
  }

  console.log("==========================================");
  console.log("Verification Complete");
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
