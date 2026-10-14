# Products discovery implementation evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: local verification recorded below; owner/device acceptance pending.

PD-01 catalogue A, authorised 14 October 2026. Base: e0ef8b6 merged at 75336d4. [Decision](../../../decisions/products-discovery-proposal.md) separates observation, authority and proposed supply B. Private PPO - Design: nodes 653:46 / 657:371; [icon-free source captures](../../../reference/ui/products-discovery/README.md). Named version pending (editor WebGL unavailable).

Browser proof uses newly created synthetic rows, real PostgreSQL reads and synthetic role grants. No account capture, private link, token or production record is retained. Screenshots use public fallback icons with the private Kit unset. Stock stays NotConfigured/Unknown.

## Execution

Source under test: 3ee654b (catalogue implementation plus slow-company-context correction). Final compiled execution: **6/6 passed**. The [manifest](execution.json) records exact source/build IDs, LF-normalised source hashes and capture hashes; [browser results](browser-results.txt) retain the executed scenarios. Environment repair: saved database port unavailable; created task-owned loopback PostgreSQL ppo_synthetic_test. The inherited node_modules junction was rejected by Turbopack and lacked current main's yauzl dependency; replaced only the task junction with a lockfile installation. No test weakened.

## Checks completed

- Development browser: desktop/phone tests passed, including 1440/1024/390/320, query and retained filters, explicit Back/reload/browser Back, selected-row focus/scroll, Escape focus return, empty/unavailable/retry and changed-identity reset. The initial visual review found a hidden primary-button label; fixed with shared menu button classes and a foreground-colour assertion.
- 14 focused Products/navigation unit tests passed.
- Design-register and naming checks passed; 334 unreviewed and 28 stale entries remain visible.
- Full lint/typecheck passed; the company-context correction then passed focused lint/units and a fresh production build including TypeScript.
- Final compiled browser: 6/6 passed. Discovery tests additionally change all three filters, retain return after delayed company-context loading, clear the projection on company and identity changes, and recover through Retry loading. Existing all-page and historical pricing tests passed on desktop and phone. No backend, migration or authority rule changed.
- Foundation assurance passed: 22 issued sources, all 78 parent requirements, 9,531 local links; no business acceptance implied.

## Comparison and limits

Native rows retain model/variant detail (may grow beyond 40px), phone lifecycle, visible 100-record bound and permission-gated draft creation. Existing shell/fallback icons remain native. At 1024, the shared primary rail retains its user preference rather than forcing the drawing's collapsed rail; the table scrolls within its pane. A fresh browser preview was blocked by the browser client; the rendered test captures were inspected directly. Product detail keeps its technical layout; only return context changes. Populated supply/demand is not implemented. Physical-device, screen-reader, actual 200% browser zoom and owner acceptance remain pending. Browser emulation proves only the stated viewports and interactions. No merge or deployment.

## Inspected captures

Desktop 1440: flat 240px secondary menu, toolbar and ruled table without a module card. Phone 390/320: full-width rows, accessible filter button, model/variant and lifecycle retained. Tablet 1024: native rail preference and bounded table scroll. The return captures show the retained row/position. Captures were inspected after the primary-button style repair; final compiled captures replace those earlier development captures. The Figma rows are illustrative; runtime captures use distinct synthetic fixtures and are structural comparisons, not a pixel-parity claim.
