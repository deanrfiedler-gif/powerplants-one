---
document_id: PPO-PD01-DISCOVERY-EVIDENCE
title: Products discovery proposal evidence
date: 2026-10-14
owner: Dean Fiedler
status: Proposed design captures; named version and owner acceptance pending
source_commit: 65141dc
versioning: git
---

# Products discovery proposal evidence

Private Figma file **PPO - Design**, page **Products · PD-01 · discovery proposal**, node `653:38`. See the [proposal and acceptance criteria](../../../decisions/products-discovery-proposal.md). All values and identities are fictional design fixtures, not operational records. These new captures leave all earlier issued reference bytes unchanged.

The editable page uses local PPO typography/colour/layout tokens and 127 component instances, including Button, Tag, Grid cells/headers and shell parts. All icon instances on this page use `Icon/placeholder`; private Pro artwork and the private Figma file URL are excluded. Existing library/accepted pages were not edited. Each PNG is a 1× viewport capture exported after inspection and correction of text-height clipping and the tablet header. Content below the phone/tablet viewport is intentionally scrollable; a viewport capture is not evidence of every off-screen interaction.

| Capture | Figma node | Pixels | SHA-256 |
|---|---|---|---|
| [catalogue-1440.png](catalogue-1440.png) | `653:46` | 1440 × 960 | `bfac7ab483180e214cf5ae635eedea94f48ddfac884e5e201a1605c0c231ca15` |
| [product-1440.png](product-1440.png) | `654:167` | 1440 × 960 | `7b47b59722e05540fd5f5900ff751f278835a73ce7185914ef40b1c4a0e75fbf` |
| [product-1024.png](product-1024.png) | `654:325` | 1024 × 768 | `cc39d63438590becd52009a5189fd2c511c113e7f0935d1e0820389bf363ffa2` |
| [catalogue-390.png](catalogue-390.png) | `657:371` | 390 × 844 | `e7826174629fb620fbc13e97824ee1fbeb7447a1265f1e604a594a792cdbd4a1` |
| [product-390.png](product-390.png) | `654:482` | 390 × 844 | `eb55ccfbcff1e62e8774e24e93e45c5b119cd1d169fded30e9a958af871dd4bb` |
| [unlinked-320.png](unlinked-320.png) | `654:563` | 320 × 844 | `5d11626af797e558d2c5732fe4b3209e146544711a159282e4812d17620a3d57` |
| [states.png](states.png) | `657:428` | 1440 × 980 | `946043a4fa2e6a800cdfe44bce3dc35f6a340e12d9f783ce53d6e6859a348d3e` |

## Verification and limits

- Visual inspection: six screen layouts and the state/handover board. Catalogue-to-detail and Back reactions are configured; other controls are illustrative. The state board is a requirements annotation, not a set of executed runtime cases.
- Source comparison: PPO source at `65141dcb8a3e39f6516f69955e8260ed447d152b`, prior native Products and SC-05 captures, and bounded inFlow sample-account UI observations on 14 October. No fresh running PPO walkthrough, source integration, business write or REA session occurred.
- Named Figma version: **pending**. Browser editor could not open because WebGL was unavailable; the connector lacks named-version creation. Suggested name: `Products discovery — proposal for review — 14 Oct 2026`. ADR-0053 requires the version before baseline reliance.
- Owner visual review, accessibility/browser/device acceptance, application implementation and deployment: **not performed by this proposal**. Existing review fingerprints are preserved.
- Icon audit: all 51 icon instances on the proposal page resolve to `Icon/placeholder`; no other icon component is present. This audit is separate from the visual inspection.

| Executed check | Result |
|---|---|
| `npm run studio:check` | Passed; 362 entries, 208 source routes, no integrity errors. Existing 334 unreviewed and 28 stale entries remain visible; this proposal grants no acceptance. |
| `python scripts/check_naming.py` | Passed; 608 document records, 447 metadata comparisons, no errors. |
| `python scripts/check_foundation.py` | Passed; all 78 parent requirements retained, 9,495 local links checked, 5,958 text files scanned, no errors. |
| `git diff --check` | Passed. |

These checks provide documentation/design assurance, not business acceptance. Runtime tests were not applicable because no application code or behaviour changed. PR CI is separate from the executed local checks above.
