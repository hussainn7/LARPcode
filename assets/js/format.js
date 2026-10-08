// Formatting and forgiving parsing for the numbers on the card.

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const fmtInt = (n) => Math.round(n).toLocaleString('en-US');

// 3058100000 -> "3.1B", the way the app shows it.
export const fmtTokens = (n) => compact.format(Math.round(n));

export function fmtHour(h) {
  const hr = ((Math.round(h) % 24) + 24) % 24;
  return `${hr % 12 || 12} ${hr < 12 ? 'AM' : 'PM'}`;
}

const SUFFIX = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15 };
const WORDS = { thousand: 'k', million: 'm', billion: 'b', trillion: 't', quadrillion: 'q' };

// "3.1B", "20,914", "1.2k", "69 billion", "4e9" -> number (or null).
export function parseNumber(input) {
  let s = String(input).trim().toLowerCase().replace(/[,_\s]/g, '');
  for (const [word, letter] of Object.entries(WORDS)) s = s.replace(word, letter);
  s = s.replace(/tokens?$/, '');
  const m = s.match(/^~?(-?\d*\.?\d+(?:e\d+)?)([kmbtq])?$/);
  if (!m) return null;
  const n = parseFloat(m[1]) * (m[2] ? SUFFIX[m[2]] : 1);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// "5 PM", "5pm", "17", "17:00", "noon", "midnight" -> 0..23 (or null).
export function parseHour(input) {
  const s = String(input).trim().toLowerCase().replace(/\s+/g, '');
  if (s === 'noon') return 12;
  if (s === 'midnight') return 0;
  const m = s.match(/^(\d{1,2})(?::\d{2})?(am|pm|a|p)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const ap = m[2]?.[0];
  if (ap) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (ap === 'p' ? 12 : 0);
  }
  return h >= 0 && h < 24 ? h : null;
}
