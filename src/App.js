import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import AddCandidateForm from './components/AddCandidateForm';
import CandidateCard from './components/CandidateCard';
import StatCard from './components/StatCard';
import { addCandidate, castVote, connect, fetchState } from './lib/votingClient';

function shortAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function App() {
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    const next = await fetchState();
    setElection(next);
    return next;
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await connect();
        const next = await fetchState();
        if (mounted) setElection(next);
      } catch (err) {
        if (mounted) setError(err.message || 'The election could not be loaded.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const totalVotes = useMemo(
    () => (election ? election.candidates.reduce((sum, item) => sum + item.votes, 0) : 0),
    [election]
  );

  const leader = useMemo(() => {
    if (!election || election.candidates.length === 0 || totalVotes === 0) return null;
    return election.candidates.reduce((best, item) => (item.votes > best.votes ? item : best));
  }, [election, totalVotes]);

  async function handleVote(candidateId) {
    setError('');
    setNotice('');
    setPendingId(candidateId);
    try {
      await castVote(candidateId);
      const next = await refresh();
      const voted = next.candidates.find((item) => item.id === candidateId);
      setNotice(voted ? `Your vote for ${voted.name} is recorded.` : 'Your vote is recorded.');
    } catch (err) {
      setError(err.message || 'The vote could not be submitted.');
    } finally {
      setPendingId(null);
    }
  }

  async function handleAdd(name) {
    setError('');
    setNotice('');
    setAdding(true);
    try {
      await addCandidate(name);
      await refresh();
      setNotice(`${name.trim()} was added to the ballot.`);
      return true;
    } catch (err) {
      setError(err.message || 'The candidate could not be added.');
      return false;
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <main className="shell">
        <p className="loading">Loading the election…</p>
      </main>
    );
  }

  const isDemo = election?.mode !== 'chain';

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            ◈
          </span>
          <div>
            <p className="brand__name">BallotChain</p>
            <p className="brand__tag">Decentralized Voting</p>
          </div>
        </div>

        <div className="topbar__right">
          <span className={`pill${isDemo ? ' pill--demo' : ' pill--live'}`}>
            {isDemo ? 'Demo ledger' : election.networkLabel}
          </span>
          <span className="account" title={election?.account}>
            <span className="account__dot" aria-hidden="true" />
            {shortAddress(election?.account)}
          </span>
        </div>
      </header>

      <section className="hero">
        <p className="hero__eyebrow">One address, one vote</p>
        <h1 className="hero__title">Every ballot is public. Every tally is verifiable.</h1>
        <p className="hero__copy">
          Votes are recorded by the <code>Voting</code> smart contract, so the count can be audited
          by anyone without trusting a server.
        </p>
        {isDemo ? (
          <p className="hero__hint">
            No contract address or wallet detected — exploring with a local demo ledger stored in
            this browser. Set <code>REACT_APP_CONTRACT_ADDRESS</code> to vote on-chain.
          </p>
        ) : (
          <p className="hero__hint">
            Contract <code>{shortAddress(election.contractAddress)}</code> on{' '}
            {election.networkLabel}.
          </p>
        )}
      </section>

      <section className="stats" aria-label="Election snapshot">
        <StatCard label="Votes cast" value={totalVotes} hint="Recorded on the ballot" />
        <StatCard label="Candidates" value={election?.candidates.length ?? 0} hint="Registered" />
        <StatCard
          label="Leading"
          value={leader ? leader.name : '—'}
          hint={leader ? `${leader.votes} ${leader.votes === 1 ? 'vote' : 'votes'}` : 'No votes yet'}
        />
        <StatCard
          label="Your status"
          value={election?.hasVoted ? 'Voted' : 'Not voted'}
          hint={election?.isChair ? 'Chairperson' : 'Voter'}
        />
      </section>

      {error ? (
        <p className="banner banner--error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="banner banner--success" role="status">
          {notice}
        </p>
      ) : null}

      <section className="ballot" aria-label="Ballot">
        <div className="ballot__head">
          <h2 className="ballot__title">Candidates</h2>
          <span className="ballot__count">
            {election?.candidates.length ?? 0} on the ballot
          </span>
        </div>

        {election && election.candidates.length > 0 ? (
          <ul className="candidate-list">
            {election.candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                share={totalVotes === 0 ? 0 : Math.round((candidate.votes / totalVotes) * 100)}
                isLeader={leader ? leader.id === candidate.id : false}
                hasVoted={election.hasVoted}
                pending={pendingId === candidate.id}
                onVote={handleVote}
              />
            ))}
          </ul>
        ) : (
          <p className="empty">No candidates have been added yet.</p>
        )}
      </section>

      {election?.isChair ? <AddCandidateForm adding={adding} onAdd={handleAdd} /> : null}

      <footer className="footer">
        <p>
          {isDemo
            ? 'Demo mode keeps the ledger in this browser only. Deploy the contract to record votes on-chain.'
            : 'Contract calls are signed by your wallet; no server can alter a recorded vote.'}
        </p>
      </footer>
    </main>
  );
}
