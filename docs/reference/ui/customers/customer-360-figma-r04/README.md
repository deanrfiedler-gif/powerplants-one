# Customer table alignment captures

Owner: Dean Fiedler. Review: proposed; owner acceptance pending.
Captured 14 October 2026 from the private PPO - Design file, Customer 360 (proposal), page node `554:2`.
Named Figma version: pending before baseline reliance. No private file URL or licensed icon artwork is retained.

Dean requested that tables/registers use the established style of the other PPO Figma pages. Comparison used the accepted Leads register `190:20513`, its Lead grid header `196:23379` and row `196:23346`. The shared Grid / Header cell components are `74:9` (left) and `74:11` (right); all 77 headers across 16 Customer table instances now use those components. The existing library mains remain unchanged.

The common treatment is a white 40 px header, Roboto Medium 14/20 text, white rows, 12 px horizontal cell insets, thin semantic border/line column and row rules, and square table edges. Customer rows use 64 px to retain name/reference and contact/follow-up metadata. Simple one-line rows use 40 px. Other source-evidence rows grow to 64–104 px so notes, unknowns and authority distinctions remain legible. Body cells with multiple source fields remain page-local editable compositions styled to the shared Grid / Cell pattern, not a new shared runtime component. Selection/bulk controls are not introduced into read-only tables merely for visual similarity.

## Retained evidence

Each 1440 × 900 PNG is a viewport capture. Temporary copies were detached and every Icon component replaced with `Icon/placeholder` (`67:77`). A separate read found 31, 47, 38 and 37 placeholder icons respectively and zero other Icon components. The four PNGs were visually inspected; capture-only frames were removed. Brand artwork is retained.

| File | Source frame | SHA-256 |
|---|---|---|
| register-desktop.png | `603:1396` | `1d39b99a1f504899ccf06288790fed9b89563c3905c210b1df8d6e7a907c504b` |
| sales-orders-desktop.png | `555:161669` | `7bc5a5beb1789da3c1a0577e455aa456ec04361ca7d0709399c8782e7dd9372a` |
| quotations-desktop.png | `555:161897` | `27c62116be8eae5e0cabefbc2ade7f489a25145ac3f0fb0fa451d1e9b7d6aa86` |
| sites-desktop.png | `557:4585` | `8c53fb38e82437eb9c1c98cd2b6fd4d0679bc16559dcb6a4848d800e35463f9e` |

The current phone register and both customer-overview references remain in the [r03 manifest](../customer-360-figma-r03/README.md). The r03 desktop register is the earlier table treatment; r04 is current for that view. Earlier captures and issued HTML/report remain byte-for-byte unchanged.

## Table inventory and checks

| Table | Node(s) |
|---|---|
| Sales orders | `555:161743` |
| Quotations / opportunities | `555:161944` / `555:162053` |
| Appointments | `556:284` |
| Project deliverables | `556:406`, `556:495` |
| Project variations | `556:447` |
| Facilities and areas | `557:4642`, `557:4757` |
| Site parties / contacts | `557:5029` / `557:5058` |
| Permitted account observations | `558:4858` |
| Customers: all / descending / search / due today | `603:1863`, `604:1533`, `604:1723`, `604:1914` |

Read-back covered 16 tables, 77 header instances and 51 rows. Every header is 40 px, every table has square edges, and header text and unclipped row content stay within their cells. Row IDs, source facts and record reactions are preserved. Desktop Name sorting was transferred to its new shared header and read back. Agent visual inspection covered Customers, Sales orders, Deals & quotations and Sites & equipment; a paint fallback issue was corrected before these final captures. This is structural/visual evidence, not browser interaction, keyboard or physical-device acceptance.

The register/customer prototype contract and remaining limits are unchanged from r03. Scope CS-01 and parent IDs CRM-01, CRM-04, CRM-06, SVC-06 are retained. Native code, permissions, business authority, deployment and owner acceptance are unchanged. See the [design decision](../../../../decisions/customer-360-figma-design.md).
