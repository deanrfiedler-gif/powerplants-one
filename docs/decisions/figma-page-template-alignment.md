---
document_id: PPO-DES-FIGMA-ALIGN-DEC
date: 2026-10-17
owner: Dean Fiedler
status: User decision; 14 of 16 approved re-skins, the archive move, the File index fixes and the My jobs tidy-up are done in Figma; Quotations and Job pack re-skins wait on their lock-ins; no accepted design decision changed
versioning: git
---

# Figma pages aligned with the Template — 17 October 2026

On 17 October 2026 Claude audited every design page in Dean's Figma working file "PPO - Design" against the Template · App page (`626:20`, [ADR-0055](ADR-0055-figma-file-structure.md)), the accepted shell, the components consolidated on Components `1:4` that day, the File index (frame `630:2`) and the decision records here. Claude then presented a register classifying each page as Keep, Re-skin, Update or Archive. A re-skin is structural only: it adds the Template's page header and Sections and leaves every frame and its content as they were. An update would be a content amendment. The audit found none.

This record keeps Dean's decision, what changed in the file, how it was checked and what is still open. It changes no accepted design, no page or frame name and no node ID that a record here cites.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Approve the register | User decision, 17 October 2026 | "I approve the register as proposed: the 16 re-skins (Quotations after the A1 lock-in, Job pack after the gate's named version), archive Shell v2 73:4, the File index text fixes and the My jobs tidy-up." |
| Re-skin before the top-bar lock-in | User decision, 17 October 2026 | Asked whether to start the ready re-skins now or wait for the shell top-bar lock-in, Dean chose "Start now (Recommended)". A re-skin moves frames with their IDs and instance links, so the top bar's later swap still reaches every frame |
| No content amendments | Audit result | The live-app UX audit of 16 October lists the app's divergences from accepted designs, such as Work orders, the Deal record, Quotations and My jobs not being built to their designs. They are build gaps, not stale designs |
| No renames | ADR-0055 rule 2 | Records here quote frame names that end "(proposal)", and several quote page names. Both are kept. The File index and each new page header carry the status |

## 2. What changed in the file

**Re-skinned (14 pages).** Each page now opens with a "Page header" cloned from the Template. Its declaration is copied from the page's decision record here, and its lede names that record as the authority. Below it are the Template's five Sections: Desktop 1440, Tablet 1024, Phone 390 and 320, States, and Flows and notes. Existing frames, their "Label /" captions, states boards and notes cards were moved into those Sections. A Section the accepted design never drew holds a one-line "Not drawn" note.

| Page | Node | Page header |
|---|---|---|
| My Work (accepted) | `404:2` | `1125:3559` |
| Leads (accepted) | `190:20237` | `1123:1323` |
| Lead record page (accepted) | `224:2` | `1123:5332` |
| Intake & workload (accepted) | `128:8845` | `1121:1687` |
| Sales briefs (accepted) | `152:1122` | `1115:1273` |
| Estimation Wizard (accepted) | `383:2` | `1126:21558` |
| ES-02 Priva Fertigation Workbench (accepted) | `408:4` | `1126:11081` |
| Cost sources (accepted) | `133:2366` | `1116:1560` |
| Reviews & approvals (accepted) | `56:2` | `1119:1061` |
| Engineering workload (accepted) | `184:1047` | `1122:1496` |
| Projects (accepted) | `209:46` | `1128:1231` (declaration from `projects-register-design.md` in pull request 552, not yet merged) |
| Project record page (accepted) | `345:2` | `1125:7168` |
| Work orders (accepted) | `193:18953` | `1122:3410` |
| Work order record page (accepted) | `312:2` | `1126:5236` |

**Stale component labels removed.** The main components drawn on these pages moved to Components `1:4` earlier on 17 October, with their IDs unchanged. The 34 headings and labels that described them were removed and replaced by one note per page in Flows and notes. No record here cites any of them:
- Work orders: 5.
- My Work: 1.
- Project record: 2.
- Work order record: 5.
- Fertigation: 12.
- Wizard: 9.

