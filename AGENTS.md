# Agent notes — Decentralized Voting

## Why the app failed to start (commit 8e7ff3e)

The commit (and every ref in the repo, including `main`) contains only
`package.json`, `package-lock.json`, `hardhat.config.js`, `README.md`,
`.gitignore`, a 0-byte file named `code` and an empty `start.txt`. The
Create React App entry points (`public/index.html`, `src/`) were never uploaded,
so `npm start` → `react-scripts start` exited immediately for a missing
entry file. The React source in `src/` and `public/` here was authored to make
the project boot again; `contracts/Voting.sol` and `scripts/deploy.js` match the
contract the UI talks to.

## Running it (sandbox / dev)

```sh
docker compose -f docker-compose.base44.yml up -d
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/
```

- Single service (`web`) on host port 3000: the CRA dev server on
  `node:20-bookworm`, repo bind-mounted at `/app`, `node_modules` in a named
  volume. The container runs `npm ci` from `package-lock.json` on first start
  and again whenever the lockfile hash changes (stamp at
  `node_modules/.base44-lock-stamp`), then `npm start`.
- The full dependency set (hardhat toolbox + CRA) makes the **first** install
  take a few minutes; `start_period: 240s` accounts for it.
- `CI=false` matters: CRA treats warnings as fatal and refuses to serve when
  `CI=true`.
- The sandbox host header is accepted by webpack-dev-server without extra
  flags; no `DANGEROUSLY_DISABLE_HOST_CHECK` needed.
- Compose mounts `/run/base44/app.env` (optional) after
  `.env.base44-defaults`, so dashboard values always win.

## Verifying

- Page renders: `curl http://localhost:3000/` returns the HTML title
  `Decentralized Voting` and `<script src="/static/js/bundle.js">` (unhashed =
  dev server, not a prebuilt bundle).
- Production compile check: `docker compose ... exec -T web sh -c 'CI=true npx --no-install react-scripts build'`.
- The contract does **not** need to be deployed to use the interface.

## Wallet / contract behaviour (non-obvious)

- `src/lib/votingClient.js` uses MetaMask + `REACT_APP_CONTRACT_ADDRESS` when
  both are available; otherwise it falls back to a **demo ledger** in
  `localStorage` (`voting.demo.state`, `voting.demo.voter`) so the UI stays
  usable in the preview, which has no wallet. Demo mode also allows adding
  candidates (treated as chairperson) and enforces one vote per address.
- To go on-chain: `npx hardhat compile`,
  `npx hardhat run --network <net> scripts/deploy.js`, then set
  `REACT_APP_CONTRACT_ADDRESS` (and optionally `REACT_APP_NETWORK_LABEL`).
  Solidity compilation downloads solc on first run.
- `hardhat.config.js` has only the in-memory `hardhat` network; add a Ganache
  or Volta network before deploying.
