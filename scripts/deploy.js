const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const CANDIDATES = ["Alice Johnson", "Bob Smith", "Carol Davis"];

async function main() {
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(CANDIDATES);
  await voting.deployed();

  const artifact = await hre.artifacts.readArtifact("Voting");
  const deployment = {
    address: voting.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    candidates: CANDIDATES,
    abi: artifact.abi,
  };

  const outFile = path.join(__dirname, "..", "public", "deployment.json");
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2) + "\n");

  console.log(`Voting contract deployed at ${voting.address} (${hre.network.name})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
