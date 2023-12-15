
import fs from "fs";
import pkg from "hardhat";
import { backendAbiFile, backendContractsFile } from "../helper-hardhat-config.js";

const { network, ethers } = pkg;

export async function updateBackend(contractName, contractAddress) {
  // if (process.env.UPDATE_FRONT_END) {
  console.log("Writing to backend...");
  await updateContractAddresses(contractName, contractAddress);
  await updateAbi(contractName, contractAddress);
  console.log("Backend written!");
  // }
}

async function updateAbi(contractName, contractAddress) {
  const contract = await ethers.getContractAt(contractName, contractAddress);
  fs.writeFileSync(backendAbiFile, contract.interface.formatJson());
}

async function updateContractAddresses(contractName, contractAddress) {
  const contractAddresses = JSON.parse(
    fs.readFileSync(backendContractsFile, "utf8")
  );
  if (network.config.chainId.toString() in contractAddresses) {
    if (
      !contractAddresses[network.config.chainId.toString()].includes(
        contractAddress
      )
    ) {
      contractAddresses[network.config.chainId.toString()] = contractAddress;
    }
  } else {
    contractAddresses[network.config.chainId.toString()] = [contractAddress];
  }
  fs.writeFileSync(backendContractsFile, JSON.stringify(contractAddresses));
}

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

