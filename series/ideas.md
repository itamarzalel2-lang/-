# Cliffhanger series: format and idea bank

A second format next to the "What if" shorts, modelled on the reference "Bunker Survival Ep 01: Day 1 to Day 365" series.

## Format
- **14 parts** per series (2 uploads a day for 7 days), ~2:30–3:30 each.
- Every part stops at the most interesting moment; the next part **starts 3 seconds before** that cut.
- Look: flat 2D stick figures in a centred panel, grunge frame, a title band on top ("<Series> Ep 01: Day 1 to Day 365"), a "Part.N" tag, single-word captions (white, black outline) in the centre, handwritten letters, and daily number tables.
- Story engine: a letter with **three rules**, **three numbers** checked every morning, a day counter, and one mystery that breaks a rule.
- Sound: one deep male narrator over a soft sustained pad (the reference pad is a C-major chord: C4 E4 C5 E5 G5 C6), with almost no pauses between lines.

## Narrator voice
Measured from the three reference parts (music removed by spectral subtraction): male, median pitch ~110 Hz with a wide range (~87–142 Hz between quartiles), ~3.9 syllables/s while speaking, almost no gaps.

Closest Kokoro voices (`out/voice-test.mp4` plays the reference and then each candidate):

| # | Kokoro voice | Pitch (median, quartiles) | Pace |
|---|---|---|---|
| 1 | blend `bm_fable*0.6 + am_michael*0.4`, en-us, speed 1.06 | 109 Hz, 89–131 | 4.1 syl/s |
| 2 | blend `am_echo + am_michael`, en-us, speed 1.06 | 110 Hz, 96–127 | 4.0 syl/s |
| 3 | `bm_fable`, en-gb, speed 1.0 | 104 Hz, 82–128 | 3.3 syl/s |

Kokoro can't clone a voice. An exact copy would need a cloning service (for example ElevenLabs), which needs an API key and that host allowed in the environment's network policy.

## Ideas

| # | Series | Rules (from a letter) | The three numbers | Part 1 ends on | Status |
|---|---|---|---|---|---|
| 1 | **Alone in Orbit: Day 1 to Day 365** | Never open Hatch 3. Check the three numbers every morning. If Earth calls on channel 9, don't answer. | O2 / WATER / POWER | Day 40: a knock on the hull. From outside. In space. | idea |
| 2 | **The Lighthouse: Night 1 to Night 365** | The light never goes out. Count the ships every night. If the radio says your name, don't answer. | OIL / FOOD / SHIPS | Night 47: one more ship than yesterday, and it isn't on any chart since 1952. | idea |
| 3 | **Snowed In: Day 1 to Day 180** | Never open the door after dark. Keep the stove burning. Never follow the footprints. | WOOD / FOOD / TEMP | Day 9: footprints lead up to the door. None lead away. | idea |
| 4 | **The Endless Train: Stop 1 to Stop 365** | Never go back a car. Show your ticket only to the conductor. Never get off at a stop with no name. | CARS / FOOD / TICKETS | Stop 12: the train stops at a station with no name, and the doors open by themselves. | idea |
| 5 | **Grandma's Island: Day 1 to Day 365** | One envelope a day. Never cross the stone wall. If a boat comes, don't let them land. | WATER / FOOD / TIDE | Day 30: a boat comes; the man says Grandma sent him. She died 10 years ago. | idea |
