// The LARP studio: the editor panel next to the replica.
import { store } from './state.js';
import {
  BOOKS, MODEL_NAMES, PLANS, EFFORTS, MODES, PRESETS, SESSION_POOL, PROJECT_POOL,
} from './data.js';
import { fmtInt, fmtTokens, fmtHour } from './format.js';
import { rangeStats, countActive, HEAT_STYLES, bookFor, visibleDays } from './stats.js';
import { brush, commitStat } from './edit.js';
import { enterShot, fullscreenShot, exportPng, copyShareLink } from './share.js';

export const REPO = 'hussainn7/LARPcode';
export const REPO_URL = `https://github.com/${REPO}`;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);
const icon = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const options = (list, labelFn = (x) => x) => list.map((v) => `<option value="${esc(v)}">${esc(labelFn(v))}</option>`).join('');

const CLAWD = `<svg class="st-clawd" viewBox="0 0 12 8" shape-rendering="crispEdges" aria-hidden="true">
  <path fill="#D97757" d="M2 0h8v1H2zM2 1h1v1H2zM4 1h4v1H4zM9 1h1v1H9zM0 2h12v2H0zM2 4h8v2H2zM2 6h1v2H2zM4 6h1v2H4zM7 6h1v2H7zM9 6h1v2H9z"/>
  <path fill="#141413" d="M3 1h1v1H3zM8 1h1v1H8z"/></svg>`;

const STAT_INPUTS = [
  ['sessions', 'Sessions'],
  ['messages', 'Messages'],
  ['tokens', 'Total tokens'],
  ['activeDays', 'Active days'],
];

const HEAT_BUTTONS = [
  ['grind', 'Daily grind'], ['ramp', 'Ramping up'], ['weekdays', 'Weekdays'],
  ['weekends', 'Weekends'], ['random', 'Chaos'], ['max', 'Max out'], ['clear', 'Clear'],
];

const TOGGLES = [
  ['sidebar', 'Sidebar'], ['composer', 'Composer'], ['clawd', 'Clawd'],
  ['traffic', 'Traffic lights'], ['fact', 'Fun fact line'],
];

