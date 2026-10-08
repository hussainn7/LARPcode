// Heatmap math, range stats and the book fun fact.
import { BOOKS, HEAT_DAYS, SCREENSHOT_HEAT, heatFromMap } from './data.js';

// The grid is 26 week-columns, Sunday on top, ending on today's weekday,
// so the last column is only partly filled.
export const visibleDays = (today = new Date()) => 25 * 7 + today.getDay() + 1;

export const dayOfWeek = (daysAgo, today = new Date()) => (((today.getDay() - daysAgo) % 7) + 7) % 7;

const weightSum = (heat, days) => heat.slice(0, days).reduce((a, l) => a + l, 0);
export const countActive = (heat, days = visibleDays()) => heat.slice(0, days).filter(Boolean).length;

export const RANGE_DAYS = { '30d': 30, '7d': 7 };

// "All" shows exactly what the user typed. 30d and 7d are scaled from it by
// how much heatmap activity falls inside the window, unless overridden.
export function rangeStats(s, range = s.range) {
  const base = s.stats;
  if (range === 'all') return { ...base };
  const days = RANGE_DAYS[range];
  const total = weightSum(s.heat, visibleDays());
  const share = total ? weightSum(s.heat, days) / total : 0;
  const auto = {
    sessions: Math.round(base.sessions * share),
    messages: Math.round(base.messages * share),
    tokens: Math.round(base.tokens * share),
    activeDays: countActive(s.heat, days),
    peakHour: base.peakHour,
    favoriteModel: base.favoriteModel,
  };
  return { ...auto, ...(s.overrides[range] || {}) };
}

export function bookFor(tokens) {
  const fits = BOOKS.filter((b) => tokens >= b.tokens);
  return fits.length ? fits[Math.floor(Math.random() * fits.length)].name : BOOKS[0].name;
}

export function factText(s, tokens) {
  if (s.book === 'custom') return s.customFact;
  const book = BOOKS.find((b) => b.name === s.book) || BOOKS.find((b) => b.name === bookFor(tokens));
  const ratio = tokens / book.tokens;
  if (ratio >= 2) return `You’ve used ~${Math.floor(ratio)}× more tokens than ${book.name}.`;
  if (ratio >= 1) return `You’ve used about as many tokens as ${book.name}.`;
  return `You’ve used ${Math.round(ratio * 100)}% of the tokens in ${book.name}.`;
}

// ------------------------------------------------------------ generators

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickLevel = (weights) => {
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) if ((r -= weights[i]) < 0) return i + 1;
  return weights.length;
};

const fill = (fn) => {
  const days = visibleDays();
  return Array.from({ length: HEAT_DAYS }, (_, d) => (d < days ? fn(d, dayOfWeek(d), days) : 0));
};

export const HEAT_STYLES = {
  screenshot: () => heatFromMap(SCREENSHOT_HEAT),
  grind: () => fill(() => pickLevel([1, 2, 4, 5])),
  ramp: () => fill((d, _, days) => {
    const t = 1 - d / days; // 0 = oldest, 1 = today
    return Math.random() < 0.15 + 0.85 * t ? Math.min(4, 1 + Math.floor(t * 3.4 + Math.random())) : 0;
  }),
  weekdays: () => fill((d, dow) => (dow > 0 && dow < 6
    ? (Math.random() < 0.93 ? pickLevel([1, 3, 4, 3]) : 0)
    : (Math.random() < 0.12 ? 1 : 0))),
  weekends: () => fill((d, dow) => (dow === 0 || dow === 6
    ? (Math.random() < 0.88 ? pickLevel([1, 2, 3, 4]) : 0)
    : (Math.random() < 0.18 ? pickLevel([3, 1, 0, 0]) : 0))),
  random: () => fill(() => (Math.random() < 0.55 ? rand(1, 4) : 0)),
  max: () => fill(() => 4),
  clear: () => fill(() => 0),
};

// Exactly `n` active days, biased toward recent ones, like a real account.
export function heatForActiveDays(n) {
  const days = visibleDays();
  const count = Math.max(0, Math.min(n, days));
  const order = Array.from({ length: days }, (_, d) => ({ d, k: Math.random() ** (1 / (1 + 3 * (1 - d / days))) }))
    .sort((a, b) => b.k - a.k)
    .slice(0, count);
  const heat = new Array(HEAT_DAYS).fill(0);
  for (const { d } of order) heat[d] = pickLevel([2, 3, 3, 2]);
  return heat;
}
