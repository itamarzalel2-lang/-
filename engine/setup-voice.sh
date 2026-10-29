#!/usr/bin/env bash
# One-time setup for narration (engine/voice.py): a Python venv with kokoro-onnx, the
# Kokoro-82M q8 model and its voices. Everything runs offline afterwards.
#
# Model: tries the official Hugging Face repo first; if that host is unreachable it falls
# back to the npm package kokoro-q8-shards (the same file split in 6 parts) and checks the
# sha256. Voices come from the kokoro-js npm package.
set -euo pipefail
cd "$(dirname "$0")/.."
DIR="${KOKORO_DIR:-$HOME/.cache/what-if-tts}"
SHA=fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478
mkdir -p "$DIR"

if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
  .venv/bin/pip install -q kokoro-onnx soundfile
fi

if [ ! -f "$DIR/kokoro-q8.onnx" ]; then
  HF=https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model_quantized.onnx
  if ! curl -fsSL -m 600 "$HF" -o "$DIR/kokoro-q8.onnx"; then
    echo "Hugging Face unreachable, using the npm copy (kokoro-q8-shards)"
    TMP=$(mktemp -d)
    (cd "$TMP" && npm pack kokoro-q8-shards@1.0.0 --silent >/dev/null && tar xzf kokoro-q8-shards-1.0.0.tgz)
    cat "$TMP"/package/kokoro-q8.part{0,1,2,3,4,5}.bin > "$DIR/kokoro-q8.onnx"
    rm -rf "$TMP"
  fi
  echo "$SHA  $DIR/kokoro-q8.onnx" | sha256sum -c - || { rm -f "$DIR/kokoro-q8.onnx"; exit 1; }
fi

if [ ! -f "$DIR/voices.npz" ]; then
  TMP=$(mktemp -d)
  (cd "$TMP" && npm pack kokoro-js@1.2.1 --silent >/dev/null && tar xzf kokoro-js-1.2.1.tgz)
  .venv/bin/python - "$TMP/package/voices" "$DIR/voices.npz" <<'EOF'
import glob, os, sys
import numpy as np
src, out = sys.argv[1], sys.argv[2]
voices = {os.path.basename(f)[:-4]: np.fromfile(f, dtype=np.float32).reshape(510, 1, 256) for f in glob.glob(src + "/*.bin")}
np.savez(out, **voices)
print(len(voices), "voices")
EOF
  rm -rf "$TMP"
fi
echo "voice ready in $DIR"
