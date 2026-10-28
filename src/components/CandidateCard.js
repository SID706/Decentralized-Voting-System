import React from "react";

export default function CandidateCard({ candidate, maxVotes, disabled, onVote }) {
  const share = maxVotes > 0 ? Math.round((candidate.votes / maxVotes) * 100) : 0;

  return (
    <article className="card">
      <header className="card-head">
        <h2>{candidate.name}</h2>
        <span className="count">
          {candidate.votes} {candidate.votes === 1 ? "vote" : "votes"}
        </span>
      </header>
      <div className="bar">
        <span style={{ width: `${share}%` }} />
      </div>
      <button
        type="button"
        className="vote-btn"
        disabled={disabled}
        onClick={() => onVote(candidate.id)}
      >
        {disabled ? "Voting closed" : "Vote"}
      </button>
    </article>
  );
}
