// A tiny store: one state object, persisted to localStorage.
import { DEFAULT_STATE } from './data.js';

const STORAGE_KEY = 'larpcode:v1';

export const clone = (o) => JSON.parse(JSON.stringify(o));

// Fill in anything missing from older saves or hand-edited share links.
function withDefaults(saved) {
  const base = clone(DEFAULT_STATE);
  if (!saved || typeof saved !== 'object') return base;
  const out = { ...base, ...saved };
  for (const key of ['stats', 'show', 'overrides']) {
    out[key] = { ...base[key], ...(saved[key] || {}) };
  }
  if (!Array.isArray(out.heat) || out.heat.length !== base.heat.length) out.heat = base.heat;
  if (!Array.isArray(out.sections)) out.sections = base.sections;
  if (!Array.isArray(out.models)) out.models = base.models;
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
