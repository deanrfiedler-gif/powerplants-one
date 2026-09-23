# ADR-0040 — Git-backed design and development workspace

**Status:** Selected for the user-authorised local implementation. **Date:** 23 September 2026.

Dean authorised continuing with a live development register, a shared theme/component reference, desktop/mobile Markdown design references, shell and journey-map records, and automatic maintenance checks. This extends DK-07 guidance and the existing design conformance process; no business domain, permission grant or hosted deployment is added.

Use the existing Next.js/React/TypeScript application. Store the maintained register at `docs/design/development/register.json`, articles at `guides.json` and editable design contracts in `pages/` and `systems/`. Git history supplies working-document history; issued HTML references retain exact bytes. The standalone r05 is an export/reference issue, not a second live master.

The server reads the working files on each explicit refresh. It discovers current routes and journey maps, computes reference/source fingerprints and reports missing registration or review. A new source route must be registered through the synchronisation command and its context reviewed in the same PR. Discovery never marks a workflow tested, accepted or deployed. Shared source dependencies are recorded explicitly; their changes make earlier review fingerprints stale. CI fails missing/broken coverage and preserves unresolved review as visible work.

The native workspace and every supporting endpoint require the existing local-synthetic, loopback, non-production configuration and trusted local-launcher request. Hosted and production requests return unavailable; hiding an icon is not the boundary. It contains public design references, not business data, and does not need a new business capability. A future hosted owner-only version requires its own access decision.

The theme page renders real shared React controls and runtime CSS variables. New reusable controls consume existing r22 token values; legacy component styles remain explicit migration work. The page permits temporary preview adjustments inside an isolated sample only. Durable token/specification changes go through Git, checks and review. No browser-to-GitHub writer, arbitrary file editor or database is introduced.

Known HTML design and journey references may be read in an isolated sandbox without same-origin privileges, outbound requests, forms or top navigation. Source images/Markdown are served through a registry-derived allowlist, with real-path containment and no arbitrary path parameter. These references do not become active application code or approved UI baselines. Archived app-register HTML is not previewed by this route.

Alternatives considered: a separate catalogue service/database would duplicate authority; manually maintained HTML becomes stale; a live GitHub write integration adds credentials and review complexity. The selected implementation works with the repository and existing runtime without a new dependency.

Conformance: Register/worklist plus Document & evidence workspace; shared shell remains the host. The proposed development interior uses existing Roboto/navy/green tokens, accessible controls, phone cards and one reading dialog. Existing accepted business-page measurements and the UI baseline register remain authoritative. Reference/design acceptance, actual source implementation, functional verification and deployed availability are separate fields.

Technical references checked: [Next.js request headers](https://nextjs.org/docs/app/api-reference/functions/headers) and [MDN iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe). Implementation proof is recorded in the development-workspace handover.

The later [living-master decision](living-master-documents.md) removes routine article revisions, introduces schema 2 and adds Git history with explicit local-edit and review state. This supersedes any working-issue labels without reissuing the archived r04/r05 HTML.

## Component catalogue extension, 23 September 2026

Dean authorised the full catalogue recommendation. Extend the existing route and Git master with `components.json`, component-specific Markdown, code-owned fixture renderers and an internal `/development/component-preview` route. The real application implementation supplies each runnable example. Retained future patterns remain explicitly reference-only. Use fixed synthetic fixtures, local callbacks and the existing global stylesheet order; the preview mounts no business session/shell service.

The local launcher permits same-origin framing only for this independently gated synthetic preview; all business pages remain protected by DENY and the hosted gateway remains unchanged. Separate real viewport documents are necessary for media-query and native dialog/menu behaviour. No new framework, service, database or dependency is introduced. Component references reuse the existing allowlisted, hash-checked sandboxed reader.

Coverage, alignment, review currency and business verification are separate. Follow transitive source/style dependencies and explicit runtime dependencies to mark changed reviews stale. Require source/export, reference/anchor and consumer binding integrity in the existing CI check. Existing baseline decisions remain authoritative. See the [maintenance contract](../design/development/components/README.md) and [delivery handover](../delivery/component-catalogue-handover.md).

## Protected hosted extension, 23 September 2026

Dean subsequently authorised the protected hosted workspace and deployment. The [hosted workspace decision](hosted-design-workspace.md) supersedes the local-only deployment boundary above for the existing private Azure demo. Local mode, Git authority, reference isolation, temporary previews and separate review/acceptance remain unchanged.
