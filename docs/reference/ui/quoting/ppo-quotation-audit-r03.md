# Powerplants One — Customer quotation audit and refinement

**Design revision:** r03  
**Audit date:** 13 September 2026 (UTC)  
**Owner:** Dean Fiedler  
**Status:** Refined design preview; local interaction checks passed; static print proof reviewed; live browser verification pending.  
**Scope:** The attached customer quotation document. This is the external customer surface, with its corporate masthead, rather than the staff quotation builder or issue console.

## Assessment

The supplied r02 had a sound document structure: customer and site context, itemised scope, frozen selling amounts, selectable options, technical assumptions, commercial terms and alternative response methods. It also distinguished customer content from internal estimating data. Its main weaknesses were standalone portability, inconsistent treatment of selections and acceptance, and incomplete print and interaction handling.

The refined r03 follows PPO's current navy controls, green selection accents, Roboto typography, white bordered panels and restrained spacing. It adds an at-a-glance quotation summary, section navigation and a running desktop selection summary. Detailed sections remain available in the document; commercial information is not hidden behind tabs. Preview controls start collapsed and are excluded from printing.

This deliverable is suitable for review as a proposed design baseline. It does not establish that customer issuing or online acceptance is implemented in PPO.

## Evidence and theme authority

- Supplied `ppo-quotation-module-r02.html`: source reviewed in full; original local bytes retained.
- Supplied `GEN_LGO_PPALogoPrimaryTransparent_v01_ISS(1).png`: visually inspected; original PNG bytes embedded unchanged, with no crop, recolour or reconstruction.
- Supplied `PPA_BRAND_GUIDELINES_compressed(1).pdf`: extracted and reviewed for logo use, clear space, minimum sizing, typography and primary colours. Logo clear-space diagram visually inspected. Relevant printed pages: 7–9, 17–18.
- GitHub access verified for `deanrfiedler-gif/powerplants-one`. Inspected `main` at **d05598ae99a0aababb3ee3b31d9f882cac442fd7** (merge of PR #148). Read `AGENTS.md`, `README.md`, `docs/STATUS.md` and the relevant theme sources.
- [Shared UI style specification r06](https://github.com/deanrfiedler-gif/powerplants-one/blob/d05598ae99a0aababb3ee3b31d9f882cac442fd7/docs/standards/ui-style-specification.md) provides the brand foundation and baseline requirements.
- [Accepted r08 shared layout decision](https://github.com/deanrfiedler-gif/powerplants-one/blob/d05598ae99a0aababb3ee3b31d9f882cac442fd7/docs/decisions/shared-ui-r08-implementation.md) explicitly supersedes the older green primary-action direction with navy actions.
- The Roboto font was retrieved from `public/brand/Roboto-variable.woff` at that same commit and embedded into the HTML.

The corporate masthead remains appropriate because this file presents an external customer document. It does not reproduce the staff application rail or navigation. Existing `--ppq-` token names remain local to the source container; mapping them into shared production components is an integration task, not a new theme decision.

## Findings and actions

| ID | Priority | Finding in r02 | Action in r03 |
|---|---|---|---|
| Q01 | High | Relative logo and font URLs do not resolve from the uploaded standalone file. | Embedded the exact supplied logo and repository Roboto font. No external asset request is required. |
| Q02 | High | The root's `button` colour rule overrides class-only primary-button text colours; the acceptance button also uses the older green action treatment. | Scoped all selectors and explicitly paired white text with navy primary actions. Green marks selection and section identity. |
| Q03 | Medium | A long document offers little orientation, with the total appearing well below the first screen. | Added four summary facts, section links and a sticky desktop summary. At narrower widths the summary rail is removed and the in-flow overview remains. |
| Q04 | High | Pump alternatives imply supplied fixed/variable pump sets, while commercial terms unconditionally say the existing customer pump is retained. | Kept the existing pump as the included choice and the variable-speed replacement as the priced alternative. Specification and customer-supplied scope now follow that choice. This is an explicit fictional-fixture interpretation, not verified equipment compatibility. |
| Q05 | High | Pump description asserts both alternatives meet the design basis and claims reduced energy use, despite comments stating no performance claims are present. | Removed those unsupported statements. Pump compatibility and operating requirements remain identified for confirmation before issue. |
| Q06 | High | Selecting an option replaces the DOM, loses focus and leaves previously checked consent in place. | Restored focus to the changed option, retained typed entries and cleared consent whenever selections change. Editing respondent identity also clears consent. |
| Q07 | High | A single local button presents acceptance language alongside claims about binding agreements, confirmation emails and network-address capture. Those services are absent. | Added a final review dialog showing the exact customer, revision, selections and total. The final action is explicitly “Simulate acceptance”. Removed assertions of live contract creation, email delivery or network-address capture. |
| Q08 | High | The customer entity can be edited freely in the response form. | Made the quotation customer read-only and validated the exact fixture entity. A real customer correction requires a corrected quotation. |
| Q09 | High | Every lifecycle state generates a manual signature page; changing selection mode can reset an already accepted selection while leaving its receipt unchanged. | Signature pages and response actions require an open, available quotation. Accepted selections and amounts remain locked when preview selection mode changes. |
| Q10 | Medium | Dates use the viewer's local timezone; “expires in 3 days” is a hard-coded claim. | Dates consistently use the source's UTC+10 timezone. The expiring example uses a non-numeric message. No live expiry enforcement is claimed. |
| Q11 | High | Attachment names and versions appear without the actual files. A static hash is presented without a generated document binding or hash calculation. | Supporting references clearly say “File not supplied”. Replaced the purported integrity reference with an explicit preview reference. No fabricated attachment or security proof is supplied. |
| Q12 | Medium | Loading, empty, read failure, partial availability, denied access, saving, failed response, uncertain outcome and conflict are absent. | Added reachable preview states. Unavailable/denied views hide customer details; incomplete, saving, unknown and changed-revision states pause responses. Failed responses retain entries. |
| Q13 | Medium | Required fields rely on visual asterisks; dialog names and consent-error associations are incomplete. Per-render listeners persist until full disposal. | Added required attributes, error associations, named dialogs, focus return, semantic form submission and a separate per-render listener lifecycle. |
| Q14 | Medium | Whole cards avoid page breaks, printed masthead text can remain white, and form/signature elements are inconsistently hidden. | Added print-specific hierarchy, intentional section pagination, visible masthead metadata, selected/not-selected labels, repeated page references and open-state-only sample signature fields. |
| Q15 | Medium | Container queries try to change properties on the query container itself; class-only rules can affect other mounted content. | Moved responsive inherited values to descendants, scoped selectors beneath the module root and added explicit narrow-layout rules. Actual browser reflow remains to be verified. |

## Commercial content retained

The original eight base selling amounts, three offer groups, option deltas, $4,500.00 discount, illustrative 10% GST, 30-day validity, 14–18-week lead time, 30/60/10 payment percentages and 12-month warranty example are retained. No new selling price or installation charge has been introduced.

| Default selection reconciliation | AUD |
|---|---:|
| Included base scope | $146,533.34 |
| Selected root-zone monitoring | $12,533.33 |
| Subtotal before discount | $159,066.67 |
| Project discount | −$4,500.00 |
| Total excluding GST | **$154,566.67** |
| Illustrative GST | $15,456.67 |
| Total including GST | **$170,023.34** |

The weather station and replacement pump are initially unselected. The retained customer pump carries no additional selling amount. Selection changes update the price reconciliation, overview, desktop summary, response review, technical pump description, affected supply wording and printed selection summary.

The fictional quotation reference is now `SYN-PPO-QUO-000142`. This identifier is a new preview fixture, not a verified seed record. The quotation itself remains R02; r03 denotes this design refinement. Application integration must map the preview to real synthetic seed identities without changing issued business records.

## Verification performed

**Local interactions:** Node.js and jsdom executed the HTML script without JavaScript or self-check errors. Seventeen check groups covered all eight option combinations; price agreement across document views; pump/scope consistency; focus restoration; consent reset; validation and field preservation; two-step review; cancel focus return; accepted-state locking; closed-state signature exclusion; decline handling; connection/error states; input escaping; source timezone; and teardown.

These are DOM and logic checks. jsdom does not prove browser layout, native dialog focus trapping, screen-reader behaviour, scrolling, media-query evaluation or print pagination in Chrome/Edge.

**Assets and isolation:** embedded logo bytes match the supplied PNG exactly. Font and image assets are self-contained. All qualified CSS selectors in the module stylesheet are scoped beneath `#ppo-quotation-module`; the standalone document wrapper, font definition and print page rules are intentional document-level concerns. IDs are unique.

**Print proof:** WeasyPrint 70.0 rendered the script-populated DOM to a static, seven-page A4 PDF. Each page was visually inspected. Corrections were made for heading wrapping, logo placement, specification pagination and signature-field alignment. The proof shows the default selection and is marked fictional. It is a static design proof, not an authoritative issue PDF or a verified output from the HTML's browser Print button. The PDF is not tagged for accessibility.

**Browser limitation:** the connected browser blocked both the local preview address and local-file navigation under its security policy. No alternate browser or policy workaround was used. Live browser checks therefore remain pending.

| Intended viewport | Responsive design supplied | Verification status |
|---|---|---|
| 1440 × 960 | Main document plus running summary rail | CSS/source checked; browser rendering pending |
| 1024 × 768 | Full-width document; summary rail hidden | CSS/source checked; browser rendering pending |
| 820 × 800 | Full-width document; wrapping section links | CSS/source checked; browser rendering pending |
| 390 × 844 | Two-column overview; single-column details/forms; stacked item rows | CSS/source checked; browser rendering pending |
| 320 px narrow reflow | Wrapping controls and amounts; one document column | CSS/source checked; browser rendering pending |

No PPO repository code was changed, no pull request or deployment was made, and repository foundation/database suites were not run for this standalone attachment refinement.

## Before live customer use

The next bounded step is to inspect this exact HTML in Chrome/Edge at the declared viewports and accept or amend the presentation. Then integrate it with the maintained quotation and issue contracts.

A connected implementation must provide the actual issuing legal entity and contact block; approved terms and exact supporting files; a customer-authorised projection; a version-bound immutable issued document; current access and lifecycle checks; server-controlled amounts and validity; durable responses with idempotency and unknown-outcome recovery; and a receipt only after a confirmed save. Privacy and signature wording must describe the service that actually exists.

The source's deposit trigger, invoice payment timing, warranty wording and order-of-precedence statements remain illustrative and require the normal commercial review. This audit does not approve those terms. Browser visual/accessibility verification and the live issue/acceptance service remain open; the local design file is complete.

## File identity and handover

| File | Bytes | SHA-256 |
|---|---:|---|
| Supplied r02 HTML | 74,261 | `f8fed2a73ab66c0422cdcaa073bf243b547f65b0d57ab88c8b42129523768673` |
| Refined r03 HTML | 906,890 | `7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a` |
| Static print proof r03 PDF | 353,413 | `8f9c625509863bba7f52a2a7c2c9c8a9b770226ad89a510924efa03c261c6219` |

Open `ppo-quotation-module-r03.html` in a desktop browser. Use **Preview settings** to inspect lifecycle, selection and connection states. Use **Reset preview** to return to the default fictional quotation. The file contains its own font, logo, styles and interaction script; no web server is required for normal local viewing. Edits and simulated responses are discarded on reload.
