---
document_id: PPO-012-STARTER-DEC
revision: r02
date: 2026-09-09
owner: Dean Fiedler - private prototype
status: Requested design continuation; proposed product details for review
source_commit: f8035b5c55251da4da52430adf2f83094feccd6b
---

# Projects starter design decision and handover

Dean asked to work on the Projects starter design. The [r02 review package](../blueprints/projects-starter-visuals/r02/README.md) extends the published BP-06 foundation with one synthetic equipment-upgrade walkthrough and a more concrete future commercial handover. The user requested design; J1 runtime and quote-conversion implementation are not invoked.

Retain J1 manual project register, milestones and owned follow-up. Retain the existing J1 fields, state/permission boundaries and PA catalogue. Record initial scope context through an internal update after creation, without inventing a formal accepted scope or adding J1 document uploads. Elaborate J3 exact accepted-quotation receiving review separately. E1 draft output supplies no acceptance authority. Start with clear list/detail screens; dependencies, commercial controls and closure remain J2-J5.

This is a design choice within the existing BP-02/ADR-0003 architecture, not a new architecture or corporate policy. All 78 parents and the P01-P12 service sequence remain unchanged. No business transaction, operational import, integration, deployment, customer message or application code change is included.

## Delivery state

Base: main `f8035b5c55251da4da52430adf2f83094feccd6b`. Local branch: `design/projects-starter-review`. Two new canonical documents; additive index, status and document-register entries; a README clarification of the confirmed repository visibility. Existing issued baselines and prior BP-06 documents are unchanged. The 11-page r01 PDF (retained locally) provides four static register, desktop/mobile detail and future handover review plates. Its r01 renderer (retained locally) reuses the existing logo and Roboto assets. Original attachments remain unchanged.

GitHub reports public visibility (`private: false`) on 9 September. Dean explicitly confirmed, “I've changed the repository to public.” This supersedes prior private-repository assumptions for this contribution. The prototype remains personal and uses synthetic examples; publication does not authorise operational data, business documents, credentials or live integration. Use the dedicated design branch and reviewable PR; do not change visibility.

## Validation

Local foundation, prototype and naming checks passed on the complete checkout: 78 parent requirements/dispositions, 29 master decisions, 38 master acceptance scenarios, 16 backlog entries and 94 document records retained. The final staged `git diff --check` passed after classifying this generated PDF as binary. The first staged check treated the ASCII85-heavy PDF as text and reported PDF stream/xref whitespace; no document bytes were changed to remove legitimate PDF syntax. All 11 PDF pages were rendered and visually inspected; layout, text/table fit, example dates and 1/1/0/0 filtered counts were reviewed. The original supplied logo and repository logo share SHA-256 `8d12f0ecc394950cd9eb66964c588efb71c8e6f445390336c245c3f6712b9694`. A final handover-plate clarification explicitly classifies shutdown timing as non-blocking for setup but required before installation planning; this is a fictional review decision, not a general business rule. No runtime, browser interaction, database or business-acceptance test is claimed. Existing PA and master AT statuses are unchanged.

## Next boundary

Review the worked journey and screen hierarchy. J1 implementation, when invoked, uses the existing starter with current-source reconciliation. J3 remains dependent on a real issued/accepted quotation and receiving contract. No additional approval is needed to complete this requested design; the user's confirmation resolves the observed repository-visibility conflict.

## Publication outcome

Automatic approval review rejected the attempted public branch push. Its stated reason was that confirming public repository visibility did not explicitly authorise publication of this specific new design/document/PDF payload, and local preparation was the safer scope. No alternate publication route was attempted. The complete design, local commits and binary patch are ready for review. Explicit approval to publish this exact package and open its PR is the remaining publication step. No remote CI or merge is claimed.

## r02 continuation

Dean requested the r02 refinement: a realistic portfolio, polished workspace, structured scope/deliverables, and one interactive desktop/mobile journey. The canonical design is revised to r02; the issued r01 PDF and original renderer are unchanged. The self-contained r02 HTML uses embedded repository logo/Roboto and fictional records. It adds no application runtime or data store. Scope, document and sales handover interactions are explicitly future-design fixtures.

Public publication remains held by the prior automatic approval decision; this refinement request does not explicitly approve the public payload. No public push or PR is attempted in this continuation. Final design checks and artifacts are recorded below.

