// Word-by-word subtitles synced to the narration (voice.json from engine/voice.py).
// Shows short chunks of a line; the word being spoken lights up, *marked* words stay lit.
import { clamp, easeOutBack } from './util.js';

function chunk(words, maxWords, maxChars) {
  const out = [];
  let cur = [];
  for (const w of words) {
    const len = cur.reduce((a, x) => a + x.text.length + 1, 0) + w.text.length;
    if (cur.length && (cur.length >= maxWords || len > maxChars)) { out.push(cur); cur = []; }
    cur.push(w);
    if (/[.,!?;:]$/.test(w.text)) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out;
}

export class Subtitles {
  constructor(root, voice, { top = 636, maxWords = 3, maxChars = 18, hide = [], className = '' } = {}) {
    this.el = document.createElement('div');
    this.el.className = `ov-sub ${className}`.trim(); // e.g. 'one': the series' single white word
    this.el.style.top = `${top}px`;
    root.appendChild(this.el);
    this.hide = hide; // [[from, to]] ranges where subtitles step aside (e.g. full-screen cards)
    this.chunks = voice.lines.flatMap((line) => chunk(line.words, maxWords, maxChars).map((ws) => ({
      words: ws.map((w) => ({ ...w, start: line.at + w.start, end: line.at + w.end })),
      start: line.at + ws[0].start,
      end: line.at + ws[ws.length - 1].end,
    })));
    // a chunk stays up until the next one starts (or briefly after its line ends)
    this.chunks.forEach((c, i) => { c.until = Math.min(this.chunks[i + 1]?.start ?? Infinity, c.end + 0.35); });
    this.shown = null;
  }

  update(t) {
    const c = this.hide.some(([a, b]) => t >= a && t < b) ? null : this.chunks.find((x) => t >= x.start - 0.04 && t < x.until);
    this.el.style.visibility = c ? 'visible' : 'hidden';
    if (!c) return;
    if (this.shown !== c) {
      this.el.innerHTML = c.words.map((w) => `<span>${w.text}</span>`).join(' ');
      this.shown = c;
    }
    const spans = this.el.children;
    c.words.forEach((w, i) => { spans[i].className = w.hl || (t >= w.start && t < w.end + 0.05) ? 'on' : ''; });
    const u = clamp((t - c.start + 0.04) / 0.12);
    this.el.style.transform = `scale(${0.85 + 0.15 * easeOutBack(u)})`;
  }
}
