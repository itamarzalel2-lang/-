#!/usr/bin/env bash
# Bring OpenMontage (https://github.com/calesthio/OpenMontage) into this environment so
# Claude can use its pipelines next to this repo's own engine.
#
#   bash scripts/setup-openmontage.sh        # clone (or update) + make setup + local fixes
#
# Lands in ../openmontage-tools/OpenMontage (outside this repo, so nothing of it is committed
# here). Safe to run again: it updates the clone and skips work already done.
set -euo pipefail
cd "$(dirname "$0")/.."
DIR="${OPENMONTAGE_DIR:-$(cd .. && pwd)/openmontage-tools/OpenMontage}"

if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only --quiet || echo "(could not update $DIR; using it as is)"
else
  mkdir -p "$(dirname "$DIR")"
  GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/calesthio/OpenMontage "$DIR"
fi

cd "$DIR"
[ -x .venv/bin/python ] && [ -d remotion-composer/node_modules ] || make setup

# Remotion downloads its own Chrome from remotion.media; where that host is blocked, use the
# headless shell Playwright already installed (cloud sessions have it under /opt/pw-browsers).
SHELL_BIN=$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1 || true)
if [ -n "$SHELL_BIN" ] && [ ! -f remotion-composer/remotion.config.ts ]; then
  cat > remotion-composer/remotion.config.ts <<EOF
// Added by what-if-shorts/scripts/setup-openmontage.sh: use the preinstalled headless shell.
import { Config } from '@remotion/cli/config';
Config.setBrowserExecutable('$SHELL_BIN');
EOF
fi

# Piper lives in the venv; OpenMontage looks for it on PATH.
echo "OpenMontage ready in $DIR"
echo "  run tools with:  cd $DIR && PATH=\$PWD/.venv/bin:\$PATH .venv/bin/python ..."
