# QA: orbit-12 (Alone in Orbit, Part 12)

Checked with `npm run check -- orbit-12 --times ...` (a still every ~3-4 s) before rendering, then a sheet from the MP4.

| Found | Fix |
|---|---|
| Narration 1:24 | Added four lines: 1:40 |
| Envelope 12 must rise while 10 and 11 stay | `envelopesShot` takes `rise` |
| Numbers vs story.md | Day 260 water 31% (−0.3%/day → gone ~Day 365) |
