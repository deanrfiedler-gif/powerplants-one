# Powerplants One quotation PDF design: r01 audit

**Audited:** 14 September 2026  
**Owner:** Dean Fiedler  
**Scope:** `ppo-quotation-pdf-design-r01.html` and its matching six-page A4 PDF.  
**Conclusion:** Professional and broadly aligned with Powerplants One. Suitable for design review; a focused r02 polish is recommended before the presentation is adopted as the final quotation template.

## Assessment

The design has a clear commercial hierarchy, an appropriate corporate masthead, consistent page furniture and a prominent quotation total. Its navy, green, white and restrained grey treatment belongs to the PPO visual language. The lighter cover is a reasonable, print-conscious refinement of the supplied brand guide's proposal example, consistent with the permission to improve the document.

The principal weakness is reading comfort in the detailed pages. Too much useful information is treated as small supporting text. The HTML viewer also uses some earlier or independently chosen style values, rather than a clearly selected current PPO control profile. These are targeted refinements; a wholesale redesign is unnecessary.

The printed quotation should retain its corporate document identity. Application rail dimensions, deal-card geometry, drawers and module navigation do not belong on its A4 pages. Screen control styles apply to the surrounding HTML viewer; print typography and millimetre-based page geometry require their own documented adaptation.

## Findings and recommended changes

| ID | Priority | Evidence in r01 | Recommended r02 treatment |
|---|---|---|---|
| QPDF-01 | Medium | Page 2 line descriptions use 8 pt, reconciliation notes 8.5 pt; page 3 uses 8–8.8 pt for much of the specification, assumptions and option detail; page 5 responsibilities use 8.7 pt and precedence uses 8–8.3 pt. | Make substantive scope, conditions and responsibilities at least 9 pt, preferably 9.5–10 pt where space permits. Reserve smaller type for references and footer metadata. This is a readability recommendation, not a claimed brand minimum or accessibility standard. |
| QPDF-02 | Low | Pages 2–6 put a numbered chapter label immediately above a heading that repeats much of the same wording. For example, “02 / Scope and pricing” precedes “Scope and pricing”. | Use one numbered page heading. Reuse the recovered vertical space for larger detailed text and comfortable section spacing. Keep the existing six-part information sequence. |
| QPDF-03 | Low | Major headings and much emphasis use weight 600. The current style board explicitly identifies Roboto 400 / 500 / 700 for reading, structure and emphasis. | Use 700 for the principal title and page headings, 500 for structural labels and subheadings, and 400 for reading text. Retain a print-specific size scale; the app's pixel sizes need not be copied onto paper. The existing typeface is correct. |
| QPDF-04 | Medium for the viewer | Viewer controls declare a 5 px radius, 38 px minimum height, 40 px on small screens, and a 3 px `#2765c5` focus outline. The r11 shared profile uses 6 px control corners and a 2 px `#365d8b` focus outline with 3 px offset, with distinct dense and primary/mobile control sizes. | Align the viewer with one documented current profile: 6 px corners, shared border/secondary-text tokens, consistent outline arrows, 44 px primary/mobile targets and a compact secondary control size. Match current rounded dropdown-card presentation where the viewer is intended to reproduce PPO's app controls. Native selects remain functional; their operating-system popup appearance cannot establish exact visual parity. |
| QPDF-05 | Verification outstanding | The supplied PDF was produced with WeasyPrint. There is no native Chrome/Edge evidence for the HTML's Print button, sticky viewer, zoom, page tracking or narrow-screen toolbar wrapping. | Verify the exact refined HTML in Chrome/Edge at desktop and phone widths and print at A4/100% with browser headers and footers disabled. Confirm six pages, intact totals and footers, visible branding and usable keyboard navigation. This is an outstanding check, not an observed browser defect. |

The older `#606977` secondary text and `#dce0e5` dividers are grounded in the repository style specification; they are not invented off-brand colours. The newer board uses a different shared neutral profile. Harmonise the viewer deliberately, while preserving sufficient contrast in the printed document.

## What already works

