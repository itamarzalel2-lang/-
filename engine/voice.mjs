// Narration for a video:  node engine/voice.mjs <video>
// Runs engine/voice.py in the .venv made by engine/setup-voice.sh.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './server.mjs';

const video = process.argv[2];
if (!video) { console.error('usage: node engine/voice.mjs <video>'); process.exit(1); }
const py = path.join(ROOT, '.venv', 'bin', 'python');
if (!fs.existsSync(py)) { console.error('Run engine/setup-voice.sh first.'); process.exit(1); }
const r = spawnSync(py, [path.join(ROOT, 'engine', 'voice.py'), path.join(ROOT, 'videos', video)], { stdio: 'inherit' });
process.exit(r.status ?? 1);
