// Step 4 — self-check. Renders stills (fast, half resolution) and tiles them into a
// contact sheet you (or Claude) can look at before spending time on the full render.
//
//   node engine/check.mjs <video> [--every 1] [--times 0,4.9,5.2] [--dpr 1]
//   node engine/check.mjs <video> --mp4 out/<video>.mp4      (sheet from a finished render)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { startServer, ROOT } from './server.mjs';
import { launch, openPlayer, frame, args } from './browser.mjs';

const a = args(process.argv.slice(2));
const video = a._[0];
if (!video) { console.error('usage: node engine/check.mjs <video> [--every 1] [--times a,b,c] [--mp4 file]'); process.exit(1); }
const dir = path.join(ROOT, 'out', video, 'check');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

let times;
if (a.mp4) {
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.mp4]).toString());
  const every = Number(a.every || 1);
  times = [];
  for (let t = 0.05; t < dur; t += every) times.push(t);
  times.forEach((t, i) => execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', a.mp4, '-frames:v', '1', '-vf', 'scale=540:-1', path.join(dir, `f${String(i).padStart(3, '0')}.jpg`)]));
} else {
  const { server, url } = await startServer();
  const browser = await launch();
  const dpr = Number(a.dpr || 1);
  const { page, info, errors } = await openPlayer(browser, url, video, { dpr });
  const D = info.config.duration;
  times = a.times ? String(a.times).split(',').map(Number) : [];
  if (!times.length) for (let t = 0; t < D; t += Number(a.every || 1)) times.push(+t.toFixed(3));
  for (const [i, t] of times.entries()) {
    const t0 = Date.now();
    fs.writeFileSync(path.join(dir, `f${String(i).padStart(3, '0')}.jpg`), await frame(page, t, { quality: 88 }));
    process.stdout.write(`  t=${t.toFixed(2)}s  ${Date.now() - t0} ms\n`);
  }
  if (errors.length) console.warn('page errors:\n' + errors.map((e) => e.message).join('\n'));
  await browser.close();
  server.close();
}

// label each still with its time, then tile
const cols = Math.min(6, times.length);
const labelled = times.map((t, i) => {
  const src = path.join(dir, `f${String(i).padStart(3, '0')}.jpg`);
  const dst = path.join(dir, `l${String(i).padStart(3, '0')}.jpg`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', `scale=360:-1,drawtext=text='${t.toFixed(2)}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6`, dst]);
  return dst;
});
const rows = Math.ceil(labelled.length / cols);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(dir, 'l%03d.jpg'), '-vf', `tile=${cols}x${rows}:padding=4:color=black`, '-frames:v', '1', path.join(dir, 'sheet.jpg')]);
console.log(`contact sheet: ${path.relative(process.cwd(), path.join(dir, 'sheet.jpg'))}`);
