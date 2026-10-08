// Screenshot mode, PNG export and share links.
import { store } from './state.js';

// --------------------------------------------------------------- toasts

let toastTimer;
export function toast(message, ms = 2200) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), ms);
}

// ------------------------------------------------------- screenshot mode

export const inShot = () => document.body.classList.contains('shot');

export function enterShot({ quiet = false } = {}) {
  document.activeElement?.blur?.();
  document.body.classList.add('shot');
  document.body.classList.remove('editing');
  if (!quiet) toast('Screenshot mode. Esc or double-click to exit.', 1600);
}

export function exitShot() {
  document.body.classList.remove('shot');
  document.body.classList.add('editing');
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}

export function toggleShot() {
  if (inShot()) exitShot();
  else enterShot();
}

export async function fullscreenShot() {
  try { await document.documentElement.requestFullscreen?.(); } catch { /* not allowed here */ }
  enterShot();
}

document.addEventListener('dblclick', () => { if (inShot()) exitShot(); });
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && inShot()) exitShot();
});

// ------------------------------------------------------------ PNG export

const LIB = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
let libPromise;

function loadLib() {
  libPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = LIB;
    s.onload = () => resolve(window.htmlToImage);
    s.onerror = () => { libPromise = null; reject(new Error('Could not load the export library')); };
    document.head.appendChild(s);
  });
  return libPromise;
}

function download(dataUrl, name) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// The exporter serializes a clone of the node, so <use href="#icon"> loses its
// sprite. Swap each one for a copy of its symbol; returns an undo function.
function inlineSprites(root) {
  const undo = [];
  root.querySelectorAll('svg > use').forEach((use) => {
    const symbol = document.getElementById((use.getAttribute('href') || '').slice(1));
    if (!symbol) return;
    const svg = use.parentNode;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (const attr of symbol.attributes) if (attr.name !== 'id' && attr.name !== 'viewBox') g.setAttribute(attr.name, attr.value);
    g.innerHTML = symbol.innerHTML;
    const hadViewBox = svg.hasAttribute('viewBox');
    if (!hadViewBox) svg.setAttribute('viewBox', symbol.getAttribute('viewBox'));
    svg.replaceChild(g, use);
    undo.push(() => {
      svg.replaceChild(use, g);
      if (!hadViewBox) svg.removeAttribute('viewBox');
    });
  });
  return () => undo.forEach((fn) => fn());
}

// kind: 'card' (greeting + stats card, like a cropped screenshot) or 'app'.
export async function exportPng(kind = 'card') {
  toast('Rendering PNG…', 6000);
  const body = document.body;
  const wasEditing = body.classList.contains('editing');
  let restore = () => {};
  try {
    const lib = await loadLib();
    await document.fonts.ready;
    body.classList.remove('editing');
    body.classList.add('exporting');
    const node = document.getElementById(kind === 'card' ? 'hero' : 'app');
    if (kind === 'card') node.classList.add('is-exporting');
    restore = inlineSprites(node);
    const url = await lib.toPng(node, { pixelRatio: 2, backgroundColor: '#151515' });
    const who = (store.state.name || 'me').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    download(url, `claude-code-stats-${who}.png`);
    toast('PNG saved. Go post it.');
  } catch (err) {
    console.error(err);
    toast('Export failed. Screenshot mode (S) still works.');
  } finally {
    restore();
    document.getElementById('hero').classList.remove('is-exporting');
    body.classList.remove('exporting');
    if (wasEditing && !inShot()) body.classList.add('editing');
  }
}

// ----------------------------------------------------------- share links

const toB64 = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

function packState(s) {
  const { tab, ...rest } = s;
  return { ...rest, heat: s.heat.join('') };
}

function unpackState(o) {
  return { ...o, heat: typeof o.heat === 'string' ? [...o.heat].map(Number) : o.heat };
}

export async function shareUrl() {
  const json = new TextEncoder().encode(JSON.stringify(packState(store.state)));
  let payload = `j${toB64(json)}`;
  if ('CompressionStream' in window) {
    try { payload = `z${toB64(await pipe(json, new CompressionStream('deflate-raw')))}`; } catch { /* keep plain */ }
  }
  return `${location.origin}${location.pathname}#s=${payload}`;
}

export async function copyShareLink() {
  const url = await shareUrl();
  try {
    await navigator.clipboard.writeText(url);
    toast('Share link copied. Whoever opens it sees your exact stats.');
  } catch {
    prompt('Copy this link:', url);
  }
}

// Load stats from a #s= link, then drop the hash so local edits stick.
export async function loadFromHash() {
  const m = location.hash.match(/^#s=([jz])([\w-]+)$/);
  if (!m) return false;
  try {
    let bytes = fromB64(m[2]);
    if (m[1] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    store.replace(unpackState(JSON.parse(new TextDecoder().decode(bytes))));
    history.replaceState(null, '', location.pathname + location.search);
    return true;
  } catch (err) {
    console.warn('Bad share link', err);
    return false;
  }
}
