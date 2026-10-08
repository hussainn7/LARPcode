import { store } from './state.js';
import { renderShell } from './render.js';
import { renderCard } from './card.js';
import { initStudio, setOpen, isOpen } from './studio.js';
import { toggleShot, enterShot, exitShot, inShot, loadFromHash } from './share.js';
import './edit.js';

function render(state) {
  renderShell(state);
  renderCard(state);
}

// Overview / Models and All / 30d / 7d behave like the real pills.
document.getElementById('card').addEventListener('click', (e) => {
  const pill = e.target.closest('.pill');
  if (!pill) return;
  store.update((s) => {
    if (pill.dataset.tab) s.tab = pill.dataset.tab;
    if (pill.dataset.range) s.range = pill.dataset.range;
  });
});

const typing = (el) => el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
  if (e.key === 'Escape' && inShot()) exitShot();
  else if ((e.key === 'e' || e.key === 'E') && !inShot()) setOpen(!isOpen());
  else if (e.key === 's' || e.key === 'S') toggleShot();
});

document.body.classList.add('editing');
store.subscribe(render);
render(store.state);
initStudio();
loadFromHash();
window.addEventListener('hashchange', loadFromHash);

// ?shot opens straight into screenshot mode (handy for share previews).
if (new URLSearchParams(location.search).has('shot')) enterShot({ quiet: true });