function template() {
  return `
  <header class="st-head">
    ${CLAWD}
    <div class="st-title">
      <b>LARP<span>code</span></b>
      <small>Claude Code stats you never earned</small>
    </div>
    <button type="button" class="st-iconbtn" data-action="close" aria-label="Close editor" title="Close (E)">${icon('x')}</button>
  </header>

  <a class="st-starbar" href="${REPO_URL}" target="_blank" rel="noopener">
    ${icon('github', 'st-gh')}
    <span>Looking cracked? <b>Star it on GitHub</b></span>
    <span class="st-starcount">${icon('star')}<span data-stars>Star</span></span>
  </a>

  <div class="st-body">
    <p class="st-intro">Click anything on the replica to type over it. Drag across the heatmap to paint. Press <kbd>S</kbd> for a clean screenshot.</p>

    <section class="st-sec">
      <h3 class="st-h">Presets</h3>
      <div class="st-chips">
        ${PRESETS.map((p) => `<button type="button" class="st-chip" data-preset="${p.id}">${esc(p.label)}</button>`).join('')}
        <button type="button" class="st-chip" data-action="randomize">${icon('dice')}Surprise me</button>
      </div>
    </section>

    <section class="st-sec">
      <h3 class="st-h">You</h3>
      <div class="st-grid2">
        <label class="st-field"><span>Name</span><input class="st-input" data-bind="name" maxlength="40" autocomplete="off"></label>
        <label class="st-field"><span>Plan</span><select class="st-input" data-bind="plan">${options(PLANS)}</select></label>
      </div>
      <label class="st-field"><span>Greeting <em>{name} becomes your name</em></span><input class="st-input" data-bind="greeting" autocomplete="off"></label>
    </section>

    <section class="st-sec">
      <div class="st-h">
        <h3>Stats</h3>
        <div class="st-seg" data-seg="range">
          <button type="button" data-value="all">All</button>
          <button type="button" data-value="30d">30d</button>
          <button type="button" data-value="7d">7d</button>
        </div>
      </div>
      <div class="st-grid2">
        ${STAT_INPUTS.map(([k, label]) => `
          <label class="st-field"><span>${label} <em class="st-auto" data-auto="${k}">auto</em></span>
            <input class="st-input" data-stat-input="${k}" inputmode="decimal" autocomplete="off"></label>`).join('')}
        <label class="st-field"><span>Peak hour</span>
          <select class="st-input" data-stat-input="peakHour">${options([...Array(24).keys()], fmtHour)}</select></label>
        <label class="st-field"><span>Favorite model</span>
          <input class="st-input" data-stat-input="favoriteModel" list="st-models-list" autocomplete="off"></label>
      </div>
      <datalist id="st-models-list">${options(MODEL_NAMES)}</datalist>
      <p class="st-note" data-range-note>30d and 7d are scaled from All by how much heatmap activity falls in the window. Type a number to override.
        <button type="button" class="st-link" data-action="reset-range">Reset to auto</button></p>
      <p class="st-note" data-all-note>Shorthand works: <code>69.4B</code>, <code>1.2k</code>, <code>4 trillion</code>.</p>
    </section>

    <section class="st-sec">
      <h3 class="st-h">Heatmap</h3>
      <div class="st-brushrow">
        <span class="st-label">Brush</span>
        <div class="st-brush" role="radiogroup" aria-label="Heatmap brush">
          <button type="button" data-brush="cycle" title="Cycle levels">+1</button>
          ${[0, 1, 2, 3, 4].map((l) => `<button type="button" data-brush="${l}" title="Level ${l}"><i data-l="${l}"></i></button>`).join('')}
        </div>
      </div>
      <div class="st-chips">
        ${HEAT_BUTTONS.map(([k, label]) => `<button type="button" class="st-chip" data-heat="${k}">${label}</button>`).join('')}
      </div>
    </section>

    <section class="st-sec">
      <h3 class="st-h">Fun fact</h3>
      <select class="st-input" data-bind="book"></select>
      <input class="st-input st-mt" data-bind="customFact" placeholder="You’ve used more tokens than the GDP of Monaco." autocomplete="off">
    </section>

    <section class="st-sec">
      <div class="st-h"><h3>Models</h3><span class="st-hint">Share of tokens, Models tab</span></div>
      <div class="st-models" id="st-models"></div>
      <button type="button" class="st-link" data-action="add-model">+ Add model</button>
    </section>

    <section class="st-sec">
      <h3 class="st-h">Window</h3>
      <div class="st-toggles">
        ${TOGGLES.map(([k, label]) => `
          <label class="st-toggle"><input type="checkbox" data-show="${k}"><i></i><span>${label}</span></label>`).join('')}
      </div>
      <div class="st-grid3">
        <label class="st-field"><span>Model</span><input class="st-input" data-bind="model" list="st-models-list" autocomplete="off"></label>
        <label class="st-field"><span>Effort</span><select class="st-input" data-bind="effort">${options(EFFORTS)}</select></label>
        <label class="st-field"><span>Mode</span><select class="st-input" data-bind="mode">${options(MODES)}</select></label>
      </div>
      <button type="button" class="st-chip st-mt" data-action="shuffle">${icon('dice')}Shuffle sidebar sessions</button>
    </section>

    <footer class="st-foot">
      A parody. Not affiliated with or endorsed by Anthropic; Claude and the Claude logo are Anthropic trademarks.
      <a href="${REPO_URL}" target="_blank" rel="noopener">Source on GitHub</a> ·
      <button type="button" class="st-link" data-action="reset">Reset everything</button>
    </footer>
  </div>

  <div class="st-actions">
    <button type="button" class="st-cta" data-action="shot">${icon('camera')}Screenshot mode<kbd>S</kbd></button>
    <button type="button" class="st-iconbtn st-act" data-action="png-card" title="Download card as PNG" aria-label="Download card as PNG">${icon('download')}</button>
    <button type="button" class="st-iconbtn st-act" data-action="fullscreen" title="Fullscreen screenshot mode" aria-label="Fullscreen screenshot mode"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"><path d="M2.75 6V2.75H6M10 2.75h3.25V6M13.25 10v3.25H10M6 13.25H2.75V10"/></svg></button>
    <button type="button" class="st-iconbtn st-act" data-action="link" title="Copy share link" aria-label="Copy share link">${icon('link')}</button>
  </div>`;
}

