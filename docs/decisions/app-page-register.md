---
document_id: PPO-PAGE-REGISTER-DEC
title: App page register and guide library
revision: r01
date: 2026-09-23
owner: Dean Fiedler
status: Authorised standalone build; guides and visual composition prepared for review
source_commit: ccc2251bbba9df266cac9027ddaa9418ab9abc1d
---

# App page register r05

Dean requested a successor to his attached r04 HTML with detailed guides for every registered page/scope, local and live application links, and page-image links with honest missing-image handling. His subsequent instruction authorised building the document. The current contribution implements that standalone document; application help integration and deployment are separate work.

This decision describes the standalone part of the contribution. Dean's later instruction authorised the native local development workspace in [ADR-0040](ADR-0040-development-workspace.md), including local draft help. Its working master and verification are separate from the immutable r05 issue described below. Hosted operational help and deployment remain outstanding.

The current source inventory adds 45 canonical addresses to the original 65. All 150 scope keys, historical statuses, build ranks and dependencies remain unchanged. The new route rows use a refinement/review state, not a claim of full completion. Source evidence is dated independently from the retained scope assessment.

## Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Supports existing **DK-07 — Page guides and contextual help coverage** across the retained 150-scope app register; also links the existing standalone references. No new business module or parent requirement ID is created. Original source: Dean's r04, exact hash in the build manifest. All 78 parent IDs remain untouched. |
| Page type | r20 **Register / worklist**, with **Document & evidence workspace** for guide/image reading and **Record detail** for retained review/dependency panels. This is a standalone design/development registry, not a staff application module. |
| Reused components | r04's embedded PPO r22 fonts, mark, colour variables, page context, filters, metrics, table/cards, build-order badges, details drawer, settings, review notes, shortlist, exports and mobile navigation. New guide reading follows the existing contextual-help design/template in the repository. Eight images are retained exact repository references. |
| Source authority | User authorises the build. r04 is an uploaded reference with a dated assessment. Source routes are inspected at the pinned commit. Images are explicitly design mockups or retained synthetic implementation captures. All new articles are Draft and have no completed operational walkthrough. The live root returned PPO sign-in/HTTP 401; individual authenticated destinations were not audited. |
| Incoming handover | Exact r04 bytes, its stable IDs/relationships, authored scope tasks and proposed paths, current source routes, public synthetic design/evidence assets and existing contextual-help direction. No operational records or credentials. |
| Outgoing handover | Portable r05 HTML; structured guide library; proposed route list; route/variant bindings; image provenance; reproducible source and tests. Dean/content reviewers own article review. The receiving application increment owns permission-filtered delivery, release binding, exact context and the existing global icon adapter. |
| Exceptions and recovery | Missing image viewer; planned destinations; record-specific URL validation and separate environment UUIDs; missing guide/anchor/search result; clipboard failure; browser storage notice and review backup/import inherited from r04. No live availability monitor or support message transmission. |
| Departures | A large modal reader with contents and one article scroll is used in this standalone document, rather than the proposed application non-modal 600 px side panel. At narrow widths it becomes a full-screen reader. Its design is prepared for review, not an accepted application baseline. The 1100/700 px adaptations and 1160 px expanded reader require browser/device review. |
| Verification | Generated-document behaviour and repository assurance are recorded in the handover/evidence. Browser preview was rejected by the tool URL policy. No workaround was used to render the blocked file. Native focus containment, visual reflow, screen reader, real print/PDF and device review remain unverified. |

This is a static documentation enhancement within the existing architecture, with no new application dependencies, services, schema migration or architecture change. The accepted UI baseline register is unchanged. A merge does not publish the guide articles operationally or establish visual acceptance.
