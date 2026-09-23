# App page register r05 — authoring and application handover

The [standalone register](../../reference/ui/app-page-register/PPO-App-Page-Register-r05.html) contains 150 retained scopes, 110 application routes and 260 draft guides. It is a portable authoring/review document. It neither installs help into the application nor changes workflow permissions.

**Working-master successor:** Dean subsequently authorised the [native local development workspace](../development/README.md). Routine maintenance now belongs in that stable Git master. The material below documents reproduction and the operational-help contract for this frozen portable issue; do not run the one-time builder against a newer application tree as a daily update process. The native local preview has current-page draft guidance; release-bound hosted publishing remains separate.

## Source and rebuilding

- Immutable input: [Dean's r04](../../reference/ui/app-page-register/PPO-App-Page-Register-r04.html), SHA-256 `b049869ac8b500cced535360ebb86650c55bbc5cd3ee4a18872ef83ea0b4b16e`.
- Scope statuses and build ranks retain the 20 September 2026 assessment at `98aa2b47a1f13e3d9fdd10984b088b7b00801548`.
- Route inventory: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`, 23 September. Forty-five newly inventoried canonical source routes supplement the original 65; legacy CRM aliases are recorded separately. Source presence does not establish deployment or completion of an entire scope.
- Run `python scripts/build-app-page-register.py` from the repository root. The builder rejects changed/missing application page sources against its pinned commit. Changing that pin is an editorial source refresh, not an automatic claim of acceptance.
- Edit `guide-profiles.txt` for scope-specific preparation, tasks, outcome, boundary and proposed destination. Edit the builder's route-specific focus and verified exceptions when a page differs from its scope. Reader behaviour, appearance and markup live in `register-r05.js`, `register-r05.css` and `register-r05-dialogs.html`.
- Generated files are the HTML, `guide-library.json` and `build-manifest.json`. Do not hand-edit those outputs. Preserve issued HTML bytes; issue r06 for a subsequent released change. Article revisions and schema versions are independent of the register revision.

The HTML embeds its data, fonts, existing mark and eight selected images. It opens without an asset server. Application, source and separate HTML-design destinations require the corresponding environment. Local settings/review backups retain the r04 storage keys; browser/file-origin rules may require importing the existing review backup when moving the file.

## Content and schema

Each stable entry key (for example `scope:CS-01` or `route:/customers/[id]`) has one stable `guide_key`, readable title, r01 article revision, Draft state and en-AU locale. A route title is never its lookup key. Each article has thirteen stable sections:

Purpose; prerequisites; quick start; page tour; information to prepare; main tasks; completion and handover; states; synthetic examples; recovery; mobile/keyboard/offline use; resources; review/feedback.

Structured paragraphs, steps and table cells are rendered as escaped plain text. Author metadata records document ID, owner, audience, source commit, workflow evidence paths, prepared date, null reviewer/review dates, null applicable release, resource IDs, supersession, anchor aliases and actual runtime evidence. No SOP or completed walkthrough is invented. The separate evidence disclosure contains source/implementation details; business readers can concentrate on the article.

`links` records path/template, parameters, source/planned status, parent record selector and local/live availability limits. Origins are document-wide preferences; local and live record UUIDs are entered separately and never persisted. The source enumeration constrains Screen Systems view names. Proposed paths are reference decisions, not reserved routes or evidence of implementation.

`mockup_assets` stores immutable reference identity, kind, source path, revision, alt text, hash and entry associations. The HTML includes PNG data; the smaller guide export includes metadata only. Design mockups and implementation captures remain visibly distinct. Missing images open a real explanatory viewer with the linked HTML design when available. No image filename or screenshot is fabricated.

## Integration with the global information icon

The inspected application currently resolves `ShellPageGuide` largely by visible page title, with a detailed Leads article and a shell/general fallback. This package supplies replacement mapping data, not a drop-in replacement for the existing `PageGuide` TypeScript type.

1. Extend the existing shell help entry in `src/components/shell-page-guide.tsx`; retain one global information icon. Give it explicit page/scope context and optional section/variant context from the active workspace.
2. Resolve an explicit permitted guide context first. Otherwise use the canonical route, matching exact static routes before dynamic record patterns. Use query context for tabs/modes; record UUIDs identify business records, not articles. `resolveGuideContext` in the standalone source demonstrates the route fallback. It deliberately returns null for an unknown route.
3. Convert the exported structured sections to an application renderer or extend the existing article type. Do not import this standalone shell, its preference store or unrestricted authoring bundle into the app. Deliver only permitted content and resources through the existing server permission model.
4. Bind the reviewed article revisions to the application release. A missing, withdrawn, mismatched or inaccessible guide gets an honest fallback and recovery route. Keep the shell guide available. Do not silently substitute an old article by its title.
5. Opening help must preserve dirty fields, active record, query, scroll, save-in-flight and recovery state. Help may neither retry nor cancel a business operation. Related guides use their own back trail. Sign-out or identity change clears restricted reading/search state.
6. Implement the [existing contextual-help acceptance cases](../../testing/contextual-help-acceptance.md), including exact route/variant resolution, server permissions, release mismatch, concurrent save, SOP access, keyboard and mobile checks. The standalone DOM results do not satisfy those application cases.

Example lookup: `/customers/new?kind=person` resolves to the creation-page guide's page-tour section before `/customers/[id]` is considered. `/customers/<uuid>` resolves to the record guide. A future scope without a source route remains a scope guide and a proposed destination until implementation establishes the binding.

## Maintenance and review

Keep labels, business states, permissions, required/conditional information and examples aligned with exact running workflows. Prefer Australian English, active task instructions and observable outcomes. Teach planned behaviour only under an explicit proposal label. Do not infer financial definitions, approval authority, offline support or successful handover from a mockup.

For each implementation change, identify affected entry keys, sections, route/query bindings, screenshots and articles. Walk through the task using synthetic fixtures in the applicable build; record results, reviewer and review date. Draft → InReview → Published requires actual review evidence; changing content after publication creates a successor article without inherited acknowledgement. Null review due dates mean no agreed date, not a default expiry rule.

Expand an article with verified field-level rules and exact control labels as the workflow is implemented. The present profiles supply detailed task context and recovery guidance, but do not replace per-page operational review. Prioritise the PP-01 service journey and high-use CRM/estimating screens before broad publication.

Run the documented DOM suite, compare output hashes after a repeat build, then inspect desktop/tablet/phone, zoom, keyboard and print in an allowed browser. New source paths must have reviewed mappings; every registered entry must retain its guide, link handling, image state and valid related references. Export/import review notes when moving to a different browser or origin.

See the [handover and verification limits](../../delivery/app-page-register-r05-handover.md) and [decision/conformance record](../../decisions/app-page-register.md).
