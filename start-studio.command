#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"

if command -v node >/dev/null 2>&1; then
  nohup node "$DIR/tools/studio-server.mjs" >/dev/null 2>&1 &
  exit 0
fi

for AGY in \
  "/Applications/Antigravity.app/Contents/MacOS/Antigravity" \
  "$HOME/Applications/Antigravity.app/Contents/MacOS/Antigravity"; do
  if [ -x "$AGY" ]; then
    ELECTRON_RUN_AS_NODE=1 nohup "$AGY" "$DIR/tools/studio-server.mjs" >/dev/null 2>&1 &
    exit 0
  fi
done

echo "[Error] Neither Node.js (>=20) nor Antigravity.app was found."
read -r -p "Press Enter to exit..."
exit 1
