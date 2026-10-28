import { useState } from 'react';

export default function AddCandidateForm({ adding, onAdd }) {
  const [name, setName] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const ok = await onAdd(name);
    if (ok) setName('');
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <label className="add-form__label" htmlFor="candidate-name">
        Add a candidate
      </label>
      <div className="add-form__row">
        <input
          id="candidate-name"
          className="add-form__input"
          type="text"
          value={name}
          placeholder="Full name"
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          disabled={adding}
        />
        <button type="submit" className="button button--primary" disabled={adding || !name.trim()}>
          {adding ? 'Adding…' : 'Add candidate'}
        </button>
      </div>
    </form>
  );
}
