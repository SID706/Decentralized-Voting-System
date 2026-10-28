const hre = require('hardhat');

const DEFAULT_CANDIDATES = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson'];

async function main() {
  const names = process.env.CANDIDATES
    ? process.env.CANDIDATES.split(',').map((name) => name.trim()).filter(Boolean)
    : DEFAULT_CANDIDATES;

  const Voting = await hre.ethers.getContractFactory('Voting');
  const voting = await Voting.deploy(names);
  await voting.deployed();

  console.log(`Voting deployed to ${voting.address}`);
  console.log(`Candidates: ${names.join(', ')}`);
  console.log('Add this to your environment: REACT_APP_CONTRACT_ADDRESS=' + voting.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
