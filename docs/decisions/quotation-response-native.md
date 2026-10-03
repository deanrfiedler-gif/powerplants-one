# Staff-recorded synthetic quotation responses

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 3 October 2026. Authorised bounded implementation; operational policy and owner acceptance remain separate. Traceability: ES-06, PPO-010, BP-04 EST-03/08, OUT-06, BR-06 and AT-26. Parent IDs and issued reference bytes remain unchanged.

## Reconciled authority and architecture

Refreshed main is `ab4acd687f6a4911ebc5f3f1bd8f09d5ff1e1547`: ES-04 #338 and ES-05 #340 are merged; #340 has 24 successful final-head checks. Earlier handover statements describing unmerged contributions are historical. No open PR or competing ES-06 contribution was found. Preserve unfinished Excel import, reserved migrations 0051/0052 and retained proof databases.

The user authorises authenticated staff recording, professional synthetic choices, code/tests/documentation and a reviewable PR. Customer authentication, signing and external communications are not prerequisites. The retained ES-06 HTML/companion illustrates a broader proposed customer workflow; its signing, sample expiry, multiple choices and local-storage bridge are not adopted runtime policy.

Reuse TypeScript/Next, PostgreSQL, the existing quotation aggregate, exact issued release event/manifest, workspace command lock, atomic audit/receipt/outbox and actor-bound client journal. Add an append-only response-event sidecar, not a competing quotation identity. Mutable response flags would lose corrections and original recovery; adding response data to issued bytes would destroy the offer evidence. No framework, dependency, provider or service is needed.

`SYN-ES06-01` lets the current estimate owner with existing `estimating.quote.prepare` record synthetic reports and prepare a receiving note. All original/current entity and source reads remain required. This reuses a bounded existing staff duty and adds no grant, seed or operational delegation. A later operational recorder duty needs separate policy. Migration 0060 is allocated after inspecting the current registry and live 0059 schema; it introduces no identity type.

## Exact facts and applicability

Every command names one immutable issue UUID and output hash, with its revision, estimate/option, recipient, choices, terms and template evidence. The manual offer contains one complete option; no partial acceptance, combination or new money calculation is supported.

Reported outcomes are Accepted, Declined, Clarification or Negotiation. Each retains the authenticated recorder, stated respondent/claimed role, reported response time, server recording time, synthetic evidence and rationale. New reports explicitly name the preceding response; corrections explicitly name the current original being corrected and append a complete replacement report. All prior facts remain readable. Authority verification and legally effective signature remain Not configured; internal approval and authority to start work are not created.

An information-only clarification needs an attributable answer and separately recorded respondent confirmation before a later acceptance. A material Negotiation permanently holds that issue's receiving preparation and new acceptance, even if a later correction explains the report: only an explicit ES-05 successor can provide replacement offer content. This conservative synthetic choice avoids silently relabelling material change as information. Corrections to historical reports remain possible and visibly inapplicable to the current offer.

An actually issued successor supersedes the preceding issue. A new estimate/source observation, distribution event or unissued preparation does not change an already issued offer or transfer its response. Such source/preparation changes remain visible separately through ES-05. New reports can retain late historical facts, but acceptance on a superseded/material-change-held issue is refused; a correction can describe a historical acceptance without making it applicable. No automatic expiry or withdrawal is added: validity/expiry and withdrawal policy remain Not configured.

## ES-07 boundary and recovery

Receiving preparation requires the current issue's latest reported Accepted response, no unresolved clarification/material negotiation, an explicit owner/due date/note and the exact response UUID. It is Prepared for ES-07 review, with unresolved authority/terms/validity and item/conversion policy disclosed. It is neither sent nor received, and creates no downstream object. A changed response or successor holds a retained preparation automatically without rewriting it. ES-07 must independently review authority, conditions, item/target mappings and duplicate-safe downstream effects.

All reads/history/evidence and original receipt lookup recheck current permissions. Commands compare the observed response sequence and exact issue under the existing lock. Same-operation replay returns its original result; changed content conflicts. The client retains uncertain originals and holds replacement actions until recovery or a definitive refused original. Missing receipt is inconclusive. No offline response command is registered.

Native composition uses the existing shell, fields, buttons, status, read states and journal recovery. It is a staff document/evidence workspace, a declared departure from the reference customer signing viewport. Exact accepted native images are unavailable; implementation, functional proof, visual review, owner acceptance and deployment remain separate. MYOB, SharePoint and native CAD retain their responsibilities.

## CI execution choice

ES-06 uses a separate existing-pattern PostgreSQL/compiled/restart job: the preceding E1 job took approximately 28 minutes against its unchanged 30-minute deadline. Adding this proof to that lane would consume its remaining budget. Existing E1 coverage, deadlines and the two mandatory isolated full-database shards remain unchanged; the new suite is also discovered by the full database/browser suites. No passing retry is added. This is test isolation using existing tooling, not a new application service.