// ---------------------------------------------------------------- helpers

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffled = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const logRand = (a, b) => Math.exp(Math.log(a) + Math.random() * (Math.log(b) - Math.log(a)));

function shuffleSidebar(s) {
  const titles = shuffled(SESSION_POOL);
  s.sections = shuffled(PROJECT_POOL).slice(0, 3).map((name) => ({
    name,
    items: titles.splice(0, randInt(4, 6)).map((title) => ({ title })),
  }));
  pick(s.sections).items.at(-1).branch = true;
}

function applyHeat(s, style) {
  const before = countActive(s.heat, visibleDays());
  s.heat = HEAT_STYLES[style]();
  if (s.stats.activeDays === before || style === 'clear' || style === 'max') {
    s.stats.activeDays = countActive(s.heat, visibleDays());
  }
}

function applyPreset(s, p) {
  s.plan = p.plan;
  s.heat = HEAT_STYLES[p.heat]();
  s.stats = { ...s.stats, ...p.stats, activeDays: countActive(s.heat, visibleDays()) };
  s.overrides = { '30d': {}, '7d': {} };
  s.book = bookFor(p.stats.tokens);
  s.model = p.stats.favoriteModel;
}

function randomize(s) {
  const sessions = Math.round(logRand(60, 20000));
  const style = pick(['grind', 'ramp', 'weekdays', 'weekends', 'random']);
  s.heat = HEAT_STYLES[style]();
  s.stats = {
    sessions,
    messages: Math.round(sessions * logRand(40, 140)),
    tokens: Math.round(sessions * logRand(4e6, 6e7)),
    activeDays: countActive(s.heat, visibleDays()),
    peakHour: pick([1, 2, 3, 4, 10, 11, 14, 15, 16, 17, 21, 22, 23]),
    favoriteModel: pick(['Opus 5.5', 'Opus 5.5', 'Sonnet 5.5', 'Fable 5.1']),
  };
  s.overrides = { '30d': {}, '7d': {} };
  s.book = bookFor(s.stats.tokens);
  shuffleSidebar(s);
}

// -------------------------------------------------------------- rendering

let root;

function setVal(el, v) {
  if (el && el !== document.activeElement && el.value !== String(v)) el.value = v;
}

function renderBookOptions(s, tokens) {
  const sel = root.querySelector('[data-bind="book"]');
  if (sel === document.activeElement) return;
  const html = BOOKS.map((b) => {
    const r = tokens / b.tokens;
    const tag = r >= 2 ? `${fmtInt(Math.floor(r))}×` : r >= 1 ? '≈' : `${Math.round(r * 100)}%`;
    return `<option value="${esc(b.name)}">${esc(b.name)} · ${tag}</option>`;
  }).join('') + '<option value="custom">Custom text…</option>';
  if (sel.dataset.html !== html) { sel.innerHTML = html; sel.dataset.html = html; }
  sel.value = s.book;
}

function renderModels(s) {
  const box = root.querySelector('#st-models');
  if (box.contains(document.activeElement)) return;
  const total = s.models.reduce((a, m) => a + (+m.share || 0), 0) || 1;
  box.innerHTML = s.models.map((m, i) => `
    <div class="st-model">
      <input class="st-input" data-model-name="${i}" value="${esc(m.name)}" list="st-models-list" aria-label="Model name" autocomplete="off">
      <input class="st-input st-num" data-model-share="${i}" type="number" min="0" max="100" value="${m.share}" aria-label="Share">
      <span class="st-pct">${Math.round((m.share / total) * 100)}%</span>
      <button type="button" class="st-iconbtn" data-model-del="${i}" aria-label="Remove ${esc(m.name)}" ${s.models.length < 2 ? 'disabled' : ''}>${icon('x')}</button>
    </div>`).join('');
}

