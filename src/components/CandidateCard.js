export default function CandidateCard({
  candidate,
  share,
  isLeader,
  hasVoted,
  pending,
  onVote,
}) {
  const canVote = !hasVoted && !pending;

  return (
    <li className={`candidate${isLeader ? ' candidate--leader' : ''}`}>
      <div className="candidate__head">
        <span className="candidate__avatar" aria-hidden="true">
          {candidate.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="candidate__identity">
          <h3 className="candidate__name">{candidate.name}</h3>
          <p className="candidate__meta">
            {isLeader && share > 0 ? 'Leading the poll' : 'On the ballot'}
          </p>
        </div>
        <span className="candidate__count">
          {candidate.votes}
          <span className="candidate__count-label">{candidate.votes === 1 ? 'vote' : 'votes'}</span>
        </span>
      </div>

      <div
        className="candidate__bar"
        role="img"
        aria-label={`${share}% of the votes cast`}
      >
        <span style={{ width: `${share}%` }} />
      </div>

      <div className="candidate__foot">
        <span className="candidate__share">{share}%</span>
        <button
          type="button"
          className="button button--vote"
          onClick={() => onVote(candidate.id)}
          disabled={!canVote}
        >
          {pending ? 'Submitting…' : hasVoted ? 'Vote recorded' : 'Cast vote'}
        </button>
      </div>
    </li>
  );
}
