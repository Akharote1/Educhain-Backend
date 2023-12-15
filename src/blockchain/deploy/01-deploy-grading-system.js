import { updateBackend } from "./99-update-backend.js";
import pkg from "hardhat";

const { ethers } = pkg;

async function main() {
  const accounts = await ethers.getSigners(); // Use array destructuring to get the deployer

  const gradingSystem = await ethers.deployContract("GradingSystem", {
    from: accounts[0].address,
  });

  await gradingSystem.waitForDeployment();

  const address = await gradingSystem.getAddress();

  console.log("Grading System contract deployed to:", address);

  updateBackend("GradingSystem", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
