# Document & Form Template Management source

DK-06 standalone synthetic design. Review the [HTML](../../reference/ui/template-management/PPO-Document-and-Form-Template-Management-r01.html), [detailed report](../../reference/ui/template-management/PPO-Document-and-Form-Template-Management-Report-r01.md), [decision and receiving handover](../../decisions/document-form-template-management-design.md) and [verification](../../testing/evidence/template-management-r01/README.md).

```sh
python3 scripts/build-template-management.py
node scripts/check-template-management-model.mjs
npx eslint docs/design/template-management/*.js scripts/check-template-management-*.mjs
node scripts/check-template-management-browser.mjs
```

Native verification uses the repository's pinned Node, npm, Playwright and Chrome channel. A local authoring environment without that channel can set `PPO_CHROMIUM_PATH` to an installed Chromium binary; the launch method actually used is recorded in `results.json` rather than assumed. The focused workflow performs deterministic assembly, focused lint, the model groups, the three repository documentation checks and the native browser suite, and retains the original screenshots. It changes no dependency.

## Source files

| File | Responsibility |
|---|---|
| `schema.js` | Supported definition and field schema, synthetic source contracts, bounded rule operators, three-valued evaluation, canonical serialisation and the bundled synchronous SHA-256. |
| `preview.js` | Audience filtering before projection, local document rendering, form field model, answer validation and form-response compatibility comparison. |
| `validation.js` | The fourteen-case scenario matrix, diagnostic provenance, evidence currency and run manifests. |
| `model.js` | Fixture identity, immutable definitions, review, publication policy, applicability resolution, usage impact, durable publish operations and stored-state validation. |
| `workspace.js` | Six-view controller, structured editing forms, local persistence, recovery and scoped export. |
| `workspace.css` | Module composition over the pinned r20-aligned primitives. |
| `template.html` | Accessible assembly host with a no-JavaScript explanation. |
| `source-manifest.json` | Exact pinned source hashes, reused components, profile capabilities and declared departures. |

The builder reads the shared Supplier Pricing `fonts.css` and `workspace.css` directly rather than duplicating asset copies, and refuses to assemble if any pinned source hash has changed.

## Using the artifact

Open the generated single HTML file. For consistent same-origin browser storage it can also be served by a local static server. The file makes no network request; the whole fixture set is inside it.

The demonstration clock starts at 17 September 2026, 09:00 (Australia/Sydney) and only moves when **Advance demo time** is used. It is a local scenario control, not trusted server time, a scheduled task or a background publication service.

Reset affects only `ppo.template-management.r01` and its `.view` preference key. Export first: a JSON export is a review copy, not a production backup, a template installer or an automatic import contract.

## Boundaries

All templates, sources, people, policies, dates, documents and form answers are synthetic. Preview profiles illustrate intended interface behaviour; they do not secure embedded fixture content from anyone holding the file. Publishing a template here approves and issues nothing: domain services retain the source information, business review, work authority, output issue and customer response, and DK-03 retains output preparation and distribution evidence.

The proposed revisions created in this workspace are supported only by its declared fixture engine. They are not registered as supported versions in the application code, where `supportedTemplateDefinition` still recognises versions 1 and 2 for OUT-09, OUT-10 and OUT-14 only.
