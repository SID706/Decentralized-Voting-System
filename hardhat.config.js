/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.11",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    // Local development chain. RPC_URL lets scripts reach a node that is not
    // listening on this machine's own 127.0.0.1 (e.g. a Compose service).
    localhost: {
      url: process.env.RPC_URL || "http://127.0.0.1:8545"
    }
  }
};
