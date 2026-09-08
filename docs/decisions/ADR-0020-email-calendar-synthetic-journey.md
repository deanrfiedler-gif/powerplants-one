# ADR-0020 — Persisted synthetic Email & Calendar journey

**Date:** 8 September 2026 · **State:** implementation authorised by Dean; verification in progress.

Dean accepted the r02 demo on desktop and mobile and authorised completing PR #62 and the first working email → explicit opportunity link → internal follow-up journey. His acceptance is distinct from automated browser verification.

Use the retained Next.js/TypeScript/PostgreSQL stack, synthetic sessions, scoped permissions, transaction/receipt mechanism and shared Activities service. Seed fictional private messages and meetings through a synthetic provider adapter. Only the mailbox owner with current email capability can read or act on messages; linking also checks current opportunity access. An internal follow-up is one existing-style Activity with the exact opportunity/company/site context. It appears in Activity history and Calendar; it does not silently replace an opportunity’s designated next action.

Commands recheck all relevant access before receipt replay, retain operation IDs after uncertain responses, use expected message versions, and create the Activity and source association in one transaction. Receipts and calendar projections recheck current permissions. A private email body is never copied automatically into the Activity, audit or outbox. Colleague sharing and Microsoft grants/sync/sending remain deferred.

Alternatives: browser-only state does not meet persistence requirements; a separate task/calendar database would duplicate the shared Activity authority; a live Graph connection would exceed this synthetic boundary. No new application dependency or hosting service is needed.
