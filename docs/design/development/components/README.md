# Component catalogue maintenance

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Schema:** 1 · **Review:** Paired visual and device acceptance pending.

The component catalogue extends the existing local development workspace at `/development/design-system`. It is backed by `../components.json`, these Markdown specifications and the actual runtime components. It contains 19 runnable examples, one real host-shell entry and four reference-only patterns across ten categories. These are coverage counts, not approval or proof that every application-specific variant has been migrated.

## Browsing and comparison

Search by component, purpose or exported name; filter by category, application area, coverage and review. Each stable component has Example, Design reference, Usage rules, Used on, Differences and Review/history views. Copy a link to the component, state and width. The Example frame is a separately gated Next.js page with the same global styles in the same import order as the application. It mounts no business session or shell services. Its adapters use deterministic synthetic fixtures and local callbacks. Following synthetic-record links is intercepted. Reload/reset discards fixture edits; Gantt catalogue geometry is not persisted.

Desktop/tablet/phone controls change the real frame viewport width. Fixed-width frames scroll within bounded containers. The surrounding shell requires resizing the actual browser. Optional comparison opens the retained reference in the existing restricted sandbox, with the same selected frame width. Retained references can have unavailable external assets under that sandbox; use the original reference and record that limit rather than changing issued bytes.

The page register links back to mapped components. Used on identifies maintained bindings; it is not a claim that all consumers have been discovered. Dynamic record links still require the correct environment-specific IDs in the page register. Local/hosted destinations do not assert deployment. No browser action writes Git, business data or approved review evidence.

## Coverage contract

Runnable requires a code-owned renderer ID, declared states, a real application export, design reference, desktop/mobile contract and owning page/system. Host example means the actual shell around the catalogue; it is not an isolated fixture. Reference only means proposed or unbound work and is excluded from runnable counts. New categories and families must be inventoried before claiming expanded coverage. Never mark a placeholder as a completed component.

| Family | Current real examples | Explicit limits |
|---|---|---|
| Foundations | Runtime tokens; Button and ButtonLink | Legacy scope overrides and tokens remain visible migration work |
| Tables and grids | CRM Grid; estimating AreasEditor selection/edit table | No universal bulk-select or spreadsheet-cell editor is adopted |
| Boards and cards | CRM Board; ForecastWorklist | Host permissions, pagination and saved commands remain integration concerns |
| Gantt | ProjectsGantt, including List, programme, undated and loading cases | Editing/history callbacks are presentation-only; fixed catalogue clock |
| Scheduling | PlannerBoard and AppointmentCard | Readiness, concurrency and confirmation remain server/host checks |
| Forms | Field, SelectField, LookupField, ValidationFields and ErrorNotice | Full saved estimation wizard remains a reference/integration scenario |
| Navigation | RecordTabs/RecordPanel; WorklistChoice; real host shell | Host navigation depends on current permitted identity |
| Dialogs/overlays | WorklistPanel modal/drawer; WorklistMenu popover | Other module-specific dialog families still require review |
| Feedback | ReadState, ErrorNotice and Status | Offline/empty/success copy is explicitly host-level illustration |
| Mobile | Same runtime examples at 390/320 px; long-form fixture | Touch devices, screen readers, zoom and keyboard occlusion require acceptance |

## Retained theme-board inventory

The entire r22 board remains a retained source, including proposed future patterns. Its sections are accounted for below; a mapped section is not automatically accepted.

| Source sections | Catalogue location or disposition |
|---|---|
| direction, brand-assets, colour, typography, geometry, controls, selection-states | Foundations, buttons and status; retain original brand assets |
| application-shell, sh-workspace, sh-more, sh-utility | Application shell host entry and retained r17 shell reference |
| page-layouts | Record tabs and per-page desktop/mobile specifications |
| records, next-customer-action | Sales table, board, cards and activity presentation |
| gantt | Project Gantt plus distinct service planner |
| forms | Fields, lookup, validation and AreasEditor |
| layers | Menus, dialogs and drawers |
| states | Read-state/error/status examples |
| responsive | Cross-cutting width presets and mobile form |
| ai-assistance | Reference-only AI patterns; no shared runtime claim |
| products | Reference-only product-pattern inventory |
| estimation-wizard | Runnable area editor/tabs; complete saved wizard retained as integration/reference work |
| future-patterns, innovation, fi-panel-suggestion, fi-panel-review, fi-panel-connections | Reference-only future patterns; no implied adoption |
| references, handover | Exact source links, usage specifications, ownership, gaps and this maintenance contract |

## Adding or changing a component

1. Identify the existing application implementation and source reference. Preserve scoped variants where their purpose differs.
2. Add a stable record to `../components.json`, an entry in the code-owned example ID union and its renderer in `src/development/component-examples.tsx`. Fixtures belong in `component-fixtures.ts`; never use operational exports or guessed permissions.
3. Provide component-specific states, keyboard rules, desktop/mobile behaviour, explicit limitations and current page-register keys. Do not infer a consumer merely because it is in the same module.
4. Update the Markdown specification and the owning page guide in the same pull request. Keep filenames stable. Record proposed departures as gaps with expected/actual, action, priority and owner.
5. Run `npm run studio:check`, type/lint/build, component tests and relevant existing application tests. Review a representative owning page when extracting presentation code. Run the browser catalogue checks in the repository's supported browser environment.
6. Record review only after actual comparison. Supply reviewer, date, evidence file paths, result and current fingerprint. Evidence must include fixture/state, viewport, source commit and actual result. Do not replace the reference with a current screenshot merely to pass a comparison.

The check fails missing categories/renderer bindings, missing exports/files/anchors, duplicate IDs/states, broken consumer keys and incomplete review evidence. It follows relative imports and hashes styles, fixtures, reference and specification; changed inputs make recorded reviews stale. Runtime-computed dependencies must be listed explicitly. The existing `ui-baselines.json` remains the authority for accepted baselines and known token divergences; the catalogue reads it instead of creating another approval register.

GitHub source/history links use the actual checkout commit. New or modified working files can differ until committed and pushed. Review is not inferred from a commit, test pass or deployment.

## Accessibility and responsive verification

Use semantic native tables for tabular data; do not add an ARIA grid without its full keyboard contract. Verify visible focus, label/error associations, modal focus/return, selected tabs, popover keyboard navigation, contrast and long content. Provide both keyboard and non-drag pointer alternatives where movement is supported. Verify each applicable example at desktop, laptop, tablet, 390 px, 320 px and 200% browser zoom. Mobile emulation is not physical-device acceptance.

## Recovery and authority

Reset restores the selected synthetic example. Refresh working copy rereads Git files. A stale reference hash returns an informative refusal rather than substituting different bytes. Persistent theme changes follow the existing proposal/source/PR workflow. The preview and catalogue remain local-gated; hiding the shell on a fixture route does not grant access. Hosted access, public deployment and operational integration are unchanged.
