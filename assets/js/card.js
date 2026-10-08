// The stats card: tabs, range pills, six tiles, heatmap and fun fact.
import { fmtInt, fmtTokens, fmtHour } from './format.js';
import { rangeStats, visibleDays, factText } from './stats.js';

export const TILES = [
  { key: 'sessions', label: 'Sessions', fmt: fmtInt },
  { key: 'messages', label: 'Messages', fmt: fmtInt },
  { key: 'tokens', label: 'Total tokens', fmt: fmtTokens },
  { key: 'activeDays', label: 'Active days', fmt: fmtInt },
  { key: 'peakHour', label: 'Peak hour', fmt: fmtHour },
  { key: 'favoriteModel', label: 'Favorite model', fmt: String, text: true },
];

const card = () => document.getElementById('card');

function build() {
  card().innerHTML = `
    <div class="card-head">
      <div class="pills" role="tablist" aria-label="View">
        <button type="button" class="pill" data-tab="overview">Overview</button>
        <button type="button" class="pill" data-tab="models">Models</button>
      </div>
      <div class="pills" role="tablist" aria-label="Range">
        <button type="button" class="pill" data-range="all">All</button>
        <button type="button" class="pill" data-range="30d">30d</button>
        <button type="button" class="pill" data-range="7d">7d</button>
      </div>
    </div>
    <div class="card-view" data-view="overview">
      <div class="tiles">
        ${TILES.map((t) => `
          <div class="tile">
            <div class="tile-label">${t.label}</div>
            <div class="tile-value${t.text ? ' is-text' : ''}" data-stat="${t.key}"></div>
          </div>`).join('')}
      </div>
      <div class="heat" id="heat" role="img" aria-label="Activity over the last 26 weeks"></div>
      <p class="fact" data-stat="fact"></p>
    </div>
    <div class="card-view" data-view="models" hidden></div>`;
  card().dataset.built = '1';
}

function renderHeat(s) {
  const heat = document.getElementById('heat');
  const days = visibleDays();
  if (heat.childElementCount !== days) {
    // Oldest Sunday first; CSS flows the cells down each week-column.
    heat.innerHTML = Array.from({ length: days }, (_, i) => `<i data-d="${days - 1 - i}"></i>`).join('');
  }
  for (const cell of heat.children) {
    const level = s.heat[+cell.dataset.d] || 0;
    if (cell.dataset.l !== String(level)) cell.dataset.l = level;
  }
}

function setText(el, text) {
  if (el !== document.activeElement && el.textContent !== text) el.textContent = text;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);

// Models tab: one tile per model with its share of the range's tokens.
function renderModels(s, stats) {
  const view = card().querySelector('[data-view="models"]');
  if (view.contains(document.activeElement)) return;
  const total = s.models.reduce((a, m) => a + (+m.share || 0), 0) || 1;
  const rows = s.models
    .map((m, i) => ({ ...m, i, pct: (m.share / total) * 100 }))
    .sort((a, b) => b.pct - a.pct);
  const html = `
    <div class="mrows">
      ${rows.map((m, rank) => `
        <div class="mrow">
          <div class="mrow-top">
            <span class="mrow-name" data-edit="modelname" data-mi="${m.i}">${esc(m.name)}</span>
            <span class="mrow-val">${fmtTokens((stats.tokens * m.pct) / 100)}<em>${m.pct < 1 && m.pct > 0 ? '<1' : Math.round(m.pct)}%</em></span>
          </div>
          <div class="mrow-bar"><i data-rank="${Math.min(rank, 3)}" style="width:${m.pct.toFixed(2)}%"></i></div>
        </div>`).join('')}
    </div>
    <p class="fact">${esc(factText(s, stats.tokens))}</p>`;
  if (view.dataset.html !== html) {
    view.innerHTML = html;
    view.dataset.html = html;
  }
  view.querySelector('.fact').hidden = !s.show.fact;
}

export function renderCard(s) {
  if (!card().dataset.built) build();
  const root = card();

  root.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('is-on', b.dataset.tab === s.tab));
  root.querySelectorAll('[data-range]').forEach((b) => b.classList.toggle('is-on', b.dataset.range === s.range));
  root.querySelectorAll('[data-view]').forEach((v) => { v.hidden = v.dataset.view !== s.tab; });

  const stats = rangeStats(s);
  for (const t of TILES) setText(root.querySelector(`[data-stat="${t.key}"]`), t.fmt(stats[t.key]));

  const fact = root.querySelector('[data-stat="fact"]');
  setText(fact, factText(s, stats.tokens));
  fact.hidden = !s.show.fact;

  renderHeat(s);
  renderModels(s, stats);
}
