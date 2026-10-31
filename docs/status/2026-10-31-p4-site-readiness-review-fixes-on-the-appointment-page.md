---
title: P4 site-readiness review fixes on the appointment page
date: 2026-10-31
---

Claude fixed the three findings of Codex's review of PR #750 (`82ee763`) on branch `claude/site-readiness-recording`.

- **Dispatch after the last confirmation.** A site-readiness contact that leaves P4 as the last unmet prerequisite, after the whole crew acknowledged, now releases the stored dispatch hold in the same command, through the pack acknowledgement's own `dispatchReadiness` derivation and only when it reports no reason. Any other hold stays. Before this, the hold stayed set although every check passed, and the page said **Dispatch held** with no reason. No migration or database guard changed ([API-C24](../contracts/service-api.md)).
- **Draft kept across a stale refusal.** The site-readiness editor keeps its unsaved entries when the appointment is refreshed to a newer version, and saves only when the user records again; a moved visit needs the answers reconfirmed for the new time first ([page specification](../design/development/pages/route-service-appointments-id.md#p4-customer-site-readiness-recording--30-october-2026)).
- **Early confirmation wording.** A Confirmed contact recorded before the window opened is described as outside the window, needing a new confirmation within it.

Local results and limits are in the [evidence](../testing/evidence/appointment-detail-native/README.md#review-fixes--31-october-2026). The database and HTTP proofs that issue a pack ran locally only with an uncommitted renderer-version allowance for the container's Chrome; CI is the authoritative run. Cross-model re-review, owner visual review and business acceptance remain separate. P5 display, Schedule-page and Sites (CS-06) recording remain open.
