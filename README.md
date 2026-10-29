# What if… for 5 seconds? 🎬

<div dir="rtl">

סרטוני "What if X for 5 seconds?" אנכיים (1080×1920) – **לא AI video, אלא קוד**: סצנת Three.js שנבנית ונרנדרת פריים־פריים על המחשב שלך, עם סאונד שמסונתז ב־ffmpeg. בדיוק השיטה מהסרטון: שורה אחת → מקורות → קוד → Claude בודק את הפריימים של עצמו → המחשב מרנדר.

**הסרטונים** (כל אחד 38–43 שניות, עם קריינות וכתוביות; הקבצים ב־`out/<שם>.mp4`):

| סרטון | הטוויסט |
|---|---|
| `sun-5s` | לא קורה כלום, האור מגיע אחרי 8 דקות ו־20 שניות |
| `air-5s` | שקט מוחלט ושמיים שחורים בצהריים, הרוק על הלשון מתחיל לרתוח |
| `gravity-5s` | הקפיצים זורקים את המכוניות ~4 מ' לגובה |
| `square-wheels-5s` | גלגל מרובע מתגלגל חלק על כביש קטנריות |
| `blackout-5s` | הכוכבים שם, אבל העין צריכה 20–30 דקות |
| `plastic-5s` | ~57% מהבדים הם פוליאסטר, אז חצי מהקהל בלי מעיל |
| `rain-5s` | 1.26 מ' מים, מכוניות צפות |
| `moon-5s` | גאות פי 1000, אבל ב־5 שניות לא קורה כלום |
| `glass-5s` | חלונות זורמים, והמיתוס של חלונות הכנסיות |
| `friction-5s` | מי שהלך נופל, ומי שעמד במקום בסדר |
| `color-5s` | בלי קונוסים: סינוור, אדום נעלם, נקודה עיוורת במרכז |
| `snow-5s` | 76 ס"מ שלג = רק ~7.6 ס"מ מים |
| `paint-5s` | מכוניות פח, בלי קווי נתיב |
| `helium-5s` | הקולות "מתגבהים", יונים נופלות |

## איך מכינים סרטון חדש (עם Claude)

פשוט כותבים ל־Claude שורה אחת בריפו הזה, למשל:

> What if all glass turned to liquid for 5 seconds?

Claude עובד לפי `CLAUDE.md`: בודק אם הרעיון כבר פורסם, מוצא מקור לכל מספר (`sources.md`), כותב `scene.js`, מרנדר תמונות בדיקה ומסתכל עליהן בעצמו (`qa.md`), ומרנדר את ה־MP4.

## הרצה אצלך במחשב

</div>

```bash
npm install
npx playwright install chromium       # once

npm run preview -- rubber-5s          # live preview in the browser, with a scrubber
npm run check   -- rubber-5s          # contact sheet of stills → out/rubber-5s/check/sheet.jpg
npm run render  -- rubber-5s          # → out/rubber-5s.mp4 (1080×1920, 30fps, AAC)

bash engine/setup-voice.sh            # once: offline Kokoro voice (narration)
node engine/voice.mjs sun-5s          # script.json → voice/*.wav + voice.json
node engine/render.mjs sun-5s --encode-only   # new narration/text without re-rendering 3D
```

<div dir="rtl">

דרישות: Node 18+ ו־ffmpeg (`brew install ffmpeg` במק). במק עם GPU הרינדור מהיר בהרבה מאשר בשרת ענן בלי GPU.

## מבנה

</div>

```
CLAUDE.md                 the 5-step workflow Claude follows
ideas.md                  premise bank (made / idea / taken)
engine/
  player.html, player.js  loads videos/<name>/scene.js, renders any time t
  render.mjs              frame-by-frame capture → ffmpeg → MP4
  check.mjs               QA stills + contact sheet
  audio.mjs               synthesised sound design from cues (no samples)
  lib/city.js             timesSquare(): 36 blocks, lit billboards, lanes, crowd zones
  lib/traffic.js          352 instanced cars, analytic motion, collision-free braking, tyre states
  lib/crowd.js            pedestrians (they stop, flinch, turn; rubber soles)
  lib/fx.js               closed-form particles: rim sparks, skid smoke, air burst
  lib/camera.js           PCHIP camera paths, hard cuts, chase cam, handheld shake
  lib/overlay.js          title, countdown, sourced fact cards, captions, counter, 3D-pinned tags
videos/rubber-5s/
  premise.md  sources.md  scene.js  qa.md
out/rubber-5s.mp4         the rendered video
```
