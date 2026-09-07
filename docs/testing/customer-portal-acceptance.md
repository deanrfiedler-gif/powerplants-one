---
title: Customer portal - acceptance procedures
revision: r01
date: 2026-09-06
status: Authored procedures; runtime Not run
---

# Customer portal acceptance

[Design](../blueprints/customer-portal-design.md) · [Stages](../delivery/customer-portal-implementation-plan.md). CPA IDs are local test labels under existing parent requirements. Static design checks below are separate from these future implementation procedures and the original AT/PT catalogues.

## Required fictional fixtures

One PPO company with Customer A and B; A has North/South sites and two named contacts with own-thread versus shared-site grants. A second operating company has an unrelated customer. Include an expired grant, user with no membership, a consultant with explicit separate customer grants, an unshared request, confidential internal note/title/filename canaries, a shared issued report r01 and successor r02, a draft, withdrawn/missing-byte publication, failed data source, quarantined image and orphan-free request routing failure. Use synthetic names and no operational uploads.

| ID / stage | Procedure and independently observable expected outcome | Runtime status |
|---|---|---|
| CPA-01 / CP1 | Sign in as A/North requester. Read B, A/South, unshared A/North thread and second-company IDs via list/count/search/selector/detail/receipt and direct staff API. Deny without record names/counts; current permitted own/shared records remain available. Verify actual response bodies and database query scope, not hidden controls. | Not run |
| CPA-02 / CP1 | Revoke membership and expire session while detail and selector requests are in flight. Late responses cannot repaint sensitive content; every subsequent HTTP/file/receipt request is denied. Switch from A to B and verify old cached details disappear. Restore only an explicit scoped grant. | Not run |
| CPA-03 / CP1 | Submit permitted known equipment and explicit unknown-equipment variants. Validate required summary/description/site context, wrong-site asset, bounds, script-like text, customer-posted owner and missing eligible staff owner. Accepted path creates one New Ticket/link/message/owned Activity/receipt/audit/outbox transaction; rejected paths leave no orphan. | Not run |
| CPA-04 / CP1 | Interrupt response after commit, restart application and query/retry original operation. Exactly one Ticket, initial message and Activity remain. Changed reuse fails; receipt remains scoped. Stop database during transaction and recover without partial business writes. | Not run |
| CPA-05 / CP1 | Submit with source unavailable or network loss; form retains unsent text while authorised, says not saved and does not silently retry/new-operation. Deliberate navigation warns. Access loss locks sensitive draft; no local-storage/cache export bypass. | Not run |
| CPA-06 / CP1 | Staff authors internal note and separate public question; customer sees only the public projection. Customer replies twice with distinct operations and retries one. Exactly two public replies, one owned current follow-up and no duplicate effect. Private clarification alone does not show Your reply needed. No customer command triages/closes/authorises work. | Not run |
| CPA-07 / CP2a | Release exact P09 report r01 to A/North, then change membership/audience. Verify actual HTML/PDF hashes equal original issue and canaries are absent from content/metadata. Direct files, manifests and copied URLs recheck scope. Missing bytes show unavailable; no regeneration from latest. | Not run |
| CPA-08 / CP2a | Upload allowed synthetic image, spoofed type, oversize file, active content and unavailable-inspection case. Quarantine prevents all preview/search/access before verified finalisation. Interrupt storage-success/DB-failure and recover original bytes and operation after restart; altered reuse is rejected. | Not run |
| CPA-09 / CP2b | Present exact issued r01 HTML; authenticated customer records explicit response/remarks. Open/download alone creates no response. r02 receives no inherited acknowledgement; stale r01 response is refused under current policy and preserved as a recoverable proposal where permitted. Reservations/dispute create owned action; no charge/work/Finance approval. Staff Unavailable records no fabricated customer response. | Not run |
| CPA-10 / CP4 | Publish an approved project snapshot and change internal dates/notes. Customer retains exact published revision with as-at and forecast/confirmed labels until new release. Unknown date is not zero/overdue. Withdrawal removes access/search; an action reply records evidence without approving a variation. | Not run |
| CPA-11 / CP3 | Publish an applicable reviewed article, a restricted article and a successor/withdrawal. Search returns only permitted current published metadata/snippets; unavailable/withdrawn content has no stale snippet. Article retains source/revision/applicability/review due. No-results supports a request with retained article context. | Not run |
| CPA-12 / All | Scan rendered HTML, JSON, errors, media, document metadata, search, exports and notification payloads for internal canaries and private adapter keys. Test guessed UUIDs, old signed URLs, aggregates and renamed/moved documents. No hidden field leaks, path-based authority or stale audience access. | Not run |
| CPA-13 / CP1 | Use keyboard through context/navigation/search/request/reply; Escape returns focus; field errors link and retain other inputs. At 320px, 390px and desktop with long words/200% text, no essential clipping or outer horizontal scroll. Screen-reader announcements distinguish sending/received/uncertain. | Not run |
| CPA-14 / Each stage | Restart browser/app/database separately; restore declared durable state/files and retry uncertain operations. No lost accepted messages, replaced issued bytes or duplicate effects. Verify private response no-store/service-worker exclusions and current access after restore. | Not run |
| CPA-15 / CP5 | Test read-only account versus commercial-acceptance grants, expired/changed quote, competing revisions, stale/partial/unknown ERP source and duplicate response. Only exact allowed published content is shown; no cost/margin leakage, summed incompatible balances or inferred payment/conversion. Execute relevant owning-domain reconciliation cases. | Not run |
| CPA-16 / Live activation | Verify real identity/account-recovery/offboarding, company/site membership, publishing/support ownership, incident/restore process, selected service limits and authorised communication routing in the separately approved environment. Test actual urgent-contact and accessibility workflows with named pilot participants under explicit authority. | Not run |

## Design verification only

The standalone preview has no server, storage or real authorisation. Its browser checks exercise navigation, search/no-results, form validation and retained input, simulated request/reply, reload reset, Escape/focus, unavailable/access-changed illustrations, no external requests, logo dimensions and reflow at three widths. Captures and actual results belong in the [handover](../delivery/customer-portal-handover.md). None of CPA-01–CPA-16 is passed by a preview check.