function sync(s) {
  const stats = rangeStats(s);

  root.querySelectorAll('[data-bind]').forEach((el) => {
    const key = el.dataset.bind;
    if (key !== 'book') setVal(el, s[key] ?? '');
  });

  root.querySelectorAll('[data-stat-input]').forEach((el) => {
    const k = el.dataset.statInput;
    const v = stats[k];
    setVal(el, k === 'tokens' ? fmtTokens(v) : k === 'peakHour' || k === 'favoriteModel' ? v : fmtInt(v));
  });
  root.querySelectorAll('[data-auto]').forEach((el) => {
    el.hidden = s.range === 'all' || el.dataset.auto in (s.overrides[s.range] || {});
  });
  root.querySelector('[data-range-note]').hidden = s.range === 'all';
  root.querySelector('[data-all-note]').hidden = s.range !== 'all';

  root.querySelectorAll('[data-seg="range"] button').forEach((b) => b.classList.toggle('is-on', b.dataset.value === s.range));
  root.querySelectorAll('[data-brush]').forEach((b) => b.classList.toggle('is-on', String(brush.level) === b.dataset.brush));
  root.querySelectorAll('[data-show]').forEach((el) => { el.checked = !!s.show[el.dataset.show]; });

  renderBookOptions(s, stats.tokens);
  root.querySelector('[data-bind="customFact"]').hidden = s.book !== 'custom';
  renderModels(s);
}

// ----------------------------------------------------------------- events

function onClick(e) {
  const t = e.target.closest('button');
  if (!t || !root.contains(t)) return;
  const { action, preset, heat } = t.dataset;

  if (t.closest('[data-seg="range"]')) store.update((s) => { s.range = t.dataset.value; });
  else if (t.dataset.brush !== undefined) {
    brush.level = t.dataset.brush === 'cycle' ? 'cycle' : +t.dataset.brush;
    sync(store.state);
  } else if (preset) store.update((s) => applyPreset(s, PRESETS.find((p) => p.id === preset)));
  else if (heat) store.update((s) => applyHeat(s, heat));
  else if (t.dataset.modelDel !== undefined) store.update((s) => { s.models.splice(+t.dataset.modelDel, 1); });
  else if (action === 'randomize') store.update(randomize);
  else if (action === 'shuffle') store.update(shuffleSidebar);
  else if (action === 'reset-range') store.update((s) => { s.overrides[s.range] = {}; });
  else if (action === 'add-model') {
    store.update((s) => {
      const used = new Set(s.models.map((m) => m.name));
      s.models.push({ name: MODEL_NAMES.find((n) => !used.has(n)) || 'New model', share: 5 });
    });
  } else if (action === 'reset') {
    if (confirm('Reset every stat, label and setting back to the defaults?')) store.reset();
  } else if (action === 'close') setOpen(false);
  else if (action === 'shot') enterShot();
  else if (action === 'fullscreen') fullscreenShot();
  else if (action === 'png-card') exportPng('card').then(() => setTimeout(nudgeStar, 1200));
  else if (action === 'link') copyShareLink().then(() => setTimeout(nudgeStar, 1600));
}

