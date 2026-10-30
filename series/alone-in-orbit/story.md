# Alone in Orbit Ep 01: Day 1 to Day 365

14 parts of 1.5–2 min (2 uploads a day for a week). Each part stops at its most interesting
moment; the next part opens on the last ~3 seconds of the previous one (same lines, same shots).
First person, one narrator (Kokoro voice 1: `bm_fable*0.6+am_michael*0.4`, en-us, speed 1.06);
other people's words are read by the narrator or shown as writing (letters, Morse, screens).
Tone: suspense and mystery, no gore, no jump scares. The ending is fully closed. The explanation
is human and realistic: no aliens, no ghosts.

Parts live in `videos/orbit-01` … `videos/orbit-14`; drawing code in `engine/lib/toon.js` and
the series' reusable shots in `engine/lib/orbit.js`.

## People
- **Me: Sam Cole**, flight engineer, side A. Adult, calm, practical. Dark messy hair.
- **Commander Hale**: station commander (both halves). Gray flat-top, mustache. Was ordered to run the study, hated it, wrote both letters, and hid the truth in his envelopes.
- **Ortiz**: pilot, side A, curly hair. Leaves with Hale on Day 1. Believes the leak was real.
- **Mara Lind**: mission specialist, side B (Module 3). Ponytail. Got the same story from the other side.
- **Larkspur Orbital**: the (fictional) company that owns Larkspur Station and runs Project SOLO.
- **Inés Hale**: Hale's daughter, a radio amateur in Chile. Hale asked her to listen for Larkspur every night, without telling her why.

## The truth (all of it is revealed by Part 12; nothing before contradicts it)
Larkspur Station has two halves joined at Hatch 3, three crew on each side. Larkspur Orbital is
secretly testing how people cope with a year of isolation, and whether they obey a voice of
authority, to sell the data to a Mars program. That's **Project SOLO**.
- **Day 1:** a fake ammonia-leak alarm sounds in both halves. Each half evacuates in its own capsule. Each capsule has one seat tagged NO GO, so one person stays on each side: Sam on side A, Mara on side B. Each is told the other half was vented and that "everyone on that side is gone".
- **The gauges** on both sides of Hatch 3 are fakes, wired to read zero.
- **One oxygen tank** feeds the whole station through the pipes in the node, so both of them breathe from it: 1.7 kg a day instead of ~0.85.
- **Ground** answers only "Ground copies. Continue."
- **Channel 9** is the station's internal intercom. The company uses it for the obedience test: "This is Ground. Open Hatch 3."
- **Hidden cameras** in the smoke detectors watch both.
- **Hale** was ordered to write the rules. He wrote rule 2 (the numbers) and the twelve envelopes so they would find each other, and booked two seats on the Day 365 ship himself.
- **After Day 240**, when they break the protocol, the company cancels the return flight and moves the station's deorbit (its "decommissioning", already announced to the public as an empty station) to Day 360.

## Hale's letter (Day 1)
> Three rules.
> 1. Never open Hatch 3. Not for anyone. Not even for me.
> 2. Every morning, check three numbers. Oxygen. Water. Power.
> 3. Talk to Ground only on channel 4. If anything calls on channel 9, don't answer.
>
> Twelve envelopes. One a month. Never early. — Hale

## The twelve envelopes (exact text; opened on Day 30, 60, … 360)
| # | Day | Text | Part |
|---|---|---|---|
| 1 | 30 | Write the numbers down. By hand. | 1 |
| 2 | 60 | If the numbers and Ground ever disagree, trust the numbers. | 2 |
| 3 | 90 | Channel 9. Don't answer. Whatever it says. *(underlined twice)* | 4 |
| 4 | 120 | Panel 12. The oxygen generator. You'll need it sooner than they told you. | 5 |
| 5 | 150 | If the power ever fails: suit 2. It's the good one. | 5 |
| 6 | 180 | If you've found each other, don't say it out loud. They're watching. | 8 |
| 7 | 210 | Locker 7. Two spare scrubber cartridges. You'll know who needs them. | 9 |
| 8 | 240 | By now you know you're not alone. I'm sorry. I couldn't stop it. | 9 |
| 9 | 270 | If they cancel the flight, open twelve. Don't wait. | 12 |
| 12 | 270 (early) | The confession (below). | 12 |
| 10 | 300 | Keep talking to her. Every pass. | 13 |
| 11 | 330 | Two seats on the next ship. I made sure. | 13 |