### r02 validation and deliverables

The [interactive HTML](../blueprints/projects-starter-visuals/r02/projects-design-review-r02.html), [six-page PDF](../blueprints/projects-starter-visuals/r02/projects-starter-design-r02.pdf), actual screen captures, reproducible review scripts and [machine-readable results](../blueprints/projects-starter-visuals/r02/review-check-results.json) accompany this revision. The review instructions explain the temporary state and separate future mode.

45 local browser design checks passed using Chromium 152.0.7977.0 at 1366 × 900, 390 × 844 and 320 × 844. They cover counts, filter return, create, owned actions, explicit blocker resolution, reasoned updates, unknown dates, milestones, conflict/recovery, guarded handover linkage, safe text rendering and unavailable states. No uncaught page errors or outer horizontal overflow occurred in the checked states. At 390 px the first project card starts at approximately 391 px. These are viewport checks, not native-device certification or comprehensive accessibility assurance.

All six PDF pages were rendered and visually inspected. A stale receiving-check error found during review was corrected to clear when review inputs change; all 45 checks were then rerun successfully and the affected captures/PDF refreshed. Foundation, prototype and naming checks passed, retaining 78 parent requirements, 29 master decisions, 38 master acceptance scenarios, 16 backlog entries and 94 document records. Generated r02 PDFs are marked binary for Git checks. No PA or master AT acceptance status is advanced.

The local package is ready for design review. Public push and PR remain unperformed under the previously recorded approval hold. J1 application implementation is the next separate build task.

## Publication authorised after r02 review

Dean explicitly authorised publishing the reviewed r02 package and proceeding. This supersedes the earlier automatic-review publication hold for the exact design, HTML, PDF, captures and supporting repository documents. GitHub confirmed the repository is public and main remains `f8035b5c55251da4da52430adf2f83094feccd6b` at the publication check. Publish the dedicated design branch and PR, verify applicable checks, and proceed through normal checked integration. The PR records the resulting remote head and publication outcome.

The next bounded build is J1 using the r02 hierarchy and existing shared Activity/command/receipt contracts. P11 publication is recorded in current STATUS; P12 remains preparation. J1 can be brought forward independently under a runtime continuation without claiming P12 completion or altering the service sequence. Formal accepted scope, document access and quotation receiving remain later J3 work.

### Narrower public publication outcome

Automatic approval review rejected publishing this internal handover document after the user's publication request, citing insufficiently specific public-disclosure approval for this payload. No retry or alternate route for this document was attempted. A materially narrower public package excludes this document, the broader canonical design/status/register changes and the J1 starter revision.

The reviewed r02 HTML, PDF, twelve captures, review instructions and test helper/results are published in PR #81 (`design/projects-r02-public-review`). Initial head `ee8a6a1e6c1df911985e5566b1c3a36a6598211d` passed documentation assurance but failed three lint errors in the CommonJS review helper. The helper was converted to ES modules without relaxing a rule; all 45 local design checks passed again. Corrected head `42a45f40d8f2e28117a171cdb7caa5928cb4bef6`, tree `c957207295552d369467db419a850260434745fc`, matches the isolated local verification tree. Current CI/merge state is recorded on PR #81. The broader local package remains unpublished; its earlier publication-authorised statement records the user's request, not successful completion.

## Explicit handover publication approval

Dean explicitly authorised publishing `docs/decisions/projects-starter-design.md` to the public repository as well. This new instruction resolves the document-specific automatic-review hold recorded above. Add this approved handover and the previously reviewed supporting design/index/register/starter files to PR #81, retaining the already published r02 artifacts and corrected ES-module helper. Earlier hold statements are historical outcomes, not the current authority.

At this continuation, PR #81 remains open at `42a45f40d8f2e28117a171cdb7caa5928cb4bef6`; documentation and Estimating E1 assurance passed, with application assurance still running. The final PR head and checks govern merge readiness. This publication does not implement J1 or make a deployment.

### Document-only publication boundary

The explicit file-specific approval allowed this handover. Automatic review separately rejected the canonical design document because that additional file was not named in the latest approval. This continuation therefore publishes only this handover and its document-register entry. References above to the r01 PDF/renderer describe locally retained prior work; current review links point to the already-public r02 package. No blocked canonical content has been copied into this handover. Broader design/index/status/starter changes remain local.
