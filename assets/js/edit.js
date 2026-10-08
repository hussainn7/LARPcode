// Click-to-edit for everything on the replica, plus heatmap painting.
import { store } from './state.js';
import { parseNumber, parseHour } from './format.js';
import { countActive, heatForActiveDays, visibleDays } from './stats.js';

const isEditing = () => document.body.classList.contains('editing');

// Brush for the heatmap: 'cycle' bumps a cell one level, 0-4 paints that level.
export const brush = { level: 'cycle' };

// ------------------------------------------------------------ inline text

const NUMERIC = new Set(['sessions', 'messages', 'tokens', 'activeDays']);

function commitStat(key, text) {
  store.update((s) => {
    if (key === 'fact') {
      const t = text.trim();
      if (t) { s.book = 'custom'; s.customFact = t; }
      return;
    }
    let val;
    if (NUMERIC.has(key)) {
      val = parseNumber(text);
      if (val === null) return;
      val = Math.round(val);
    } else if (key === 'peakHour') {
      val = parseHour(text);
      if (val === null) return;
    } else {
      val = text.trim();
      if (!val) return;
    }
    if (s.range !== 'all') {
      s.overrides[s.range][key] = val;
      return;
    }
    // Typing a new active-day count redraws the heatmap to match it.
    if (key === 'activeDays' && val !== s.stats.activeDays && val !== countActive(s.heat)) {
      s.heat = heatForActiveDays(val);
    }
    s.stats[key] = val;
  });
}

function commitField(el, text) {
  const t = text.replace(/\s+/g, ' ').trim();
  const key = el.dataset.edit;
  store.update((s) => {
    if (!t) return;
    if (key === 'section') s.sections[+el.dataset.si].name = t;
    else if (key === 'item') s.sections[+el.dataset.si].items[+el.dataset.ii].title = t;
    else if (key in s) s[key] = t;
  });
}

function startEditing(el) {
  if (el.isContentEditable) return;
  el.dataset.before = el.textContent;
  el.contentEditable = 'plaintext-only';
  if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
  el.spellcheck = false;
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function stopEditing(el, save) {
  const text = el.textContent;
  el.removeAttribute('contenteditable');
  getSelection().removeAllRanges();
  if (!save) el.textContent = el.dataset.before ?? text;
  delete el.dataset.before;
  if (el.dataset.stat) commitStat(el.dataset.stat, save ? text : '');
  else commitField(el, save ? text : '');
}

const editableTarget = (node) => node.closest?.('[data-stat], [data-edit]');

document.addEventListener('click', (e) => {
  if (!isEditing()) return;
  const el = editableTarget(e.target);
  if (!el || !document.getElementById('app').contains(el)) return;
  e.preventDefault();
  startEditing(el);
});

document.addEventListener('keydown', (e) => {
  const el = e.target;
  if (!el.isContentEditable || !editableTarget(el)) return;
  if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
  if (e.key === 'Escape') { e.preventDefault(); el.dataset.cancel = '1'; el.blur(); }
});

document.addEventListener('focusout', (e) => {
  const el = e.target;
  if (!el.isContentEditable || !editableTarget(el)) return;
  const cancel = el.dataset.cancel === '1';
  delete el.dataset.cancel;
  stopEditing(el, !cancel);
});

// Pasting rich text should never drag formatting into the replica.
document.addEventListener('paste', (e) => {
  const el = e.target.closest?.('[contenteditable]');
  if (!el || !editableTarget(el)) return;
  e.preventDefault();
  document.execCommand('insertText', false, e.clipboardData.getData('text/plain').replace(/\s+/g, ' '));
});

// ---------------------------------------------------------------- painting

let paint = null; // { level, before } while the pointer is down

function paintCell(cell) {
  const d = +cell.dataset.d;
  if (store.state.heat[d] === paint.level) return;
  store.update((s) => { s.heat[d] = paint.level; });
}

function endPaint() {
  if (!paint) return;
  // Keep "Active days" honest if it was in sync with the heatmap before.
  const { before } = paint;
  paint = null;
  store.update((s) => {
    if (s.stats.activeDays === before) s.stats.activeDays = countActive(s.heat, visibleDays());
  });
}

document.addEventListener('pointerdown', (e) => {
  if (!isEditing() || e.button !== 0) return;
  const cell = e.target.closest('#heat i');
  if (!cell) return;
  e.preventDefault();
  const cur = store.state.heat[+cell.dataset.d] || 0;
  const level = brush.level === 'cycle' ? (cur + 1) % 5 : brush.level;
  paint = { level, before: countActive(store.state.heat, visibleDays()), x: e.clientX, y: e.clientY };
  paintCell(cell);
});

document.addEventListener('pointermove', (e) => {
  if (!paint) return;
  // Fast drags skip cells between events, so walk the segment in small steps.
  const dx = e.clientX - paint.x;
  const dy = e.clientY - paint.y;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
  for (let i = 1; i <= steps; i++) {
    const hit = document.elementFromPoint(paint.x + (dx * i) / steps, paint.y + (dy * i) / steps);
    const cell = hit?.closest?.('#heat i');
    if (cell) paintCell(cell);
  }
  paint.x = e.clientX;
  paint.y = e.clientY;
});

document.addEventListener('pointerup', endPaint);
document.addEventListener('pointercancel', endPaint);
