import { store } from './state.js';
import { renderShell } from './render.js';
import { renderCard } from './card.js';
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

document.body.classList.add('editing');
store.subscribe(render);
render(store.state);
