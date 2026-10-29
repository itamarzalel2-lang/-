// Step 5 — your machine renders it. Steps the scene frame by frame in headless Chromium,
// synthesises the soundtrack and encodes a 1080x1920 MP4 ready for TikTok/Reels/Shorts.
//
//   node engine/render.mjs <video> [--workers 3] [--fps 30] [--dpr 2] [--resume]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { startServer, ROOT } from './server.mjs';
import { launch, openPlayer, frame, args } from './browser.mjs';
import { buildAudio } from './audio.mjs';

const a = args(process.argv.slice(2));
const video = a._[0];
if (!video) { console.error('usage: node engine/render.mjs <video> [--workers N] [--fps 30] [--resume]'); process.exit(1); }
const outDir = path.join(ROOT, 'out', video);
const framesDir = path.join(outDir, 'frames');
if (!a.resume) fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const { server, url } = await startServer();
const browser = await launch();
const workers = Number(a.workers || Math.max(1, Math.min(4, Math.floor(os.cpus().length / 2))));
const dpr = Number(a.dpr || 2);

const first = await openPlayer(browser, url, video, { dpr });
const { config, audio } = first.info;
const fps = Number(a.fps || config.fps);
const total = Math.round(config.duration * fps);
const pages = [first, ...(await Promise.all(Array.from({ length: workers - 1 }, () => openPlayer(browser, url, video, { dpr }))))];

const name = (i) => path.join(framesDir, `${String(i).padStart(5, '0')}.jpg`);
let done = 0;
const t0 = Date.now();
const log = () => {
  const el = (Date.now() - t0) / 1000, eta = (el / Math.max(1, done)) * (total - done);
  process.stdout.write(`\r  rendering ${String(done).padStart(String(total).length)} / ${total} frames  ·  ${el.toFixed(0)}s elapsed  ·  ~${eta.toFixed(0)}s left   `);
};
console.log(`${video}: ${total} frames @ ${fps} fps, ${first.info.size.join('x')}, ${workers} worker(s)`);
await Promise.all(pages.map(async ({ page }, w) => {
  for (let i = w; i < total; i += workers) {
    if (!(a.resume && fs.existsSync(name(i)))) fs.writeFileSync(name(i), await frame(page, i / fps, { quality: 95 }));
    done++;
    log();
  }
}));
const errors = pages.flatMap((p) => p.errors);
if (errors.length) console.warn('\npage errors:\n' + errors.map((e) => e.message).join('\n'));
await browser.close();
server.close();
console.log(`\n  frames done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);

const wav = path.join(outDir, 'audio.wav');
const mp4 = path.join(ROOT, 'out', `${video}.mp4`);
const enc = ['-v', 'error', '-y', '-framerate', String(fps), '-i', path.join(framesDir, '%05d.jpg')];
if (audio.length) {
  buildAudio(audio, config.duration, wav);
  enc.push('-i', wav, '-c:a', 'aac', '-b:a', '192k');
}
enc.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-t', String(config.duration), mp4);
execFileSync('ffmpeg', enc);
console.log(`  wrote ${path.relative(process.cwd(), mp4)} (${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB)`);
