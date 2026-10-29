# What-if shorts: workflow for Claude

This repo makes vertical "What if X for 5 seconds?" shorts (1080×1920) **from code**: a Three.js scene rendered frame by frame in headless Chromium, with synthesized sound, encoded to MP4. It's not AI video. Every frame comes from code you can read and fix.

When the user sends a one-line premise ("What if all X disappeared for 5 seconds?"), do all five steps yourself and don't stop at a plan. The user only types the line.

## 1. One line → premise check
- Check `ideas.md`: has this premise already been made in this repo? Search the web to see whether a popular video on this exact idea already exists ("Posted already?"). If it has been done, look for a new twist and say so.
- Find the **twist**: the non-obvious physics consequence that makes the video (e.g. rubber comes back, the air doesn't → every tire is flat).
- Write `videos/<slug>/premise.md`: the line, the twist, location, and a shot table with times.

## 2. Sources: every number gets one
- Before writing the scene, research each number that will appear on screen. Write `videos/<slug>/sources.md`: value, source with a URL, and caveats.
- Don't put a number on screen without a source. A calculation (e.g. tire sidewall) counts as a source if the inputs are written down.
- Prefer official sources (agencies, manufacturers, research). Phrase on-screen numbers conservatively ("~").

## 2.5 Narration: the most important part
- Every video has a voiceover in English. Write `videos/<slug>/script.json` (lines with `at` in seconds; `*word*` = a word the subtitles always highlight). The facts and their sources go **in the narration**, not in fact cards on screen.
- The countdown is three separate lines ("Three." / "Two." / "One.") exactly 3, 2 and 1 seconds before the event, synced to the timer.
- `node engine/voice.mjs <slug>` (one-time setup: `bash engine/setup-voice.sh`) → `voice/*.wav` + `voice.json` with per-word timings. It warns when a line runs into the next one; fix `at` and run it again.
- Subtitles are generated automatically from the narration (bottom third, the spoken word in yellow). No `overlay.fact` / `overlay.end`.

## 3. The scene is code
- `videos/<slug>/scene.js` exports `config` (duration, fps, fov, bloom), `audio` (cues), and `setup(ctx)`, which returns `update(t)`.
- **Everything must be a pure function of time `t`.** No `Math.random()`: use `rng(seed)` / `hash01(...)` from `engine/lib/util.js`. That lets frames render in parallel and in any order.
- Building blocks in `engine/lib/`:
  - `city.js`: `timesSquare({...})`, a city of 36 blocks with billboards, lanes, and crowd zones (north = −z; the open corridor is x −26..28; the camera never leaves it).
  - `traffic.js`: 352 instanced cars with analytic motion, `brake(at)` (stopping without collisions), and wheel state (ride height, tires, flat tires).
  - `crowd.js`: pedestrians that walk, stop, turn, and have rubber soles.
  - `fx.js`: closed-form particles (sparks, smoke, air burst).
  - `camera.js`: `cameraPath` (PCHIP, no overshoot through the ground), `shots` (hard cuts), `follow` (a camera that rides alongside a car), `handheld`.
  - `overlay.js`: title, timer, counter, chip (REPLAY), card (time jump), and a `tag` (a red ring and label pinned to a 3D object).
  - `subtitles.js`: word-by-word subtitles from `voice.json`.
  - `util.js` → `remap()`: story time → simulation time, for slow-motion replays.
  - `props.js`: a first-person hand holding a phone.
- A new location or object goes in `engine/lib/` as a reusable module, not inside the scene.

## 4. Self-check: Claude checks its own frames
- `npm run check -- <slug> --every 0.75` (or `--times 4.9,5.0,5.1`) renders stills at half resolution and builds `out/<slug>/check/sheet.jpg`. **Look at the sheet** and at individual frames (`out/<slug>/check/fNNN.jpg`).
- Check every time: is the camera inside a building or under the ground? Is the key moment visible and readable? Does text cover the action? Is the frame washed out or too dark? Does every number match `sources.md`?
- Record the findings and fixes in `videos/<slug>/qa.md`. Repeat until it's clean.
- After the full render: `npm run check -- <slug> --mp4 out/<slug>.mp4` and look at it again.

## 5. Render
- `npm run render -- <slug>` → `out/<slug>.mp4` (H.264 + AAC, faststart, ready to upload).
- Pass 1 renders the 3D scene with no text (slow). Pass 2 renders all the text (title, timer, subtitles) on a transparent page (fast). Then the soundtrack and the voice are mixed (the effects duck under the speech), and everything is encoded.
- A text or narration change → `--encode-only` (no 3D re-render). `--workers N` sets parallelism, `--resume` continues an interrupted render.
- On a Linux server with no GPU, WebGL runs in software (SwiftShader) and is slow. On a Mac/PC the GPU is used.
- Add the premise to `ideas.md` with status `made`.

## Conventions
- Overlay layout is designed for a 540×960 stage (output is at 2×). The title is at the top. Keep the 3D action in the middle, and don't cover it with text.
- No real brands on billboards (`textures.js` generates made-up ones).
- On-screen English uses US spelling ("tire").
