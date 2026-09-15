# Powerplants One quotation PDF design: r02 change record

**Date:** 14 September 2026  
**Owner:** Dean Fiedler  
**Status:** Approved refinement scope implemented; six-page PDF visually checked; local viewer interaction checks passed. Native browser rendering and printing remain unverified.

## Delivered refinement

The r02 design applies the recommendations in `ppo-quotation-pdf-design-r01-audit.md`. It preserves the six A4 pages, full Powerplants logo, navy/green palette, quotation data and commercial amounts.

| Audit item | r02 implementation | Verification |
|---|---|---|
| QPDF-01: print readability | Substantive pricing descriptions, technical details, conditions, responsibilities and precedence text now use 9.5 pt; pricing titles use 10 pt. Small type is retained for metadata, captions and footers. Cover contact columns have equal widths so the estimator email fits naturally. | PDF text-size extraction and visual review of the six-page composition and detailed pages. |
| QPDF-02: repeated headings | Each detail page has one numbered heading; the repeated chapter line has been removed. | Five numbered detail headings and no duplicate chapter elements. |
| QPDF-03: type weights | Roboto 400 for reading, 500 for structural emphasis, and 700 for principal headings and total emphasis. | No 600-weight declarations remain; visual hierarchy reviewed in the PDF. |
| QPDF-04: viewer styling | Controls use the r11 profile: 6 px corners, shared neutral/border colours, a 2 px focus outline with 3 px offset, consistent outline icons, 40 px secondary controls and 44 px primary/mobile targets. Page and zoom selectors use rounded 14 px dropdown cards. | DOM and computed-style checks. Keyboard selection, Escape, Tab dismissal, focus return, outside dismissal and single-open-dropdown behaviour checked locally. Native browser appearance remains unverified. |
| QPDF-05: browser proof | Outstanding. | The connected browser previously blocked local preview access. No alternate browser workaround was used. |

The technical design-basis rows omit the repeated introductory phrase “Priced on the basis…”; the shared note still explicitly identifies them as pricing assumptions. All temperature, water-pressure, electrical-distance, access and network conditions remain present.

## Quotation consistency

Design **r02** is separate from quotation **R02**, `SYN-PPO-QUO-000142`. The eight base amounts, selected root-zone monitoring, retained customer pump, unselected options, discount, dates, payment milestones and warranty example are preserved.

- Base scope: **$146,533.34**.
- Selected root-zone monitoring: **$12,533.33**.
- Subtotal: **$159,066.67**; project discount: **$4,500.00**.
- Total excluding GST: **$154,566.67**.
- GST: **$15,456.67**; total including GST: **$170,023.34**.

The cover, pricing reconciliation and response summary agree. The fixture remains fictional, and its supporting files remain identified as unavailable in the sample.

## Verification and practical limits

The PDF is six A4 portrait pages. Visual review found no clipped text, overlapping content or broken price rows. Geometry checks kept text within the paper margins and measured the following clear space before the footer boundary:

| Page | Footer clearance |
|---|---:|
| 1 | 10.19 mm |
| 2 | 14.51 mm |
| 3 | 7.56 mm |
| 4 | 15.51 mm |
| 5 | 6.63 mm |
| 6 | 11.15 mm |

The embedded logo bytes match the original supplied PNG. Embedded Roboto remains self-contained. The HTML has unique IDs and no remote font, image or script dependencies.

Node.js and jsdom checks passed for page navigation, current labels, keyboard dropdown operation, cancellation and focus return, outside dismissal, zoom, margin guides, print invocation and price agreement. These checks do not establish native browser layout, screen-reader behaviour or browser print pagination. The PDF engine's static viewer specimen is not browser evidence.

The PDF was rendered from the quotation HTML with WeasyPrint. Use A4 portrait, 100% scale and disabled browser headers/footers when reviewing browser print output. The HTML's review notes state that native Chrome/Edge output remains unverified.

## Reference and version control

Presentation follows the supplied Powerplants brand guidelines, the r11 theme/style board reviewed in the preceding audit, and PPO's documented navy-action direction. No repository application implementation is included in this document refinement.

The predecessor files remain available as the prior revision. File identities for the HTML and PDF continue through the r02 update.

| File | Bytes | SHA-256 |
|---|---:|---|
| ppo-quotation-pdf-design-r01.html | 2,940,489 | `206cec53254996d4b857ae41f675312bc78dae3aa4555394a535632ddc8db45c` |
| ppo-quotation-pdf-design-r01.pdf | 346,995 | `3b5fd4c48df2ea2660a0098b4d3c39272cdf41fddf8e5f9d21c9922a4dc2f465` |
| ppo-quotation-pdf-design-r02.html | 2,951,669 | `827cd1c0606b4bdce2e96f0dc75d3c6cc95aeebb3e817c7e5131df2a4c3a84ec` |
| ppo-quotation-pdf-design-r02.pdf | 345,671 | `daab5b91ac6f48322e6604e02f0da437c3e036c1aa1c668b99aa7dcf7317d99e` |