| Area | Audit result |
|---|---|
| Brand palette | Exact navy `#242a37`, green `#62bb46` and white. Navy carries primary emphasis; green is restrained. |
| Company identification | The original complete supplied PNG is embedded unchanged six times. The full corporate mark is appropriate for this document. |
| Logo size | Calculated visible artwork height is approximately 21.1 mm on the cover and 16.2 mm on subsequent pages, exceeding the brand guide's 15 mm print minimum at 100% scale. Aspect ratio and transparent padding are preserved. |
| Typography | Embedded Roboto, Verdana fallback, normal letter spacing, left-aligned narrative and tabular numeric figures. |
| Commercial hierarchy | Project/customer/site information is easy to locate. The opening total is prominent; line amounts and reconciliation are right-aligned. |
| Options | Selected root-zone monitoring is labelled and included. The weather station and replacement pump are explicitly excluded from the total. Meaning survives without green colour. |
| Page layout | Six A4 portrait pages with consistent headers, quotation references and page numbers. No visible clipping or overlaps were found in the supplied proof. Recorded render geometry leaves approximately 5.5–14.8 mm between content and the footer boundary. |
| Print presentation | Review controls are outside the printed pages. Page backgrounds remain predominantly white, with a restrained navy total panel. |
| Portability | The font and original logo are embedded; the standalone document does not require remote font or image requests. |

Calculated text-pair contrast is 14.37:1 for white on navy, 5.55:1 for the current grey on white and 5.34:1 for the selected-option green text on its pale background. These checks support the colour choices; they do not establish whole-document accessibility or physical printer performance.

## Commercial consistency

The default source amounts and selections remain consistent across the cover, pricing page and response summary:

| Reconciliation | AUD |
|---|---:|
| Base equipment and services | $146,533.34 |
| Selected root-zone monitoring | $12,533.33 |
| Subtotal | $159,066.67 |
| Project discount | −$4,500.00 |
| Total excluding GST | **$154,566.67** |
| GST | $15,456.67 |
| Total including GST | **$170,023.34** |

The sample identity, contact details, response wording and unavailable supporting-document references are deliberate fixtures. They are appropriate for this design review, but the acceptance page is not final customer-issue copy. Populate the maintained issuer/contact details and approved response wording when adapting the design for actual issuing. This audit assesses presentation and consistency, not commercial terms or an operational acceptance service.

## Evidence and limits

- Audited [HTML reference](ppo-quotation-pdf-design-r01.html) and [matching PDF](ppo-quotation-pdf-design-r01.pdf). The saved files retain their issued r01 bytes.
- Supplied Powerplants Brand Identity Guidelines: logo treatments and clear space, pages 7–8; minimum size, page 9; typography, page 17; primary colours, page 18; proposal template, page 39. The alternate logo's existing private-preview authorisation is retained; this audit makes no wider brand-approval claim.
- Latest retrieved `powerplants-one-theme-style-board-r11.html`, current file version 5, modified 14 September 2026. Its typography, control, geometry and full-logo guidance were read directly. It retains source-specific profiles and proposed extensions; it is not evidence that every pattern is implemented in the app.
- Repository checked at `d069ea3e0a0e82034bb47e501e1c293d12933cd2`: [Shared UI style specification r06](https://github.com/deanrfiedler-gif/powerplants-one/blob/d069ea3e0a0e82034bb47e501e1c293d12933cd2/docs/standards/ui-style-specification.md) and [accepted r08 presentation decision](https://github.com/deanrfiedler-gif/powerplants-one/blob/d069ea3e0a0e82034bb47e501e1c293d12933cd2/docs/decisions/shared-ui-r08-implementation.md). The later decision supersedes the original green primary-action direction.
- Reviewed the six-page visual overview and detailed page captures; verified current PDF page count, A4 dimensions, text sizes, page references, embedded logo bytes and file hashes. Existing DOM checks cover navigation, zoom, margin guides, print invocation and total agreement; those checks are not browser rendering evidence.
- The connected browser previously blocked local-preview access. Native browser and physical printer verification remain open. No alternate browser workaround was used.

| Audited file | Bytes | SHA-256 |
|---|---:|---|
| HTML r01 | 2,940,489 | `206cec53254996d4b857ae41f675312bc78dae3aa4555394a535632ddc8db45c` |
| PDF r01 | 346,995 | `3b5fd4c48df2ea2660a0098b4d3c39272cdf41fddf8e5f9d21c9922a4dc2f465` |

**Recommended disposition:** retain the current design direction and apply QPDF-01 to QPDF-04 as a bounded r02 polish. Close QPDF-05 before claiming that the HTML's browser print output has been verified.
