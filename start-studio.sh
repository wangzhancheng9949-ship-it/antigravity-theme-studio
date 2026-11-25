#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v node >/dev/null 2>&1; then
  nohup node "$DIR/tools/studio-server.mjs" >/dev/null 2>&1 &
  exit 0
fi

for AGY in \
  "/usr/bin/antigravity" \
  "/usr/local/bin/antigravity" \
  "/opt/Antigravity/antigravity" \
  "/opt/antigravity/antigravity" \
  "$HOME/.local/bin/antigravity" \
  "/snap/bin/antigravity"; do
  if [ -x "$AGY" ]; then
    ELECTRON_RUN_AS_NODE=1 nohup "$AGY" "$DIR/tools/studio-server.mjs" >/dev/null 2>&1 &
    exit 0
  fi
done

echo "[Error] Neither Node.js (>=20) nor Antigravity binary was found."
exit 1
