#!/bin/sh
# Install node_modules only when the lockfile/manifest actually changed.
# A plain `npm ci` on every stack start deletes and re-creates node_modules,
# which breaks any dev server that is already running from the bind mount.
set -e

stamp="node_modules/.base44-lock-sha"
current="$(cat package.json package-lock.json | sha256sum | cut -d' ' -f1)"

if [ -f "$stamp" ] && [ "$(cat "$stamp")" = "$current" ]; then
  echo "Dependencies already in sync ($current)"
  exit 0
fi

echo "Installing dependencies ($current)"
npm ci --no-audit --no-fund
printf '%s\n' "$current" > "$stamp"
