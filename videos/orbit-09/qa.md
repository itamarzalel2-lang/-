# QA: orbit-09 (Alone in Orbit, Part 9)

Checked with `npm run check -- orbit-09 --times ...` (a still every ~3-4 s) before rendering, then a sheet from the MP4.

| Found | Fix |
|---|---|
| Narration 1:21 | Added four lines: 1:35 |
| REC tag sat on top of the DAY tag | REC moved to the top right |
| C-O-2 Morse ran past both edges | `morseMarks` gap options; letters centred under their groups |
