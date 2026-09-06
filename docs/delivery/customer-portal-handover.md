---
title: Customer portal - design and staged delivery handover
revision: r01
date: 2026-09-06
owner: Dean Fiedler
status: Authored; verification and publication in progress
source_commit: 94289a20fc609e47af647b29ca8170557da312bb
---

# Customer portal handover

[Issue #50](https://github.com/deanrfiedler-gif/powerplants-one/issues/50) records Dean's instruction to design now and implement in bounded stages as supporting workflows become ready. This package is the design delivery; no runtime portal is delivered.

## Deliverables

| File | Purpose |
|---|---|
| [Design](../blueprints/customer-portal-design.md) | Role/grant matrix, five business journeys, screen and data contracts, canonical support, exact publications, report responses, knowledge, sources, traceability and operational gaps |
| [Clickable walkthrough](../blueprints/customer-portal-mockup.html) | Branded Overview, Support, Projects, Equipment/reports and Knowledge; temporary request/reply; clear empty/unavailable/access-changed scenarios |
| [CP1–CP5 plan](customer-portal-implementation-plan.md) | Bounded stages, dependencies, exit evidence and current readiness |
| [Acceptance](../testing/customer-portal-acceptance.md) | Sixteen future runtime procedures with adversarial customer/record scope and recovery fixtures; all Not run |
| [Decision](../decisions/customer-portal-direction.md) | User authority, D-027 partial direction, seven-domain/shared-source and coexistence choices |
| [CP1 starter](customer-portal-cp1-starter.md) | Detailed continuation under existing authority when core dependencies are verified |

## Inspected baseline and preservation

Repository main `94289a20fc609e47af647b29ca8170557da312bb`; local isolated branch `docs/customer-portal-design`. GitHub connector read access succeeded; direct HTTPS clone had no CLI credentials. An existing local Git object copy was used to reconstruct this exact baseline without altering other working branches. GitHub remains the publication authority. P10 #48, CRM I2 #47 and estimating E1 #49 were open at inspection; no application source, migration, lockfile or issued source asset is changed by this package.

During preparation, estimating E1 PR #49 merged at `1f13dd8d6f5006559152fe9d5410aed3fff64234`, tree `2ec197b6cdb41c913e9c404daee727f734fcb593`. The complete matching Git tree was hydrated from the existing local E1 object copy, and shared documentation was reconciled with both contributions retained. This newer publication base preserves E1; its draft-only commercial scope does not make CP5 ready.

The supplied logo matches the existing shared PNG exactly; PDF p17/p18 were rendered and visually inspected. Preview embeds the exact shared logo and the already-used Roboto subset to remain self-contained with no external fetch. Navy text on brand green follows shared contrast guidance. Reference hashes and original parent IDs remain unchanged.

## Verification record

Local foundation and prototype checks passed. The naming check initially exceeded the 8,000-character project-instruction limit; the redundant closing guidance was consolidated and is being rechecked. Exact Node 24.20.0 and existing locked Playwright 1.63.0 are available. Chromium download timed out in this container; no local browser pass is claimed. The draft PR will run the same reviewed design checks in disposable CI and retain original captures for inspection. The final contribution must record the actual foundation/prototype/naming results, local toolchain/browser, original preview hash, executed viewports/interactions, inspected captures and any failed-run dispositions before claiming readiness. The dedicated CI uses the existing exact dependency pins; no new package is selected. Full application regression remains an existing PR gate. Preview verification is not CPA runtime/security/business acceptance.

Commands:

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
node docs/blueprints/customer-portal-design-check.mjs
```

Design evidence is emitted under `verification-evidence/customer-portal-design/`; selected original PNGs and a hash manifest will be retained with this design before delivery. There is no independent human review claim.

## Readiness and next step

CP1 is prepared but was not ready on the inspected main: P11/P12 integrated quality and recovery are absent; P10 is still open. External membership and public conversation are CP1 implementation work. Continue CP1 under existing authority after actual readiness verification, with text-only support and real persistence/permission/restart proof. CP2/CP3/CP4/CP5 depend only on their explicitly listed owning workflows; no dates or production availability are promised.

Operational identity/hosting, real customer membership/delegation, publishing/support/urgent-contact policy, retention, supplier content rights and MYOB/SharePoint entitlements remain open for real activation. No live customer access, invitation/message, paid service or operational integration was performed.

## Publication

The linked issue/PR publication record will identify final contribution head, checks, normal expected-head merge and actual merged-main verification. Do not infer publication from this authored file, a screenshot or an open PR. Preserve failed evidence alongside subsequent fixes.
