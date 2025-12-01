const hre = require("hardhat");

/**
 * Check deployer account balance
 * Useful for verifying you have enough funds before deployment
 */
async function main() {
  console.log("Checking account balance on", hre.network.name);
  console.log("==========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceInFlow = hre.ethers.formatEther(balance);
  
  console.log("Balance:", balanceInFlow, "FLOW");
  console.log("Balance (wei):", balance.toString());
  console.log("");

  // Estimate deployment costs
  console.log("==========================================");
  console.log("Estimated Deployment Costs");
  console.log("==========================================");
  console.log("Note: Actual costs may vary based on network conditions");
  console.log("");
  
  // Rough estimates (these will vary)
  const estimatedGasPerContract = 3000000n; // 3M gas per contract
  const numberOfContracts = 3n; // NFT, Factory, Marketplace
  
  try {
    const feeData = await hre.ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;
    
    if (gasPrice > 0n) {
      const estimatedTotalGas = estimatedGasPerContract * numberOfContracts;
      const estimatedCost = estimatedTotalGas * gasPrice;
      const estimatedCostInFlow = hre.ethers.formatEther(estimatedCost);
      
      console.log("Current Gas Price:", hre.ethers.formatUnits(gasPrice, "gwei"), "gwei");
      console.log("Estimated Total Gas:", estimatedTotalGas.toString());
      console.log("Estimated Total Cost:", estimatedCostInFlow, "FLOW");
      console.log("");
      
      // Check if balance is sufficient
      if (balance > estimatedCost) {
        console.log("✓ Sufficient balance for deployment");
      } else {
        console.log("✗ Insufficient balance for deployment");
        console.log("  Need approximately:", estimatedCostInFlow, "FLOW");
        console.log("  Current balance:", balanceInFlow, "FLOW");
        console.log("  Shortfall:", hre.ethers.formatEther(estimatedCost - balance), "FLOW");
      }
    } else {
      console.log("Unable to fetch gas price from network");
    }
  } catch (error) {
    console.log("Unable to estimate costs:", error.message);
  }
  
  console.log("");
  console.log("==========================================");
  
  if (hre.network.name === "flow-testnet") {
    console.log("\nTo get testnet FLOW tokens:");
    console.log("Visit: https://testnet-faucet.onflow.org");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