function onInput(e) {
  const el = e.target;
  if (el.dataset.bind) {
    const key = el.dataset.bind;
    // Text fields update live; empty values wait for change so the replica never goes blank.
    if (e.type === 'input' && el.tagName === 'SELECT') return;
    if (e.type === 'input' && !el.value.trim()) return;
    store.update((s) => { s[key] = key === 'customFact' || key === 'greeting' ? el.value : el.value.trim() || s[key]; });
  } else if (el.dataset.statInput && e.type === 'change') {
    commitStat(el.dataset.statInput, el.value);
    el.blur();
  } else if (el.dataset.show) {
    store.update((s) => { s.show[el.dataset.show] = el.checked; });
  } else if (el.dataset.modelName !== undefined && el.value.trim()) {
    store.update((s) => { s.models[+el.dataset.modelName].name = el.value.trim(); });
  } else if (el.dataset.modelShare !== undefined && el.value !== '') {
    store.update((s) => { s.models[+el.dataset.modelShare].share = Math.max(0, Math.min(100, +el.value || 0)); });
  }
}

// ----------------------------------------------------------- open / close

const OPEN_KEY = 'larpcode:studio-open';

export function setOpen(open) {
  document.body.classList.toggle('studio-open', open);
  try { localStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch { /* ignore */ }
}

export const isOpen = () => document.body.classList.contains('studio-open');

function initialOpen() {
  try {
    const saved = localStorage.getItem(OPEN_KEY);
    if (saved !== null) return saved === '1';
  } catch { /* ignore */ }
  return window.innerWidth >= 900;
}

async function loadStars() {
  const el = root.querySelector('[data-stars]');
  try {
    const cached = sessionStorage.getItem('larpcode:stars');
    const n = cached !== null ? +cached : (await (await fetch(`https://api.github.com/repos/${REPO}`)).json()).stargazers_count;
    if (Number.isFinite(n)) {
      sessionStorage.setItem('larpcode:stars', String(n));
      if (n > 0) el.textContent = n >= 1000 ? fmtTokens(n) : String(n);
    }
  } catch { /* offline or rate limited: keep the plain "Star" label */ }
}

// ------------------------------------------------------------ star nudge

const NUDGE_KEY = 'larpcode:star-nudge';
let nudgeShown = false;

export function nudgeStar() {
  if (nudgeShown) return;
  try { if (localStorage.getItem(NUDGE_KEY)) return; } catch { /* ignore */ }
  nudgeShown = true;
  const el = document.createElement('div');
  el.className = 'star-nudge';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Star LARPcode on GitHub');
  el.innerHTML = `
    ${CLAWD}
    <div class="star-nudge-text">
      <b>Clawd did all this for free.</b>
      <span>If LARPcode made you look cracked, a GitHub star keeps it alive.</span>
    </div>
    <a class="star-nudge-btn" href="${REPO_URL}" target="_blank" rel="noopener">${icon('star')}Star</a>
    <button type="button" class="st-iconbtn" aria-label="Dismiss">${icon('x')}</button>`;
  const close = () => {
    el.classList.remove('is-on');
    try { localStorage.setItem(NUDGE_KEY, '1'); } catch { /* ignore */ }
    setTimeout(() => el.remove(), 300);
  };
  el.querySelector('button').addEventListener('click', close);
  el.querySelector('a').addEventListener('click', close);
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-on')));
}

export function initStudio() {
  root = document.createElement('aside');
  root.className = 'studio';
  root.id = 'studio';
  root.setAttribute('aria-label', 'LARPcode editor');
  root.innerHTML = template();
  document.getElementById('stage').appendChild(root);

  const launch = document.createElement('div');
  launch.className = 'st-launch';
  launch.innerHTML = `
    <button type="button" class="st-launch-btn" data-launch="edit">${icon('pencil')}<span>Edit stats</span></button>
    <a class="st-launch-btn" href="${REPO_URL}" target="_blank" rel="noopener" aria-label="Star on GitHub">${icon('star')}</a>`;
  document.body.appendChild(launch);
  launch.querySelector('[data-launch="edit"]').addEventListener('click', () => setOpen(true));

  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input.st-input')) e.target.blur();
  });

  setOpen(initialOpen());
  store.subscribe(sync);
  sync(store.state);
  loadStars();
  // Ask for a star once people have had time to play with it.
  setTimeout(() => { if (!document.body.classList.contains('shot')) nudgeStar(); }, 45000);
  return root;
}
