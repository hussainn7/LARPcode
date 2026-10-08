import { store } from './state.js';
import { renderShell } from './render.js';

function render(state) {
  renderShell(state);
}

store.subscribe(render);
render(store.state);
