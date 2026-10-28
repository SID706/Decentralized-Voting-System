import React, { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import CandidateCard from "./components/CandidateCard";
import { connectWallet, loadDeployment, makeProvider } from "./lib/voting";

export default function App() {
  const [deployment, setDeployment] = useState(null);
  const [provider, setProvider] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [winner, setWinner] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const deployed = await loadDeployment();
        const rpc = makeProvider();
        if (cancelled) return;
        setDeployment(deployed);
        setProvider(rpc);

        try {
          const connected = await connectWallet(rpc);
          if (!cancelled) setWallet(connected);
        } catch (walletError) {
          if (!cancelled) setError(walletError.message);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!deployment) return;
    const contract = new ethers.Contract(
      deployment.address,
      deployment.abi,
      provider || makeProvider()
    );
    const [list, total, result] = await Promise.all([
      contract.getCandidates(),
      contract.totalVotes(),
      contract.getWinner(),
    ]);

    setCandidates(
      list.map((candidate, index) => ({
        id: index,
        name: candidate.name,
        votes: candidate.votes.toNumber(),
      }))
    );
    setTotalVotes(total.toNumber());
    setWinner({ name: result.winnerName, votes: result.votes.toNumber() });
    setHasVoted(wallet ? await contract.hasVoted(wallet.address) : false);
    setReady(true);
  }, [deployment, provider, wallet]);

  useEffect(() => {
    refresh().catch((readError) => setError(readError.message));
  }, [refresh]);

  async function handleVote(candidateId) {
    if (!deployment || !wallet) return;
    setVoting(true);
    setError("");
    try {
      const contract = new ethers.Contract(
        deployment.address,
        deployment.abi,
        wallet.signer
      );
      const tx = await contract.vote(candidateId);
      await tx.wait();
      await refresh();
    } catch (voteError) {
      setError(voteError.reason || voteError.message);
    } finally {
      setVoting(false);
    }
  }

  const maxVotes = candidates.reduce((max, c) => Math.max(max, c.votes), 0);
  const canVote = Boolean(wallet) && !hasVoted && !voting;

  return (
    <div className="page">
      <main className="shell">
        <header className="masthead">
          <div>
            <p className="eyebrow">Ethereum · local chain</p>
            <h1>Decentralized Voting</h1>
            <p className="lede">
              Every vote is a transaction on the Voting smart contract — no server,
              no database, just the chain.
            </p>
          </div>
          <div className="wallet">
            {wallet ? (
              <>
                <span className="wallet-label">{wallet.mode}</span>
                <code>{`${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`}</code>
              </>
            ) : (
              <span className="wallet-label">Connecting wallet…</span>
            )}
          </div>
        </header>

        <section className="stats">
          <div className="stat">
            <span className="stat-label">Total votes</span>
            <strong>{totalVotes}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Leading</span>
            <strong>{winner && winner.votes > 0 ? winner.name : "—"}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Your ballot</span>
            <strong>{hasVoted ? "Cast" : "Open"}</strong>
          </div>
        </section>

        {error && <p className="notice error">{error}</p>}
        {voting && <p className="notice">Waiting for the transaction to be mined…</p>}
        {!ready && !error && <p className="notice">Loading candidates from the chain…</p>}

        <section className="grid">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              maxVotes={maxVotes}
              disabled={!canVote}
              onVote={handleVote}
            />
          ))}
        </section>

        {deployment && (
          <footer className="foot">
            Contract <code>{deployment.address}</code> · network {deployment.network}
          </footer>
        )}
      </main>
    </div>
  );
}
