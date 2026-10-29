// Step 5 — your machine renders it. Steps the scene frame by frame in headless Chromium,
// draws the narration subtitles in a second (fast, transparent) pass, mixes the soundtrack
// with the voice and encodes a 1080x1920 MP4 ready for TikTok/Reels/Shorts.
//
//   node engine/render.mjs <video> [--workers 3] [--fps 30] [--dpr 2] [--resume] [--encode-only]
//
// --resume       keep frames already on disk (continue an interrupted render)
// --encode-only  reuse the 3D frames; redo subtitles, audio and the MP4 (e.g. after new narration)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { startServer, ROOT } from './server.mjs';
import { launch, openPlayer, frame, args } from './browser.mjs';
import { buildAudio } from './audio.mjs';

const a = args(process.argv.slice(2));
const video = a._[0];
if (!video) { console.error('usage: node engine/render.mjs <video> [--workers N] [--fps 30] [--resume] [--encode-only]'); process.exit(1); }
const outDir = path.join(ROOT, 'out', video);
const framesDir = path.join(outDir, 'frames');
const subsDir = path.join(outDir, 'subs');
const encodeOnly = Boolean(a['encode-only']);
if (!a.resume && !encodeOnly) fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const voiceFile = path.join(ROOT, 'videos', video, 'voice.json');
const voice = fs.existsSync(voiceFile) ? JSON.parse(fs.readFileSync(voiceFile, 'utf8')) : null;

const { server, url } = await startServer();
const browser = await launch();
const workers = Number(a.workers || Math.max(1, Math.min(4, Math.floor(os.cpus().length / 2))));
const dpr = Number(a.dpr || 2);

const first = await openPlayer(browser, url, video, { dpr, extra: '&nosubs' });
const { config, audio } = first.info;
const fps = Number(a.fps || config.fps);
const total = Math.round(config.duration * fps);
const name = (dir, i, ext) => path.join(dir, `${String(i).padStart(5, '0')}.${ext}`);
const progress = (label, done, t0) => {
  const el = (Date.now() - t0) / 1000, eta = (el / Math.max(1, done)) * (total - done);
  process.stdout.write(`\r  ${label} ${String(done).padStart(String(total).length)} / ${total} frames  ·  ${el.toFixed(0)}s elapsed  ·  ~${eta.toFixed(0)}s left   `);
};

// ---- pass 1: the 3D scene with its overlays (no subtitles)
if (!encodeOnly) {
  const pages = [first, ...(await Promise.all(Array.from({ length: workers - 1 }, () => openPlayer(browser, url, video, { dpr, extra: '&nosubs' }))))];
  console.log(`${video}: ${total} frames @ ${fps} fps, ${first.info.size.join('x')}, ${workers} worker(s)`);
  let done = 0;
  const t0 = Date.now();
  await Promise.all(pages.map(async ({ page }, w) => {
    for (let i = w; i < total; i += workers) {
      if (!(a.resume && fs.existsSync(name(framesDir, i, 'jpg')))) fs.writeFileSync(name(framesDir, i, 'jpg'), await frame(page, i / fps, { quality: 95 }));
      done++;
      progress('rendering', done, t0);
    }
  }));
  const errors = pages.flatMap((p) => p.errors);
  if (errors.length) console.warn('\npage errors:\n' + errors.map((e) => e.message).join('\n'));
  console.log(`\n  frames done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

// ---- pass 2: subtitles on a transparent page
if (voice) {
  fs.rmSync(subsDir, { recursive: true, force: true });
  fs.mkdirSync(subsDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: dpr });
  await page.goto(`${url}/engine/subs.html?video=${encodeURIComponent(video)}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  // an empty frame is the same transparent image every time: write it once, link the rest
  const blank = path.join(subsDir, 'blank.png');
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const shown = await page.evaluate((t) => window.__subs.renderAt(t), i / fps);
    if (shown) fs.writeFileSync(name(subsDir, i, 'png'), await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: 540, height: 960 } }));
    else {
      if (!fs.existsSync(blank)) fs.writeFileSync(blank, await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: 540, height: 960 } }));
      fs.copyFileSync(blank, name(subsDir, i, 'png'));
    }
    if (i % 30 === 0) progress('subtitles', i + 1, t0);
  }
  console.log('');
} else {
  console.warn('  (no voice.json: no narration or subtitles; run node engine/voice.mjs first)');
}
await browser.close();
server.close();

// ---- audio + encode
const wav = path.join(outDir, 'audio.wav');
const mp4 = path.join(ROOT, 'out', `${video}.mp4`);
const enc = ['-v', 'error', '-y', '-framerate', String(fps), '-i', path.join(framesDir, '%05d.jpg')];
if (voice) enc.push('-framerate', String(fps), '-i', path.join(subsDir, '%05d.png'));
if (audio.length || voice) {
  buildAudio(audio, config.duration, wav, voice, path.join(ROOT, 'videos', video));
  enc.push('-i', wav, '-c:a', 'aac', '-b:a', '192k');
}
if (voice) enc.push('-filter_complex', '[0:v][1:v]overlay=0:0:format=auto[v]', '-map', '[v]', '-map', '2:a');
enc.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-t', String(config.duration), mp4);
execFileSync('ffmpeg', enc);
console.log(`  wrote ${path.relative(process.cwd(), mp4)} (${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB)`);
