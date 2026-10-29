// Timed text overlays (HTML over the WebGL canvas, captured with it).
// Every element's look is a pure function of t, like the 3D scene.
import { clamp, smoothstep, easeOutBack, easeOutCubic } from './util.js';

const h = (cls, html = '') => {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  return el;
};

export class Overlay {
  constructor(root) {
    this.root = root;
    this.items = [];
  }

  /** enter: 'rise' | 'pop' | 'fade' */
  add(el, { from = 0, to = Infinity, fadeIn = 0.25, fadeOut = 0.25, enter = 'rise', render } = {}) {
    this.root.appendChild(el);
    this.items.push({ el, from, to, fadeIn, fadeOut, enter, render });
    return el;
  }

  update(t) {
    for (const it of this.items) {
      const aIn = fadeIn(it, t);
      const aOut = it.fadeOut > 0 ? 1 - smoothstep(it.to - it.fadeOut, it.to, t) : t < it.to ? 1 : 0;
      const a = aIn * aOut;
      it.el.style.visibility = a > 0.002 ? 'visible' : 'hidden';
      it.el.style.opacity = it.enter === 'none' ? (a > 0.002 ? 1 : 0) : a;
      if (it.enter === 'rise') it.el.style.transform = `translateY(${(1 - easeOutCubic(aIn)) * 18}px)`;
      if (it.enter === 'pop') it.el.style.transform = `scale(${0.6 + 0.4 * easeOutBack(aIn)})`;
      if (a > 0.002 && it.render) it.render(t, it.el, t - it.from);
    }
  }

  title(html, opts) { return this.add(h('ov-title', html), { fadeIn: 0.4, ...opts }); }

  /** label(t) / value(t) return strings; mode(t) returns '', 'gone' or 'back' */
  timer({ label, value, mode = () => '', ...opts }) {
    const el = h('ov-timer', '<div class="lbl"></div><div class="val"></div>');
    const [lbl, val] = el.children;
    return this.add(el, {
      ...opts,
      render: (t) => {
        lbl.textContent = label(t);
        val.innerHTML = value(t);
        el.className = `ov-timer ${mode(t)}`;
      },
    });
  }

  fact({ kicker = 'Fact', text, source, badge = 'source ✓', top, ...opts }) {
    const el = h('ov-fact', `<div class="kick"><span>${kicker}</span><span class="badge">${badge}</span></div><div class="txt">${text}</div>${source ? `<div class="src">${source}</div>` : ''}`);
    if (top != null) el.style.top = `${top}px`;
    return this.add(el, { enter: 'rise', ...opts });
  }

  caption(html, { top, ...opts } = {}) {
    const el = h('ov-caption', html);
    if (top != null) el.style.top = `${top}px`;
    return this.add(el, { enter: 'pop', fadeIn: 0.22, ...opts });
  }

  counter({ label, countTo, countDur = 1.2, ...opts }) {
    const el = h('ov-counter', `<div class="box"><div class="lbl">${label}</div><div class="val">0</div></div>`);
    const val = el.querySelector('.val');
    return this.add(el, {
      enter: 'pop', ...opts,
      render: (t, _el, local) => { val.textContent = Math.round(countTo * easeOutCubic(clamp(local / countDur))).toLocaleString('en-US'); },
    });
  }

  flash(at, dur = 0.2, peak = 0.85) {
    const el = h('ov-flash');
    return this.add(el, {
      from: at, to: at + dur, fadeIn: 0, fadeOut: 0, enter: 'none',
      render: (t) => { el.style.opacity = peak * Math.pow(1 - clamp((t - at) / dur), 2); },
    });
  }

  /** A ring + label pinned to a point in the 3D scene; move it each frame with place(). */
  tag(label, opts) {
    const el = h('ov-tag', `<div class="ring"></div><div class="lbl">${label}</div>`);
    return this.add(el, { enter: 'pop', fadeIn: 0.18, ...opts });
  }

  place(el, x, y, r) {
    el.style.left = `${x - r}px`;
    el.style.top = `${y - r}px`;
    el.style.width = el.style.height = `${2 * r}px`;
  }

  end(html, opts) { return this.add(h('ov-end', html), { enter: 'rise', ...opts }); }
  handle(text) { return this.add(h('ov-handle', text), { from: 0, fadeIn: 0 }); }
}

function fadeIn(it, t) {
  if (it.fadeIn <= 0) return t >= it.from ? 1 : 0;
  return smoothstep(it.from, it.from + it.fadeIn, t);
}
