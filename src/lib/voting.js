import { ethers } from "ethers";

/**
 * The frontend talks to the blockchain through the dev server's /rpc proxy,
 * so the browser only ever needs the single origin it was served from.
 */
export function makeProvider() {
  return new ethers.providers.JsonRpcProvider(
    `${window.location.origin}/rpc`,
    { chainId: 31337, name: "localhost" }
  );
}

export async function loadDeployment() {
  const res = await fetch(`${process.env.PUBLIC_URL}/deployment.json`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Could not load the contract deployment");
  const deployment = await res.json();
  if (!deployment.address || !deployment.abi) {
    throw new Error("The contract has not been deployed yet");
  }
  return deployment;
}

/**
 * MetaMask when the browser provides it; otherwise the local chain's
 * first development account (dev-only key, valid on the local node).
 */
export async function connectWallet(provider) {
  if (window.ethereum) {
    const web3 = new ethers.providers.Web3Provider(window.ethereum);
    await web3.send("eth_requestAccounts", []);
    const signer = web3.getSigner();
    return { signer, address: await signer.getAddress(), mode: "MetaMask" };
  }

  const key = process.env.REACT_APP_DEV_PRIVATE_KEY;
  if (!key) throw new Error("No wallet available: install MetaMask to vote");
  const wallet = new ethers.Wallet(key, provider);
  return { signer: wallet, address: wallet.address, mode: "Local dev account" };
}
