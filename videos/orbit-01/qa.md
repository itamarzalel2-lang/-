# QA: orbit-01 (Alone in Orbit, Part 1)

Checked with `npm run check -- orbit-01 --times ...` (stills) and the finished MP4.

| Found | Fix |
|---|---|
| Narration 2:11, over the 1.5–2 min target | Cut the sunrise and exercise lines and the "Day three" line, shortened four others: 1:56 |
| Room ended at the panel edge in the Hale close-up (black strip) | `interior()` now continues past the panel on every side |
| Ground's log text centred and clipped on the screen | `screen()` sets its own text alignment (it inherited `center` from `radio()`) |
| Letter too small to read on a phone | 31 px handwriting, one clause per line, camera follows the line being written |
| Figures small next to the reference (~28% of panel height vs ~50%) | Figures at 1.3–1.55x in the room shots |
| Title band, Part tag and captions smaller than the reference | 31 px title, 25 px tag, 27 px captions (measured against the reference frames) |
| Caption covered the day-30 tank value and the readout numbers | Notebook rows and readouts moved above the caption band |
| 03:00 clock cut off by the camera push | Pinned to the panel (`pin`), not the camera |
| Envelope 1 rose into the DAY 30 tag | Smaller rise, box moved right |
| The departing capsule too small to see | Camera follows it down toward the Earth |
