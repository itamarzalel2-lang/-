// Live preview in your browser, with a scrubber:  node engine/preview.mjs <video> [--port 5173]
import { startServer } from './server.mjs';
import { args } from './browser.mjs';

const a = args(process.argv.slice(2));
const video = a._[0] || 'rubber-5s';
const { url } = await startServer(Number(a.port || 5173));
console.log(`\n  preview: ${url}/engine/player.html?video=${video}\n  (add &t=5 to jump to a time; Ctrl+C to stop)\n`);