Envelope 12 (read in Part 12):
> Sam, Mara. The leak was fake. The gauges are fake. Larkspur Orbital calls it Project SOLO:
> two people, each told they're alone, for one year. I was ordered to write your rules.
> I wrote rule two so you'd find each other. If they leave you up there, call 145.800 at
> night when you pass over Chile. My daughter listens. — Hale

## The numbers (rule 2), so every screen agrees
- **Oxygen tank:** 312.0 kg on Day 3, then −1.7 kg a day (two people): Day 30 266.1 · Day 40 249.1 · Day 61 213.4 · Day 88 167.5 · Day 104 140.3 · Day 120 113.1. At that rate it's empty on **Day 186**. From Day 120 the oxygen generator (Part 5) makes oxygen from water, so the tank holds at ~113 kg while there's power.
- **Water:** 97% on Day 3, −0.2% a day; from Day 120 (generator on) −0.3% a day: Day 40 89.6 · Day 61 85.4 · Day 104 76.8 · Day 120 73.6 · Day 151 64.3 · Day 240 37.6 · Day 300 19.6 · Day 330 10.6 · Day 360 1.6.
- **Power:** 100% (solar) until Day 151: the main array jams, 31%, lights out. After the spacewalk: 96%.
- **Oxygen per person:** "less than one kilo a day" (sources below).