**Archived.** Shell v2 (proposal) `73:4` now holds only its notes header `82:1403`, because its components are on Components. It moved under "— Archive —" and its File index row now reads Archived. Its name and ID are unchanged, so the records that cite it, including [figma-ui-implementation.md](figma-ui-implementation.md), stay correct as history.

**File index text.** These rows said "draft PR … not merged" for pull requests that have since merged:
- Deals (proposal) now reads "proposal; owner acceptance pending".
- Customer 360 (proposal) now reads "proposal; owner review pending".
- UX benchmark exemplars now points to [ux-benchmark-research-direction.md](ux-benchmark-research-direction.md) and [ux-benchmark-decisions-2026-10-16.md](ux-benchmark-decisions-2026-10-16.md).

**My jobs · FI-01 `845:44`.** The leftover copy of the Template's "How to use" card (`845:80`) and an empty "Page components" heading (`857:1480`) were removed.

No named version was saved. No page was deleted, no component was edited and no top bar or breadcrumb was changed.

## 3. Verification

- **Frames unchanged.** For 11 pages, every moved frame was fingerprinted before and after its move. The fingerprint covers type, name, parent-relative transform, size, text, fills, opacity, visibility and prototype reactions of every layer. All 11 pages matched exactly: Intake & workload, Engineering workload, Work orders, Leads, Lead record, My Work, Project record, Work order record, Fertigation, Wizard and Projects.
- **First three pages.** Sales briefs, Cost sources and Reviews & approvals were moved before that method was settled. Their instance totals match the audit (533, 622, 445), their per-frame layer and reaction counts match (Cost sources), and the screenshots are unchanged. Two earlier checks reported false differences:
  - PNG hashes changed with canvas position, because of sub-pixel rasterising.
  - An absolute-position fingerprint showed 0.1 px glyph jitter. Reproducing the move on Intake & workload gave the same jitter, and restoring the frame gave an exact match.
- **Instances and flows.** Every page has the same instance total before and after. Its prototype flow starting points are identical.
- **Screenshots.** Each page header and Desktop section was checked with `node.screenshot()` inside the plugin, without using the MCP read allowance.

## 4. Open

- **Quotations (accepted) `123:40`:** re-skin after the A1 amendment's lock-in (session "Lock in and build Quotations in Sales and Estimating"). The A1 Section stays as it is.
- **Job pack (accepted) `272:2`:** re-skin after Dean saves the named version "Field readiness gate — accepted" ([field-readiness-gate-proposal.md](field-readiness-gate-proposal.md)).
- **Proposal pages:** Deals `549:2`, Customer 360 `554:2` and ES-08 `406:2` are re-skinned when each is accepted.
- **Top bar:** every page still uses Shell / Top bar `35:138` with the old breadcrumbs. The R1–R9 propagation belongs to the top-bar lock-in.
- **Captures:** the Captures page `115:2` holds 6 instances of a deleted proposed top bar `1067:117505`. This is reported only.
- **App areas with no design page:**
  - Equipment, and Schedule (exemplars only).
  - Maintenance and warranty, Finance, Admin and access (AD-01 is an HTML design here), and Email and calendar.
  - Engineering beyond EN-01, and Projects acceptance and programme.
  - Sales aftercare, handoffs, pulse and tasks.
  - Service tickets, appointments, incidents, inspections, reports and technicians.
  - Field inspections and site readiness, and Supply chain beyond Inventory.
  - Sites, people, contacts, facilities and surveys.
  - Products compatibility, import, pricing and publication.
  - The estimate record, and the quotation record and its sub-pages.
  - Search and Home.

  Each of these is new design work, not alignment.

## Related

[ADR-0053](ADR-0053-figma-page-design.md) (Figma for page design) and [ADR-0055](ADR-0055-figma-file-structure.md) (file structure, Template and File index). The decision records of the 14 pages above stay the authority for their designs.
