// Static data for LARPcode.

// The same book list (and token estimates) Claude Code uses for its
// "you've used N× more tokens than <book>" fun fact.
export const BOOKS = [
  { name: 'The Little Prince', tokens: 22000 },
  { name: 'The Old Man and the Sea', tokens: 35000 },
  { name: 'A Christmas Carol', tokens: 37000 },
  { name: 'Animal Farm', tokens: 39000 },
  { name: 'Fahrenheit 451', tokens: 60000 },
  { name: 'The Great Gatsby', tokens: 62000 },
  { name: 'Slaughterhouse-Five', tokens: 64000 },
  { name: 'Brave New World', tokens: 83000 },
  { name: 'The Catcher in the Rye', tokens: 95000 },
  { name: "Harry Potter and the Philosopher's Stone", tokens: 103000 },
  { name: 'The Hobbit', tokens: 123000 },
  { name: '1984', tokens: 123000 },
  { name: 'To Kill a Mockingbird', tokens: 130000 },
  { name: 'Pride and Prejudice', tokens: 156000 },
  { name: 'Dune', tokens: 244000 },
  { name: 'Moby-Dick', tokens: 268000 },
  { name: 'Crime and Punishment', tokens: 274000 },
  { name: 'A Game of Thrones', tokens: 381000 },
  { name: 'Anna Karenina', tokens: 468000 },
  { name: 'Don Quixote', tokens: 520000 },
  { name: 'The Lord of the Rings', tokens: 576000 },
  { name: 'The Count of Monte Cristo', tokens: 603000 },
  { name: 'Les Misérables', tokens: 689000 },
  { name: 'War and Peace', tokens: 730000 },
];

export const MODEL_NAMES = [
  'Opus 5.5', 'Sonnet 5.5', 'Haiku 5.5', 'Fable 5.1',
  'Opus 4.6', 'Sonnet 4.5', 'Opus 4.1', 'Haiku 4.5',
];

export const PLANS = ['Free', 'Pro', 'Max', 'Team', 'Enterprise'];

export const EFFORTS = ['Low', 'Medium', 'High', 'Extra', 'Max'];

export const MODES = ['Auto', 'Ask', 'Plan', 'Accept edits', 'Bypass'];

// Session titles the sidebar can be shuffled from. Boring on purpose:
// a believable sidebar is what sells the screenshot.
export const SESSION_POOL = [
  'Migrate Stripe webhooks to v2 events',
  'Fix race condition in invoice retries',
  'Idempotency keys for refunds',
  'Load test checkout at 10k RPS',
  'Multi-agent planner with tool routing',
  'Eval harness for long-horizon tasks',
  'Reduce context bloat in subagents',
  'MCP server for internal docs',
  'Prompt caching rollout',
  'Zsh startup from 900ms to 40ms',
  'Neovim config cleanup',
  'Tmux and Ghostty keybindings',
  'Rewrite search indexer in Rust',
  'Postgres query planner investigation',
  'Kubernetes autoscaling rewrite',
  'Fix flaky CI on payments pipeline',
  'OAuth 2.1 migration',
  'Dark mode and typography polish',
  'Port auth flow to passkeys',
  'Websocket reconnect backoff',
  'Monorepo build cache misses',
  'Inference server latency regression',
  'Tokenizer edge cases',
  'Distributed training checkpoint bug',
  'Feature flag cleanup',
  'Terraform drift in staging',
  'iOS widget timeline refresh',
  'Investigate memory leak in worker',
  'Ship v2 onboarding flow',
  'Accessibility audit fixes',
  'GraphQL N+1 queries',
  'Rate limiter for public API',
  'Landing page launch prep',
  'Benchmark vector DB options',
  'Swift concurrency warnings',
  'Refactor billing state machine',
];

export const PROJECT_POOL = [
  'billing-service', 'agents', 'dotfiles', 'web', 'infra', 'ios-app',
  'search', 'ml-platform', 'api', 'design-system', 'cli', 'data-pipeline',
];

// Heatmap: index 0 is today, index 1 is yesterday, and so on.
// This is the pattern from the reference screenshot (12 active days).
const SCREENSHOT_HEAT = { 0: 3, 1: 2, 2: 4, 3: 1, 4: 2, 5: 1, 6: 1, 7: 2, 8: 3, 9: 1, 14: 2, 15: 1 };
export const HEAT_DAYS = 26 * 7;
export const heatFromMap = (map) => Array.from({ length: HEAT_DAYS }, (_, d) => map[d] || 0);

export const DEFAULT_STATE = {
  v: 1,
  name: 'Hussain',
  plan: 'Max',
  greeting: 'What’s up next, {name}?',
  tab: 'overview',
  range: 'all',
  stats: {
    sessions: 242,
    messages: 20914,
    tokens: 3058100000,
    activeDays: 12,
    peakHour: 17,
    favoriteModel: 'Opus 5.5',
  },
  overrides: { '30d': {}, '7d': {} },
  heat: heatFromMap(SCREENSHOT_HEAT),
  book: 'Dune',
  customFact: '',
  models: [
    { name: 'Opus 5.5', share: 86 },
    { name: 'Sonnet 5.5', share: 11 },
    { name: 'Haiku 5.5', share: 3 },
  ],
  env: 'Local',
  folder: 'No folder',
  placeholder: 'Describe a task or ask a question',
  mode: 'Auto',
  model: 'Opus 5.5',
  effort: 'Extra',
  sections: [
    {
      name: 'billing-service',
      items: [
        { title: 'Migrate Stripe webhooks to v2 events' },
        { title: 'Fix race condition in invoice retries' },
        { title: 'Idempotency keys for refunds' },
        { title: 'Load test checkout at 10k RPS' },
      ],
    },
    {
      name: 'agents',
      items: [
        { title: 'Multi-agent planner with tool routing' },
        { title: 'Reduce context bloat in subagents' },
        { title: 'MCP server for internal docs' },
        { title: 'Prompt caching rollout' },
        { title: 'Tokenizer edge cases' },
        { title: 'Eval harness for long-horizon tasks', branch: true },
      ],
    },
    {
      name: 'dotfiles',
      items: [
        { title: 'Zsh startup from 900ms to 40ms' },
        { title: 'Neovim config cleanup' },
        { title: 'Tmux and Ghostty keybindings' },
        { title: 'Dark mode and typography polish' },
        { title: 'Swift concurrency warnings' },
      ],
    },
  ],
  show: { sidebar: true, composer: true, clawd: true, traffic: false, fact: true },
};
