# QA: orbit-10 (Alone in Orbit, Part 10)

Checked with `npm run check -- orbit-10 --times ...` (a still every ~3-4 s) before rendering, then a sheet from the MP4.

| Found | Fix |
|---|---|
| Narration 1:15 | Added seven lines: 1:38 |
| Two lines shared the id `lied` (the second overwrote the first's audio) | Renamed the second `liar`, narration regenerated |
| The hatch wheel didn't turn while he spins it | `hatchNight` takes a hatch state over time |
