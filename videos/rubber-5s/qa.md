# QA: what Claude caught in its own frames (step 4)

Each round: `npm run check` → look at the contact sheet → fix → repeat.

| Round | Found | Fix |
|---|---|---|
| 1 | At t=0 the camera starts **inside a building** (x=58 is inside a block). | All camera keys stay inside the open corridor x −26..28. |
| 1 | From 3.6–10s the cars look **like they're flying** and the ground is beige. Cause: the Catmull-Rom curve overshoots between two street-level keys and **dips the camera underground** (y≈−2.3). | `cameraPath` switched to monotone PCHIP, which can't overshoot a keyframe. |
| 1 | The phone covers half the frame. | Smaller, in the lower right, tilted. |
| 1 | The plaza is washed out orange. | Point lights dropped from 900 to 320, exposure 0.95. |
| 1 | The countdown is unreadable against the billboards. | The timer got a dark panel and a larger label. |
| 1 | A street lamp runs vertically through the middle of the eye-level shot. | `clear` option in `timesSquare` to remove lamps around the camera. |
| 2 | **The main event isn't visible.** Tires and the 13 cm drop are too small at 20–40 m. | Added a `follow` camera at wheel height on a yellow cab chosen automatically (lane next to the plaza, 6 m ahead at 5.0s, room to stop). |
| 3 | The wheel camera is too close: just a black disc, and the yellow body looks dark olive. | Pulled back to a 3/4 front view (fov 40), plus a soft key light only in the close-ups. |
| 3 | The air-burst puff fills the frame with white. | Size and alpha halved. |
| 3 | Sparks are barely visible. | Higher rate near the camera (320/s), brighter color, minimum size of 3 px. |
| 4 | The flat tire looks like a normal tire (round ellipse). | Real flat shape: the rim is 4 cm off the ground, the sidewall is squashed at the bottom and bulges. |
| 4 | The flat tire is wider than the rim, so the **rim face disappears** inside it. | `squashX` reduced from 1.18 to 1.04. |
| 4 | Nothing tells the viewer what to look at. | Red ring and label (`−13 cm`, `0 PSI`) that tracks the wheel every frame. |
| 4 | The fact card covers the wheel. | The look target is lower (the wheel sits higher in frame), and the card moved down to 690 during the close-up. |
| 5 | The title appears only from 0.15s, so the first frame (the thumbnail) has no title. | The title is visible from frame 0. |
| 5 | Sound: dynamic loudnorm flattened the burst at 5.0s to the level of the background noise. | Static gain to −14 LUFS and a limiter. The waveform now peaks at 5.0 / 10.0 / 10.95. |
