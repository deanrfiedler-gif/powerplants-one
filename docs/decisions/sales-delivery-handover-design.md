---
document_id: PPO-CR03-DES
title: Sales-to-Delivery Handover design and receiving handover
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Authorised design creation; owner acceptance, native device review and application integration remain separate
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
---

# CR-03 — Sales-to-Delivery Handover

Dean authorised the design and build of CR-03, the Won-deal receiving handover, presented as the **Sales-to-Delivery Handover** workspace, delivered as a reviewable standalone package with a detailed companion report and receiving application requirements documented separately. Live integration, ERP transactions, operational communications and deployment are outside this increment.

## Review deliverables

- [Interactive workspace r01](../reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-r01.html) · SHA-256 `1e47efa70938127b644a9e5dda9a61d1d4f929b548610d515ec21d1d09ed30a5`
- [Detailed companion report r01](../reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-Report-r01.md): twenty sections covering every view, field group, filter, action, snapshot, state transition, boundary, permission, recovery case, scenario, accessibility behaviour, a 53-row traceability table and the receiving application requirements
- [Reproducible source and rebuild commands](../design/sales-delivery-handover/README.md)
- [Actual verification record](../testing/evidence/sales-delivery-handover-r01/README.md)

## Scope and conformance

| Field | Decision / proposed treatment |
|---|---|
| Identity | CR-03 · Won-deal receiving handover, from the HTML page coverage register. Related scope CR-01/CR-02, CS-01, ES-05/ES-06/ES-07, PRJ/SVC/SCM receiving pages. No parent requirement is added, replaced or accepted; all 78 parent IDs are unchanged |
| r20 page type | Form / guided workflow, supported by Review / comparison; Register / worklist for the queue and Document & evidence for history |
| Components | Quality & Site Assurance r01 workspace CSS, template scaffold, docked decision dialog, register and snapshot vocabulary, and its exact embedded r20 Roboto faces (SHA-256 `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef`, from theme board r20 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`); deterministic Python assembly reused from `scripts/build-quality-site-assurance.py` |
| Input | A Won opportunity with its immutable handover-due record; the accepted quotation issue and its customer response; the ES-07 conversion outcome; customer, site, facility and equipment context |
| Output | A receiving decision bound to an exact handover revision, individually owned outstanding obligations, and locally prepared receiving links. Prepared, submitted, returned, accepted and converted stay five separate outcomes |
| Departures | A nine-cell responsibility-chain band and a three-column field comparison grid are new composition using existing card, tag and grid vocabulary. Both are proposals for review, not authorised baseline changes |
| Baseline | Every issued reference, accepted UI baseline hash and predecessor design is unchanged. This package adds files; it edits no issued HTML |

## Source and branch decision

The contribution starts from `main` `0769a16dd842e9dc1c349a853036ab71949e7807`, tree `57e788526e1521b839fd0ec6c2ef6f973d4dd406`, which merged PR #209. Open contributions #210, #211, #212 and #213 were inspected and are not overwritten or adopted as approved baselines.

**ES-05/ES-06 (draft PR #212, head `8d821e9d764737ab41a753c6fb72342b399428a2`) and ES-07 (draft PR #213, head `b6ef1342aa62eec87f2c4557ce7d1649fd246530`) are pinned references, not a branch dependency.** #213 is stacked on #212's branch rather than on `main`; basing CR-03 on that chain would make it unreviewable and unmergeable independently. No byte from either branch is copied. The only upstream bytes reproduced are from the retained customer quotation r03 on `main`, SHA-256 `7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a`, which the build script asserts. ES-07's conversion vocabulary is reproduced exactly as published in #213. The cost of this choice, stated in the report, is that the acceptance fixture derives from the quotation document's own declared defaults rather than from #213's generated JSON.

## What the design establishes

The workspace answers one question — who has accepted responsibility for delivering the agreed work, what have they received, and what remains unresolved — and refuses to answer it by inference.

**Nine events stay separate.** Customer acceptance, the Won outcome, ERP conversion, handover submission, receiving acceptance, work release, scheduling, delivery and financial processing each have their own record, owner, time and source. A nine-cell responsibility chain shows all of them and is never collapsed into a score. The three combinations the instruction calls out are demonstrated directly: a Won opportunity with missing acceptance evidence, a confirmed ERP order with an incomplete handover, and an accepted handover with prerequisites that prevent work release.

**The accepted commercial basis is immutable here.** No command writes to accepted lines, selections, discount or totals. Amounts are reproduced from the retained quotation r03 document and are never recomputed: `$154,566.67` ex GST, `$15,456.67` GST, `$170,023.34` inc GST for the Riverbend fixture. Customer-requested dates, quoted assumptions and confirmed commitments are three visibly distinct facts, and none becomes a delivery promise. A missing supporting document stays missing: it can only become available through a command requiring an exact issued revision and a stated owning-workspace source, and the workspace states that the bytes remain with that workspace.

**Readiness is split into two classes.** Evidence required before responsibility can be accepted, and prerequisites that may remain open at acceptance but must be satisfied before work release. Missing evidence and evidence reviewed and found insufficient are different findings. Documented rules — Supply readiness states, work-order authorisation binding an exact scope and policy version, CS-06 visit requirements as source information — are used unchanged. The applicability matrix is labelled **CR3-RULE-01, a hypothetical demonstration rule set**, and no override, exception or approval escalation exists anywhere, because inventing one would imply an authority that does not exist. The established rule is preserved structurally: a checklist acknowledgement establishes no site permission, work authority or dispatch readiness, and an acceptance records the release prerequisites that were open at that moment.

**Acceptance binds an exact revision.** Each revision stores a server-computable source fingerprint covering the quotation issue and hash, acceptance state, totals, every document revision and state, the conversion outcome and order key, the destination record and version, the allocated line set and the opportunity version. A decision stores both the revision's fingerprint and the fingerprint at decision time. A change during review refuses the decision; a change after acceptance requires renewed acceptance while retaining the original decision, its reason, its decider and its bound sources unaltered.

**Routing is never invented.** No numerical threshold is adopted. Where an approved source routes the scope, the route and its basis are shown; where none exists, the workspace shows Routing decision required with an owned action. Split routing across destinations, and apportioning an accepted discount between them, are recorded as open requirement **OQ-03**, and the first journey stays bounded to one destination.

**ES-07 owns conversion.** All six outcomes are reported accurately with per-target detail. There is no retry, no second conversion and no compensating effect anywhere in this module — only a link back to ES-07 and an owned reconciliation action.

**Opportunity ownership transfer is preserved and distinguished.** The existing transfer capability changes who pursues the sale. The workspace shows the transfer history and states, in the opportunity snapshot, that it neither names a receiving delivery owner nor completes the handover obligation.

## Implemented behaviour this design is bound by

The only implemented handover fact in `main` is `ppo.opportunity_handovers_due` (migration 0023): one immutable row per Won opportunity, keyed by workspace and opportunity, carrying the outcome event, the opportunity version at Won and the closing owner, with a `status` column constrained to the single value `'Due'` and a trigger refusing every `UPDATE` and `DELETE`. `acceptance_evidence` on the Won event is free narrative text of 1–2000 characters, not a reference to a quotation issue.

Two consequences are recorded as findings rather than designed around:

- **Every delivery-handover state label in this package is proposed.** No verified contract defines one, and the workspace says so.
- **The immutable obligation cannot be discharged by mutation.** Satisfying it requires an additive companion record referencing the accepted decision, following the repository's established companion pattern. This is open question **OQ-02** and is the first thing a receiving increment must decide.

## Permissions

Proposed capabilities — `handover.read`, `handover.prepare`, `handover.submit`, `handover.withdraw`, `handover.review`, `handover.decide`, `obligation.manage`, `commercial.read`, `action.create` — are documented without assigning authority to any employee or department. Departmental roles remain proposed. Holding a decision capability is insufficient: a receiving decision additionally requires that the identity's receiving scope matches the handover's destination type, which is enforced in the model and demonstrated in the interface.

The five preview roles are presentation examples and are not a security boundary. A later application must enforce capability, workspace, company and site scope on the server, and must ensure restricted commercial detail and inaccessible records cannot leak through counts, search, cursors or snapshots. The restricted-viewer demonstration shows one record excluded entirely from the permitted set, with the count line disclosing only that a record is unavailable.

## Verification and acceptance

25 model groups and 29 native browser groups passed on the issued file, with no page or console errors, plus 31 original captures at 1440, 1024, 820, 390 and 320 pixels and no horizontal overflow in any view. Foundation, prototype and naming checks pass, the conflict-marker scan over `docs` is clean, and `git diff --check` is clean. Exact results are in the linked evidence record.

Two limits are disclosed there and repeated here. The native browser was **Chromium 141.0.7390.37** launched through an explicit path, not the repository's pinned Chrome 153 channel, which is not installed in the environment used. Playwright 1.63.0 — the repository pin — was installed **outside the repository tree** because the repository's `engines` field requires Node 24.21.0 and the environment provides Node 22.22.2; no repository dependency, lockfile or pin was changed. Screen-reader output, physical devices, 200 % zoom reflow, forced-colours mode and print pagination are not verified.

Keep this as a draft contribution for owner review. Dean's acceptance of the finished visual, real-device and screen-reader verification, the CR3-RULE-01 applicability rule set, the receiving authority model, runtime integration and full application acceptance all remain separate. Creating the design is authorised; the finished design is not automatically an accepted implementation baseline.

## Receiving boundaries

MYOB Acumatica remains the intended authority for ERP order and account information; every external key here is a clearly identified synthetic example and no endpoint is named or invented. SharePoint remains the intended controlled business-document authority; this design holds no document bytes and references issued revisions only. Projects, Service, Supply Chain and Finance retain their own decisions, permissions and definitions; no financial definition, threshold or approval authority is created. Customer quotation changes remain governed by the quotation lifecycle and item mapping and conversion remain governed by ES-07.

No customer or supplier communication, booking, work authorisation, stock or accounting movement, document issue, production deployment or schedule change is performed. The full receiving application requirements — records, authority, integrity, integration and the tests the application must add — are in section 19 of the companion report, and the recommended next bounded increment is in section 20.

Recovery is to revert this complete isolated design contribution. Existing issued HTML, accepted-baseline hashes and application data are unchanged.
