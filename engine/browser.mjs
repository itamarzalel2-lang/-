// Shared: launch headless Chromium and open the player for a video.
import { createRequire } from 'node:module';
import os from 'node:os';

const require = createRequire(import.meta.url);

function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    throw new Error('Playwright is missing. Run: npm install && npx playwright install chromium');
  }
}

export async function launch() {
  const { chromium } = loadPlaywright();
  // Linux servers usually have no GPU: use SwiftShader (CPU WebGL). On a Mac/PC the GPU is used.
  const gpuless = os.platform() === 'linux' && !process.env.RENDER_GPU;
  const args = gpuless
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    : ['--ignore-gpu-blocklist', '--enable-gpu-rasterization'];
  return chromium.launch({ args });
}

export async function openPlayer(browser, baseUrl, video, { dpr = 2, extra = '' } = {}) {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: dpr });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e));
  // a missing voice.json just means "no narration yet"
  page.on('console', (m) => { if (m.type() === 'error' && !m.location()?.url?.endsWith('/voice.json')) errors.push(new Error(m.text())); });
  await page.goto(`${baseUrl}/engine/player.html?video=${encodeURIComponent(video)}&capture&dpr=${dpr}${extra}`);
  try {
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  } catch (e) {
    throw new Error(`player failed to start: ${errors.map((x) => x.message).join('\n') || e.message}`);
  }
  const info = await page.evaluate(() => ({ config: window.__player.config, audio: window.__player.audio, size: window.__player.size }));
  return { page, info, errors };
}

export async function frame(page, t, { type = 'jpeg', quality = 95 } = {}) {
  await page.evaluate((tt) => window.__player.renderAt(tt), t);
  return page.screenshot({ type, quality: type === 'jpeg' ? quality : undefined, clip: { x: 0, y: 0, width: 540, height: 960 } });
}

export function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      out[k] = v ?? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true);
    } else out._.push(a);
  }
  return out;
}
