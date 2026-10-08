// A tiny store: one state object, persisted to localStorage.
import { DEFAULT_STATE } from './data.js';

const STORAGE_KEY = 'larpcode:v1';

export const clone = (o) => JSON.parse(JSON.stringify(o));

const str = (v, fallback) => (typeof v === 'string' ? v.slice(0, 200) : fallback);
const num = (v, fallback) => (Number.isFinite(+v) && +v >= 0 ? +v : fallback);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Fill in anything missing from older saves, and sanitize share links:
// they come from strangers, so every field is coerced to its expected shape.
function withDefaults(saved) {
  const base = clone(DEFAULT_STATE);
  if (!isObj(saved)) return base;
  const out = { ...base };

  for (const key of ['name', 'plan', 'greeting', 'book', 'customFact', 'env', 'folder', 'placeholder', 'mode', 'model', 'effort']) {
    out[key] = str(saved[key], base[key]);
  }
  out.tab = saved.tab === 'models' ? 'models' : 'overview';
  out.range = ['all', '30d', '7d'].includes(saved.range) ? saved.range : 'all';

  const st = isObj(saved.stats) ? saved.stats : {};
  for (const key of ['sessions', 'messages', 'tokens', 'activeDays']) out.stats[key] = Math.round(num(st[key], base.stats[key]));
  out.stats.peakHour = Math.min(23, Math.round(num(st.peakHour, base.stats.peakHour)));
  out.stats.favoriteModel = str(st.favoriteModel, base.stats.favoriteModel);

  for (const r of ['30d', '7d']) {
    const o = isObj(saved.overrides) && isObj(saved.overrides[r]) ? saved.overrides[r] : {};
    out.overrides[r] = {};
    for (const [k, v] of Object.entries(o)) {
      if (k === 'favoriteModel') out.overrides[r][k] = str(v, base.stats.favoriteModel);
      else if (k in base.stats) out.overrides[r][k] = Math.round(num(v, 0));
    }
  }

  if (Array.isArray(saved.heat) && saved.heat.length === base.heat.length) {
    out.heat = saved.heat.map((l) => Math.max(0, Math.min(4, Math.round(num(l, 0)))));
  }

  if (Array.isArray(saved.sections)) {
    out.sections = saved.sections.filter(isObj).slice(0, 12).map((sec) => ({
      name: str(sec.name, 'project'),
      items: (Array.isArray(sec.items) ? sec.items : []).filter(isObj).slice(0, 30)
        .map((it) => ({ title: str(it.title, 'Untitled'), branch: !!it.branch })),
    }));
  }

  const models = (Array.isArray(saved.models) ? saved.models : []).filter(isObj).slice(0, 8)
    .map((m) => ({ name: str(m.name, 'Model'), share: Math.min(100, num(m.share, 0)) }));
  if (models.length) out.models = models;

  if (isObj(saved.show)) {
    for (const key of Object.keys(base.show)) if (key in saved.show) out.show[key] = !!saved.show[key];
  }
  return out;
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or storage full: the page still works, it just forgets */
  }
}

const listeners = new Set();

export const store = {
  state: withDefaults(readStorage()),

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  update(mutate) {
    mutate(this.state);
    this.commit();
  },

  commit() {
    writeStorage(this.state);
    listeners.forEach((fn) => fn(this.state));
  },

  replace(next) {
    this.state = withDefaults(next);
    this.commit();
  },

  reset() {
    this.replace(clone(DEFAULT_STATE));
  },
};
