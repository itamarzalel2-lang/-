"""Narration: videos/<name>/script.json -> videos/<name>/voice/*.wav + videos/<name>/voice.json

script.json:
  { "voice": "af_heart", "speed": 1.05,
    "lines": [ { "id": "hook", "at": 0.3, "text": "What if all *rubber* disappeared for five seconds?" }, ... ] }

*word* marks a word the subtitles always highlight (the asterisks are not spoken).
voice.json records each line's duration and per-word timings (seconds from the line start),
which drive the subtitles in the player and the voice track in engine/audio.mjs.

Runs offline with Kokoro-82M (Apache-2.0) through kokoro-onnx. Set up once with
engine/setup-voice.sh; the model directory comes from $KOKORO_DIR (default ~/.cache/what-if-tts).
"""
import json
import os
import re
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

MODEL_DIR = os.environ.get("KOKORO_DIR", os.path.expanduser("~/.cache/what-if-tts"))


def display_words(text):
    """Words as shown on screen, with their highlight flag."""
    out = []
    for raw in text.split():
        hl = raw.startswith("*") or raw.rstrip(".,!?;:").endswith("*")
        out.append({"text": raw.replace("*", ""), "hl": hl})
    return out


def word_spans(kokoro, words, timings, duration, lang):
    """Start/end of every display word, from phoneme timings when the model has them."""
    if timings:
        # phoneme words are separated by spaces; a display word ("352") may phonemize
        # to several of them, so count each word's phoneme words on its own
        groups, cur = [], []
        for t in timings:
            if t.phoneme == " ":
                if cur:
                    groups.append(cur)
                cur = []
            elif re.match(r"\w", t.phoneme) or t.phoneme not in ".,!?;:—…\"'()":
                cur.append(t)
        if cur:
            groups.append(cur)
        counts = [max(1, len(kokoro.tokenizer.phonemize(w["text"], lang).split())) for w in words]
        if sum(counts) == len(groups):
            spans, k = [], 0
            for c in counts:
                g = [p for grp in groups[k : k + c] for p in grp]
                spans.append((g[0].start, g[-1].end))
                k += c
            return spans
    # fallback: spread the words over the line by length
    weights = np.array([len(w["text"]) + 2 for w in words], dtype=float)
    edges = np.concatenate([[0], np.cumsum(weights)]) / weights.sum() * duration
    return [(float(edges[i]), float(edges[i + 1])) for i in range(len(words))]


def main(video_dir):
    script = json.load(open(os.path.join(video_dir, "script.json")))
    kokoro = Kokoro(os.path.join(MODEL_DIR, "kokoro-q8.onnx"), os.path.join(MODEL_DIR, "voices.npz"))
    voice, speed, lang = script.get("voice", "af_heart"), script.get("speed", 1.0), script.get("lang", "en-us")
    os.makedirs(os.path.join(video_dir, "voice"), exist_ok=True)
    lines = []
    for line in script["lines"]:
        spoken = line["text"].replace("*", "")
        audio, sr, timings = kokoro.create_timed(spoken, voice=line.get("voice", voice), speed=line.get("speed", speed), lang=lang)
        rel = f"voice/{line['id']}.wav"
        sf.write(os.path.join(video_dir, rel), audio, sr)
        duration = len(audio) / sr
        words = display_words(line["text"])
        spans = word_spans(kokoro, words, timings, duration, lang)
        lines.append({
            "id": line["id"], "at": line["at"], "text": spoken, "file": rel, "duration": round(duration, 3),
            "words": [{**w, "start": round(s, 3), "end": round(e, 3)} for w, (s, e) in zip(words, spans)],
        })
        print(f"  {line['id']:<12} at {line['at']:6.2f}s  {duration:5.2f}s  {spoken[:60]}")
    # warn about lines that run into the next one
    for a, b in zip(lines, lines[1:]):
        if a["at"] + a["duration"] > b["at"] - 0.1:
            print(f"  ! '{a['id']}' ends at {a['at'] + a['duration']:.2f}s but '{b['id']}' starts at {b['at']:.2f}s")
    json.dump({"voice": voice, "speed": speed, "lines": lines}, open(os.path.join(video_dir, "voice.json"), "w"), indent=1)


if __name__ == "__main__":
    main(sys.argv[1])
