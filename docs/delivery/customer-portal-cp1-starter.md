---
title: Customer portal CP1 - customer scope and support conversation starter
revision: r01
date: 2026-09-06
status: Prepared; existing staged authority, readiness still required
owner: Dean Fiedler
---

# CP1 implementation starter

Act as senior full-stack developer, architect, business analyst, product designer and quality engineer for Dean Fiedler's personal private synthetic PPO prototype. Implement only CP1 from the [portal plan](customer-portal-implementation-plan.md): named synthetic customer → permitted site/equipment or explicit unknown → durable support request → one internal Ticket and owned follow-up → staff public question → customer reply → owned staff next action.

## Authority and current readiness

Dean has authorised design now and bounded implementation as supporting workflows become ready. This authority covers the necessary local dependencies, one focused issue/branch, additive migrations and non-destructive fixtures, domain/API/UI, meaningful tests, docs, commits, PR and normal checked merge. A new invocation is a continuation signal, not renewed permission for the same scope. No live customer accounts, real invitations/messages, paid services, hosting, operational integration or production migration.

At design baseline main `94289a20fc609e47af647b29ca8170557da312bb`, CP1 was not ready because P11/P12 were not delivered and P10 #48 was open. First verify current main and the actual P12/P11 publication evidence; inspect current AGENTS, README, STATUS, portal design/plan/acceptance, shared UI, P03/P09 and document/permission contracts. Inspect open work, including P10/CRM/estimating successors; allocate migration/ADR only after checking current reservations. Do useful preparation if a real dependency remains, record exact evidence and do not claim a blocked runtime stage complete.

## Implementation boundaries

- Preserve seven domains, all 78 parent requirements, P01–P12, issued bytes and existing staff scopes. Add no real identity provider or infrastructure. Synthetic external principal must be distinguishable from staff and remain prohibited in remote production.
- Scope by operating company AND explicit customer organisation/site/record grant, current membership, action and target relationship. Never infer membership from email domain, contact label or the existing Company permission. Enforce on API/files/search/counts/selectors/receipts, not only UI.
- Use canonical Ticket and Activity through domain services. CP1 includes a new customer projection/public conversation, not a duplicate support system or an invented Resolved lifecycle. Customer values New/NeedsInformation/Triaged map only as specified in the design.
- Start online and text-only. No attachments, external mail, anonymous intake, customer delegation, report response, booking changes, quote acceptance, account balances, AI or customer offline storage.
- Atomically persist request, public message, scoped customer link, eligible service owner/Activity, original receipt, audit and outbox. A public question/reply is explicit; private notes stay private. No customer-controlled staff owner, work authorisation, status transition or internal note visibility toggle.
- Preserve input on safe failures, reconcile unknown outcomes with the original operation, reject changed reuse, abort stale context reads and clear/lock content on access loss. No false saved status or bypass through an old receipt.
- Build Home, Support list/detail and New request with the shared brand and accessible phone/desktop controls. The broader mockup is a design reference, not permission to implement CP2–CP5.

## Verification and completion

Execute CP1's actual CPA-01–06/12–14 portions with two customers in one company, a second company, cross-site/unshared-thread denial, expired/revoked membership and canaries. Verify real DB/HTTP/browser and separate app/DB restart/unknown-operation recovery. Inspect 320px/390px/desktop and long text; preserve every baseline regression gate. Full future cases remain partial/Not run where their dependencies do not exist.

Record actual commit/environment evidence, failures/fixes, original capture hashes, checked PR and expected-head normal merge. Verify actual merged main and update current status/handover. Prepare the next bounded CP2a or CP3 starter according to readiness, then stop the CP1 issue. Operational decisions and real customer activation are distinct from component verification.
