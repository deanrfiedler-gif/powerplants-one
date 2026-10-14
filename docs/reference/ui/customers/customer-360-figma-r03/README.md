# Customers register and Customer 360 captures

Owner: Dean Fiedler. Review: proposed; owner acceptance pending.
Captured 14 October 2026 from the private **PPO - Design** file, page **Customer 360 (proposal)**, node `554:2`.
Named Figma version: **pending before baseline reliance**. The private URL and licensed icon artwork remain excluded under ADR-0053.

Dean requested a Customers register whose individual rows open the matching Customer 360 workspace. This extends CS-01 with the r20 **Register / worklist** entry and retains **Record detail / Overview dashboard** receiving pages. The issued 16 September 2026 fixture supplies exactly two canonical customers, three sites and thirteen non-finance follow-ups; one follow-up is due on the scenario date. Population counts are synthetic and role-bounded.

Temporary copies were detached for capture only. Every Icon component was replaced by `Icon/placeholder` (`67:77`); a separate read found 25, 14, 29 and 46 placeholder icons respectively and no other Icon component. All four PNGs were visually inspected and the temporary frames removed. Live frames retain editable layers and private artwork. The issued HTML/report and r01/r02 captures remain unchanged.

| File | Source frame | Viewport | SHA-256 |
|---|---|---|---|
| register-desktop.png | `603:1396` | 1440 × 900 | `eee0bc0eb4a62b5aea67ad4656fc626a97c6146b2e8e9413c30e25a57f495455` |
| register-phone.png | `606:1873` | 390 × 844 | `19d81e197c33522a4ecc7c9cf66f9a34ae10ae68e556bdeebb0d75953cb35825` |
| rothwell-desktop.png | `605:1734` | 1440 × 900 | `2441b5bd3c111f14346244c417fceddecb8a407478d3a37ed62eae39ce74cf92` |
| willowbank-desktop.png | `554:3` | 1440 × 900 | `d856e388bb60329391ac36a4aaccc00a42ffbfd1599da335c9c3d72424a0a6fb` |

## New frames and prototype contract

| View | Node |
|---|---|
| Desktop register / name ascending | `603:1396` |
| Desktop register / name descending | `604:1481` |
| Desktop register / preset Willowbank search | `604:1671` |
| Desktop register / follow-up due today | `604:1862` |
| Phone register / all customers | `606:1873` |
| Phone register / preset Willowbank search | `607:1921` |
| Phone register / follow-up due today | `607:2024` |
| Rothwell Customer 360 / desktop | `605:1734` |
| Rothwell Customer 360 / phone | `607:2126` |

The two register frames are the page's prototype start points. Rows/cards for `SYN-PPO-ORG-000101` open Willowbank (`554:3` desktop, `559:250` phone); `SYN-PPO-ORG-000102` opens Rothwell (`605:1734` desktop, `607:2126` phone). Desktop Name toggles A–Z/Z–A. Search is a fixed Willowbank demonstration, not typed text. Due today selects Willowbank; Clear restores the full register. No additional customers, lifecycle status or financial population is fabricated.

A hidden, prototype-only String variable `customers/register-return-view` (`VariableID:608:2057`) remembers the originating frame. All 48 Back, Change customer, Customers-rail and applicable breadcrumb controls use conditional return actions with scroll reset disabled. This covers returning after moving between the existing Willowbank detail views. It is Figma reaction read-back, not runtime persistence or browser click-through evidence.

Rothwell contains its own overview, follow-ups, contact, quotation, sales order, case, project, site/equipment, restricted Accounts, activity and identity/mapping sections. Its desktop menus and phone summary/bottom links scroll to those sections; the desktop Overview selection does not dynamically track scroll. No Willowbank record text was found in either Rothwell frame. Existing Willowbank view navigation and snapshots remain intact.

## Verification and limits

Agent visual inspection covered the desktop register, due-today state, phone register, both desktop customers and Rothwell phone. The nine new frames have no horizontal overflow in unclipped auto-layout containers. Exact row/card destinations and all conditional returns were read back from Figma. Shared Summary cells were aligned to 228 × 112 px in the Rothwell desktop view; a post-fix screenshot passed visual inspection.

These are editable design and bounded prototype examples. Free-text search, arbitrary combined filters, paging beyond two fixtures, loading/empty/error variants, keyboard/screen-reader behaviour and physical-device acceptance remain implementation/review work. A dedicated Rothwell phone PNG is not retained in this issue; its frame was inspected in Figma. Rail collapse/More and external module commands remain visual specifications. No runtime, migration, integration, deployment, accepted baseline or owner approval is changed.

Issued HTML SHA-256: `ce8b117f5b62615389111c59e479f606c8c50b7b3c218cde5e5d86cd14edeab8`.
Issued report SHA-256: `807138737bd15f8b7c5d03f832497ad9f6bfee42372852db50d2dff954bb8be6`.
Scope **CS-01**, parents **CRM-01, CRM-04, CRM-06, SVC-06**, MYOB financial authority and SharePoint document authority remain unchanged.

See the [design decision](../../../../decisions/customer-360-figma-design.md) and [working register contract](../../../../design/development/pages/route-customers.md).
