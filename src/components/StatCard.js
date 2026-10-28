export default function StatCard({ label, value, hint }) {
  return (
    <div className="stat">
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      {hint ? <p className="stat__hint">{hint}</p> : null}
    </div>
  );
}