## Parts: exact plot
Each part lists what it opens on (the repeat of the previous part's last ~3 s), the beats with
their key lines, and the exact last line.

### Part 1 · Days 1–40 · made (`videos/orbit-01`)
Hook ("For one year, I lived alone on a space station. At least, that's what they told me.").
Day 1 alarm, ammonia leak in Module 3, Hale seals Hatch 3 ("everyone on that side is gone"),
the gauge drops to zero, the capsule's NO GO seat, "two could leave, one had to stay", next ship
in 365 days, Hale's letter, the capsule undocks. Day 2+: "Ground copies. Continue." The morning
numbers (312 kg, 97%, 100). Day 30, envelope 1. The notebook: the tank loses 1.7 kg a day, "As if
someone else was breathing my air." Ground copies. Day 40, 3 a.m.: Knock. Knock. Knock.
**Ends:** "It came from Hatch 3. From a room with no air."

### Part 2 · Days 40–61
**Opens on:** "It came from Hatch 3. From a room with no air."
1. He floats to the hatch with a flashlight. Silence. The gauge: zero. He doesn't sleep.
2. Morning, channel 4: "Ground, I heard knocking from Module 3." Ground, for the first time more than three words: "Thermal expansion. Ignore it. Continue."
3. True, as far as it goes: a lap takes 90 minutes, sun then shadow every 45 minutes, and the metal creaks. "But metal doesn't knock three times."
4. Day 41, 03:00: three knocks. Day 42, 03:00: three knocks. Day 43, 44, 45… every night, exactly at three.
5. The oxygen math: "At 1.7 kilos a day, the tank would be empty on Day 186. The next ship comes on Day 365."
6. Day 60, envelope 2: "If the numbers and Ground ever disagree, trust the numbers." The numbers said someone was breathing. Ground said he was alone.
7. Day 61, 02:59. Awake this time, waiting at the hatch. 03:00: nothing. 03:07: knocks again, but different.
**Ends:** "Three short. Three long. Three short. And I knew exactly what it meant."

### Part 3 · Days 61–88
**Opens on:** "Three short. Three long. Three short. And I knew exactly what it meant."
1. He writes it down: ··· ––– ··· = S. O. S. "Someone on the other side of that hatch was asking for help."
2. Rule 1 flashes: "Never open Hatch 3. Not for anyone. Not even for me."
3. "If I opened it and there really was no air, the station would empty in seconds. And so would I." His hand on the wheel; he lets go.
4. SOS every night for nine nights. He doesn't answer. "I told myself it was a trick. I didn't believe it."
5. Day 70: no knocks. Day 71, 72… nothing. "Whoever it was had stopped asking."
6. But the tank still lost 1.7 kilos a day: "They'd stopped knocking. They hadn't stopped breathing."
7. Day 88: he decides to check the one thing that says there's no air. Takes the gauge panel off (four screws). A gauge needs a sensor on the other side of the wall, and a wire that brings the number here. He follows the wire with his flashlight.
**Ends:** "The wire went into the wall. And stopped. The gauge was never connected to anything."

### Part 4 · Days 88–104
**Opens on:** "The wire went into the wall. And stopped. The gauge was never connected to anything."
1. "Someone made that needle point to zero." So behind Hatch 3 there might be air. And someone might be alive.
2. He reports it on channel 4: "Ground, the Hatch 3 gauge is a fake." "Ground copies. Continue."
3. Day 90, envelope 3: "Channel 9. Don't answer. Whatever it says." Underlined twice. "Why would Hale write the same rule twice? Unless he knew something would call."
4. He puts it together: Hale wrote rule 1. Hale wrote "trust the numbers". Did Hale know?
5. Nights at the hatch, ear on the metal. Nothing. Day 100, the calendar: Day 186 circled in red. Oxygen 147 kg.
6. Day 104, 19:00. A light he had never seen lit before: the channel 9 lamp. The radio clicks. Ground has never used channel 9. Ground has never said more than a few words.
**Ends:** "This is Ground. Open Hatch 3."

### Part 5 · Days 104–151
**Opens on:** the channel 9 lamp, "This is Ground. Open Hatch 3."
1. He doesn't answer (rule 3). The voice again: "Cole. Open Hatch 3." It knows his name.
2. Every day at 19:00, the same call. He asks Ground on channel 4: "Did you call me on channel 9?" "Ground copies. Continue."
3. The station manual: channel 9 is the intercom between modules. It doesn't reach Earth. "Whoever was calling was wired into this station."
4. Day 120, envelope 4: "Panel 12. The oxygen generator. You'll need it sooner than they told you." Behind panel 12, a machine that splits water into oxygen. He turns it on. The oxygen stops falling. The water starts falling faster.
5. Day 150, envelope 5: "If the power ever fails: suit 2. It's the good one." He checks suit 2.
6. Day 151, 06:00 numbers: oxygen 113, water 64, power 31%. The main solar array has stopped turning. No power, no oxygen generator. "Without the generator, the oxygen would last sixty-six days. The ship was two hundred fourteen days away."
**Ends:** "Then the lights went out."

### Part 6 · Day 151
**Opens on:** "POWER 31%. Then the lights went out."
1. Emergency lights. The fans winding down. "On a space station, silence is the sound of something dying."
2. Suit 2, from envelope 5. Before a spacewalk you breathe pure oxygen for hours, or the nitrogen in your blood fizzes like soda.
3. The airlock. Alone, against every rule of spacewalking: never go out alone.
4. Outside: the Earth, the truss, his tether. Sixteen sunrises a day; he works through one sunset in the dark.
5. The array's joint is jammed by a torn insulation blanket. He cuts it free. The array turns toward the sun. Power: 96%.
6. Back along the truss, past Module 3's window, which should be dark.
**Ends:** "There was a light on in Module 3. And a shadow moved."

### Part 7 · Days 151–152
**Opens on:** "There was a light on in Module 3. And a shadow moved."
1. He pulls himself to the window. Inside: a woman, floating, writing in a notebook. A notebook like his: numbers.
2. She looks up. Sees a spacesuit at her window. Both freeze. Her hand on the glass.
3. She writes on a page and holds it up: "WHO ARE YOU?" He points at the name on his chest: COLE.
4. The sun sets; the window goes dark. Back inside, he can't stop shaking. "She was real. She'd been real for 151 days."
5. Day 152, 03:00: three knocks. This time he knocks back. Three. Silence. Then Morse, slow. He writes each letter down: T-H-E-Y. T-O-L-D. M-E.
**Ends:** "They told me you were dead."

### Part 8 · Days 152–180
**Opens on:** the Morse page, "They told me you were dead."
1. Every night, Morse through the hatch, one letter at a time. Her name: Mara Lind.
2. Her Day 1: the same alarm, the same leak, a capsule with a NO GO seat. Her commander said: everyone on that side is gone. Her gauge reads zero.
3. Her letter: three rules. "Never open Hatch 3. Not for anyone." Same words. Same handwriting. Signed: Hale.
4. She knocked for thirty nights and nobody answered. "I thought I was going crazy." She stopped on Day 70.
5. Her numbers: the same tank, the same 1.7 kilos. She'd done the same math.
6. Day 180, envelope 6: "If you've found each other, don't say it out loud. They're watching."
**Ends:** Mara knocks: "There is a camera in my room." He looks up at the smoke detector over his bunk. "A tiny red light."

### Part 9 · Days 180–240
**Opens on:** "There is a camera in my room." The red light over his bunk.
1. They're watched. For the cameras, they act alone. They talk only at night, in the dark, in Morse: on a recording it's the metal creaking.
2. Channel 9 again: "This is Ground. Open Hatch 3." Now he understands: it's a test, of whether they'll obey. They give the voice nothing.
3. Day 210, envelope 7: "Locker 7. Two spare scrubber cartridges. You'll know who needs them." Two cartridges, on his side.
4. Days 220–239: Mara's knocks get slower. Spelling mistakes. A scrubber pulls CO2 out of the air; when it fails, CO2 brings headaches, then confusion, then sleep.
5. Day 240, envelope 8: "By now you know you're not alone. I'm sorry. I couldn't stop it."
6. That night, three letters, very slow.
**Ends:** "C. O. 2. Her scrubber had failed."

### Part 10 · Day 240
**Opens on:** "C. O. 2. Her scrubber had failed."
1. The spare cartridges are in locker 7, on his side. To give her one, he has to open Hatch 3. Rule 1.
2. He knocks: nothing comes back. "Mara?" Nothing.
3. If the gauge lied about the air, it might be lying about anything. If the room is vacuum, opening the hatch kills them both.
4. The equalization valve: a small valve in the hatch that lets air through slowly before you open it. If there's vacuum behind it, it roars, and you close it.
5. He turns it. A soft hiss. Then nothing. "The pressure was equal. There was air on the other side."
6. Rule 1. Not for anyone. Not even for me. He spins the wheel anyway.
**Ends:** "The hatch opened. It was dark inside. And she wasn't moving."

### Part 11 · Days 240–260
**Opens on:** "The hatch opened. It was dark inside. And she wasn't moving."
1. He pulls her through to his side, into fresh air, and pushes a cartridge into her scrubber.
2. Long minutes. Then she breathes deeper. Opens her eyes. First words, out loud, after 240 days: "You're real."
3. Her half is a mirror of his: the same sleeping bag, the same notebook, the same letter.
4. They follow the camera cables behind a panel to a recorder: PROJECT SOLO. SUBJECT A: COLE. SUBJECT B: LIND. Channel 9 prompts logged: 48. Refused: 48.
5. A new line appears on the recorder while they watch: DAY 240: PROTOCOL BREACH.
**Ends:** the screen: "STUDY COMPROMISED. CANCEL RETURN FLIGHT." "No one was coming."

### Part 12 · Days 260–300
**Opens on:** "STUDY COMPROMISED. CANCEL RETURN FLIGHT." "No one was coming."
1. Two people on one person's supplies, and no ship. Water 31%.
2. Mara: open envelope twelve. Sam: never early. They argue for days.
3. Day 270, envelope 9: "If they cancel the flight, open twelve. Don't wait." Hale saw it coming.
4. Envelope 12, the confession (text above): the fake leak, the fake gauges, Project SOLO, "I wrote rule two so you'd find each other." And a frequency: 145.800. "My daughter listens."
5. They rig the station's ham radio and an antenna. They can only reach Chile for about ten minutes, when they pass over it. Pass after pass: static.
6. Day 300, the night pass over Chile. Static, then a voice.
**Ends:** "Larkspur? My father told me to listen for you. But that station is empty. It burns up in sixty days."

### Part 13 · Days 300–360
**Opens on:** the voice: "…that station is empty. It burns up in sixty days."
1. Inés Hale. The company told the world Larkspur was empty and would be brought down on Day 360.
2. Envelope 10 (Day 300): "Keep talking to her. Every pass." Every pass they talk; Inés records everything.
3. She posts the recordings. People call them fake. Then a tracking amateur photographs the station: its lights are on. Then Hale goes public.
4. Day 330, envelope 11: "Two seats on the next ship. I made sure." The numbers: water 10%.
5. Day 359, Inés: a rescue launch is coming. Five days.
**Ends:** Day 360, the station shakes; the engines fire on their own. The deorbit burn. "We were coming down."

### Part 14 · Days 360–365
**Opens on:** the engines firing. "We were coming down."
1. Sam is the flight engineer: he knows where the thruster breakers are. Mara reads him the panel numbers; he pulls them by hand, one after another.
2. The engines stop. Lower orbit, but up. "Low enough to fall in weeks. High enough for five days."
3. Days 361–364: water 1.6%. Half rations. They talk out loud all day.
4. Day 365. A capsule docks at the front port. Someone knocks: three knocks.
5. Rule 1 echo: "Not for anyone. Not even for me." He opens it anyway. Hale.
6. Hale: "You followed rule two." Two seats. Home. Larkspur Orbital is exposed, with Inés's recordings and Hale's testimony.
**Ends (closed):** "For one year, I lived alone on a space station. That's what they told me. I was never alone. Neither was she."

## Real-world details used
- A low orbit like the ISS's is ~400 km (~250 miles) up and one lap takes ~90 minutes: ~45 minutes of sun and ~45 of shadow, ~16 sunrises a day (NASA ISS facts: https://www.nasa.gov/international-space-station/space-station-facts-and-figures/; nasa.gov is blocked in this environment, so the page wasn't re-checked here).
- Oxygen per person per day: published figures run 0.8–0.98 kg (0.84 kg in NASA-STD-3001/BVAD-based tables, 0.816 kg in life-support calculators, 0.98 kg in an MIT study), so the narration says "less than one kilo", and 1.7 kg a day is about two people. Sources: https://apu.edu/files/cris_lunar_life.pdf, https://lifesupportcalc.neocities.org/, https://web.mit.edu/12.000/www/finalpresentation/environment/awn.html
- Orbiting metal creaks as it heats and cools between sun and shadow (Part 2).
- Stations make oxygen by splitting water (electrolysis), so oxygen made means water used (Part 5).
- Before a spacewalk astronauts breathe pure oxygen for hours to avoid decompression sickness (Part 6).
- Hatches have a small equalization valve to match the pressure before opening (Part 10).
- High CO2 brings headaches, confusion, then drowsiness; scrubbers remove it (Parts 9–10).
- Ham radio on the ISS lets astronauts talk to people on the ground on 145.800 MHz, for a few minutes per pass (ARISS: https://www.ariss.org/) (Parts 12–13).
