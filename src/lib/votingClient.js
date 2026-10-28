import { ethers } from 'ethers';
import VotingABI from './VotingABI.json';

export const CONTRACT_ADDRESS = (process.env.REACT_APP_CONTRACT_ADDRESS || '').trim();
export const NETWORK_LABEL = process.env.REACT_APP_NETWORK_LABEL || 'Local Ganache';

const DEMO_VOTER_KEY = 'voting.demo.voter';
const DEMO_STATE_KEY = 'voting.demo.state';

const SEED_CANDIDATES = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson'];

// `null` until connect() resolves; every method below reads it.
let connection = null;

function demoAddress() {
  try {
    const stored = window.localStorage.getItem(DEMO_VOTER_KEY);
    if (stored) return stored;
    const bytes = new Uint8Array(20);
    window.crypto.getRandomValues(bytes);
    const address = `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
    window.localStorage.setItem(DEMO_VOTER_KEY, address);
    return address;
  } catch (err) {
    return '0x0000000000000000000000000000000000000000';
  }
}

function emptyDemoLedger() {
  return {
    candidates: SEED_CANDIDATES.map((name, id) => ({ id, name, votes: 0 })),
    voters: [],
  };
}

function readDemoLedger() {
  try {
    const raw = window.localStorage.getItem(DEMO_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.candidates) && Array.isArray(parsed.voters)) return parsed;
    }
  } catch (err) {
    // A corrupted demo ledger should never break the page; start fresh instead.
  }
  const seeded = emptyDemoLedger();
  writeDemoLedger(seeded);
  return seeded;
}

function writeDemoLedger(ledger) {
  try {
    window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(ledger));
  } catch (err) {
    // Private browsing can block storage; the in-memory state still works for the session.
  }
}

function sortCandidates(candidates) {
  return [...candidates]
    .map((candidate, index) => ({
      id: Number.isInteger(candidate.id) ? candidate.id : index,
      name: candidate.name,
      votes: Number(candidate.votes) || 0,
    }))
    .sort((a, b) => a.id - b.id);
}

/**
 * Connects MetaMask + the deployed contract when both are configured, otherwise
 * falls back to a local demo ledger so the interface stays usable.
 */
export async function connect() {
  const injected = typeof window !== 'undefined' ? window.ethereum : undefined;

  if (CONTRACT_ADDRESS && injected) {
    try {
      const provider = new ethers.providers.Web3Provider(injected, 'any');
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingABI, signer);
      connection = {
        mode: 'chain',
        provider,
        contract,
        account: await signer.getAddress(),
      };
      return connection;
    } catch (err) {
      // Wallet rejected or wrong network: keep the app usable in demo mode.
      connection = null;
    }
  }

  connection = { mode: 'demo', account: demoAddress(), provider: null, contract: null };
  return connection;
}

async function ensureConnection() {
  if (!connection) await connect();
  return connection;
}

export async function fetchState() {
  const active = await ensureConnection();

  if (active.mode === 'chain') {
    const { contract, account } = active;
    const count = (await contract.candidateCount()).toNumber();
    const candidates = [];
    for (let id = 0; id < count; id += 1) {
      const candidate = await contract.candidates(id);
      candidates.push({ id, name: candidate.name, votes: candidate.votes.toNumber() });
    }
    const chairperson = await contract.chairperson();
    const hasVoted = await contract.hasVoted(account);
    return {
      mode: 'chain',
      networkLabel: NETWORK_LABEL,
      contractAddress: CONTRACT_ADDRESS,
      account,
      chairperson,
      isChair: chairperson.toLowerCase() === account.toLowerCase(),
      hasVoted,
      candidates: sortCandidates(candidates),
    };
  }

  const ledger = readDemoLedger();
  return {
    mode: 'demo',
    networkLabel: 'Demo ledger (browser only)',
    contractAddress: '',
    account: active.account,
    chairperson: active.account,
    isChair: true,
    hasVoted: ledger.voters.includes(active.account),
    candidates: sortCandidates(ledger.candidates),
  };
}

export async function castVote(candidateId) {
  const active = await ensureConnection();

  if (active.mode === 'chain') {
    const tx = await active.contract.vote(candidateId);
    await tx.wait();
    return;
  }

  const ledger = readDemoLedger();
  if (ledger.voters.includes(active.account)) {
    throw new Error('This address has already cast its vote.');
  }
  const candidate = ledger.candidates.find((item) => item.id === candidateId);
  if (!candidate) throw new Error('That candidate is not on the ballot.');
  candidate.votes += 1;
  ledger.voters.push(active.account);
  writeDemoLedger(ledger);
}

export async function addCandidate(name) {
  const active = await ensureConnection();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Enter a candidate name first.');

  if (active.mode === 'chain') {
    const tx = await active.contract.addCandidate(trimmed);
    await tx.wait();
    return;
  }

  const ledger = readDemoLedger();
  if (ledger.candidates.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`${trimmed} is already on the ballot.`);
  }
  ledger.candidates.push({ id: ledger.candidates.length, name: trimmed, votes: 0 });
  writeDemoLedger(ledger);
}
