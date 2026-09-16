---
document_id: PPO-CR05-DES
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed standalone design; owner acceptance and application integration separate
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
---

# CR-05 Sales Aftercare & Renewal Worklist design and handover

Dean asked for a reviewable standalone design package for **CR-05 — Sales aftercare and renewal worklist**, connected to Customer 360, CRM, order fulfilment and customer delivery, Service Cases, Equipment, Service Agreements & Maintenance and My Work, answering: *has the customer received the intended outcome, what support do they still need, and what should we follow up next?*

The [interactive r01 HTML](../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html), the [detailed companion report](../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-Report-r01.md) and the separate [receiving contract](../contracts/sales-aftercare-receiving.md) deliver that bounded design. Live integrations, customer communications, operational bookings, agreement activation and deployment are outside this increment and none of them is performed by the package.

## Decision

Retain the existing standalone HTML/CSS/JavaScript with a Python builder, as used by My Work r01, Quality & Site Assurance r01 and Maintenance r01. There is no architecture or technology exception: no new runtime dependency, application route, migration, adapter, ERP responsibility or document authority is introduced. The source model and the interaction layer are kept in separate files so integrity rules can be checked without a browser.

The five views are **Aftercare worklist**, **Customer review**, **Training & follow-up**, **Maintenance & renewal** and **History & commercial handover**, using the r20 register/worklist and detail-workspace patterns, its navy/green palette and Roboto. The HTML is module-only: no second application shell and no left navigation rail.

## The distinction this design exists to protect

Eleven outcomes are held apart, each with its own value, source and date: goods delivered; installation or commissioning completed; customer acceptance of a defined scope; an aftercare review conducted; an Activity completed; a technical issue resolved; training delivered; operator understanding or competence assessed; an opportunity created; renewal terms proposed; a renewed agreement accepted and activated.

**Completing an aftercare review sets exactly one of them.** The model enforces this, the browser check asserts it, and the record snapshot renders all eleven as an outcome ledger so a reviewer can see the difference rather than take it on trust.

Three further separations are enforced the same way: prepared / submitted / returned / accepted for both Service referrals and CRM handovers; planned / confirmed / attended / delivered / assessed for training; and informal discussion / prepared opportunity / quotation / accepted agreement for commercial follow-up.

## Boundaries

Customer 360 owns customer, site, facility, equipment and contact records; CR-05 reads them with their freshness and completeness and edits none of them. CS-07 owns territory segmentation, relationship objectives and visit programmes; CR-05 owns follow-up that names a specific source event. Service Cases owns intake, triage, priority and resolution; CR-05 prepares a referral and infers no diagnosis, urgency, service level or permission to intervene from free text. MA-05 owns agreement review, successor terms, renewal acceptance and activation; CR-05 surfaces an open renewal review and links to it without writing to the agreement. CRM owns opportunity creation and qualification; an accepted handover produces an unqualified Enquiry opportunity. My Work owns the obligation identity; CR-05 shows a projection, not a second task store. The document workflow owns documents; the scheduling workflow owns bookings.

## Due dates and generation

No follow-up interval exists anywhere in the repository, so none is invented. A review date comes only from an explicit user choice, a recorded commitment or a sourced rule that names its source reference and its exact rule revision. A record with no date shows **Date needed** as a real, filterable state. CR-05 r01 therefore demonstrates **no repeat generation**: the brief's conditions for it — exact source event, rule revision, preview and duplicate prevention — cannot be met by a rule that does not exist. The due-basis field is the mechanism that would carry one if adopted.

## Data and evidence treatment

Customer statements are recorded with a mandatory basis of Quoted, Paraphrased or Internal interpretation, and are shown beside — never merged with — measured or independently verified results. No satisfaction score is mandatory; `Not assessed` is preserved as a distinct value from a low score, and the absence of a defined scale is stated on screen. No follow-up interval, service level, customer-health score, purchasing authority or renewal rule is invented.

The synthetic fixture reuses the shared `location-context` customer, site, facility, equipment, contact and case identities from Service Cases r02, the MA-05 renewal contract from Maintenance r01, and the Roboto `fonts.css` from My Work r01 byte for byte. Those remain proposals; reusing them does not relabel any of them as an accepted baseline. One observed inconsistency is surfaced rather than resolved silently: the shared location fixture records Willowbank's account owner as Alex Morgan, whom Service Cases r02 records as Service Manager. The workspace displays the conflict; the owning source is an open decision.

## Verification

Model, native browser, documentation and visual checks were run in the session that produced this package; exact counts, the browser build, per-group results and screenshot hashes are recorded in the pull request and in `verification-evidence/sales-aftercare/results.json`. Accessibility work covered touch-target size at phone width, horizontal overflow, tab-strip keyboard navigation, focus return from dialogs and unsaved-entry protection. No screen-reader pass, assistive-technology testing, contrast-tool measurement, multi-browser run, device testing or owner acceptance was performed, and no application behaviour was tested because none exists.

## Status and next step

Proposed design, prepared against main `0769a16d` and rebased onto `d0a660d2` after PR #210 merged, preserving both contributions' entries in the three shared documentation files. Owner visual acceptance, business acceptance and application integration remain separate from this design creation and its contribution. The design index, coverage-register entry note, document register and status row identify this proposal without changing an accepted UI baseline or any deployment status.

The next bounded increment, if accepted, is to decide the follow-up-interval question and the account-owner-of-record question, then implement a **read-only** CR-05 worklist over existing customer, case and agreement reads with server-enforced customer scope and no write commands. Review capture, referrals, training and the CRM handover each cross a module boundary that currently has no interface, so each needs its own receiving agreement and its own increment.
