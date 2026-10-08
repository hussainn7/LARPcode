// Renders the replica (sidebar, greeting, composer) from state.

const $ = (sel, root = document) => root.querySelector(sel);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);

// Never clobber the element someone is typing into.
function setText(el, text) {
  if (el && el !== document.activeElement && el.textContent !== text) el.textContent = text;
}

export function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function renderGreeting(s) {
  const el = $('#greeting-text');
  if (el.contains(document.activeElement)) return;
  const [before, after = ''] = s.greeting.split('{name}');
  const hasName = s.greeting.includes('{name}');
  el.innerHTML = esc(before) + (hasName ? `<span data-edit="name">${esc(s.name)}</span>` : '') + esc(after);
}

function renderSidebar(s) {
  const root = $('#sb-projects');
  if (root.contains(document.activeElement)) return;
  root.innerHTML = s.sections.map((sec, si) => `
    <div class="sb-section">
      <div class="sb-section-head">
        <span data-edit="section" data-si="${si}">${esc(sec.name)}</span>
        <svg><use href="#i-plus"/></svg>
        ${si === 0 ? '<svg><use href="#i-sliders"/></svg>' : ''}
      </div>
      ${sec.items.map((it, ii) => `
        <div class="sb-item">
          ${it.branch ? '<svg class="sb-branch"><use href="#i-branch"/></svg>' : '<i class="sb-bullet"></i>'}
          <span data-edit="item" data-si="${si}" data-ii="${ii}">${esc(it.title)}</span>
        </div>`).join('')}
    </div>`).join('');
}

function renderSimpleFields(s) {
  document.querySelectorAll('[data-edit]').forEach((el) => {
    const key = el.dataset.edit;
    if (key in s && typeof s[key] === 'string') setText(el, s[key]);
  });
  setText($('#avatar'), initials(s.name));
}

function renderVisibility(s) {
  const app = $('#app');
  app.classList.toggle('hide-sidebar', !s.show.sidebar);
  app.classList.toggle('hide-composer', !s.show.composer);
  app.classList.toggle('hide-clawd', !s.show.clawd);
  app.classList.toggle('show-traffic', !!s.show.traffic);
}

export function renderShell(s) {
  renderGreeting(s);
  renderSidebar(s);
  renderSimpleFields(s);
  renderVisibility(s);
}
