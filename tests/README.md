# `/tests` — test suites

Three layers, two runners.

```
setup.ts        Vitest global setup (jest-dom matchers, jsdom shims)
unit/           Pure logic — lib/, store/, and api/ handlers          (vitest)
integration/    Pages and components rendered with Testing Library    (vitest, jsdom)
e2e/            Real browser journeys against the dev server          (playwright)
```

## Running

```bash
npm test          # vitest, one pass (unit + integration)
npm run test:watch
npm run test:e2e  # playwright
```

## `unit/`

One file per module, named after it (`seqUtils.test.ts` → `src/lib/seqUtils.ts`).
`unit/api/` covers the serverless handlers by calling the exported `handler`
directly with mock req/res objects — no server is started. `unit/api/_fixtures.ts`
holds the shared mocks; `hardening.test.ts` files cover bad input, wrong methods
and injection-style payloads rather than the happy path.

## `integration/`

Renders a page or component and drives it via `@testing-library/user-event`.
Assert on what the user sees — roles, labels, text — not on internal state.

## `e2e/`

Full journeys (`explorer-to-compare`, `encode-journey`, `navigation`) through a
real browser. Slowest layer, so keep it to flows that cross several pages;
anything provable in jsdom belongs in `integration/`.

## Conventions

- New logic in `src/lib/` gets a unit test; new page behaviour gets an
  integration test. Only cross-page flows earn an e2e test.
- Prefer testing `lib/` directly over asserting the same maths through a rendered
  component.
- `tests/setup.ts` is registered in `vite.config.ts` — no per-file setup imports.
