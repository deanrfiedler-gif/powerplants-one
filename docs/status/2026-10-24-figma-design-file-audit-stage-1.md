---
title: Figma design file audit, stage 1
date: 2026-10-24
---

A read-only audit of the private "PPO - Design" Figma file is recorded in the [Figma file audit](../design/figma-file-audit/figma-file-audit-2026-10-24.md), answering Dean's seven questions:

- scope IDs in page names
- style and theme
- shared components
- superseded pages
- conflicts
- gaps
- improvements

All 172 pages were listed. The 150 design pages were measured by 23 read-only plugin scripts and cross-checked against the design register, the cited decision records and the open pull requests. Nothing in the design file was changed. The Figma seat's call limit refused 14 calls, which changed nothing.

Main findings:

- 1,346 detached top-bar and phone-header copies remain because the accepted shell amendments were never merged into `Shell / Top bar`.
- The Receiving · SC-04 page carries Workshop builds' accepted header.
- Two pages carry unfilled template headers.
- Six accepted designs are still mid lock-in.
- 107 components still sit on accepted pages.
- 27 page names lack a scope ID; all of them are cited by repository records.
- The Controls library has no form controls.
- Ten scope IDs have no design.

The counts are scripted measurements, not visual review.

Dean adopted the recommended answers to R1–R11 the same day: "Proceed with your recommendations for R1–R11 and start stage 2 with the safe fixes first." The safe fixes are done and listed in section 12 of the report. They cover:

- the SC-04, FN-05, EQ-06 · EQ-07, CP-06 and EN-04 page headers
- duplicate and generic flow names that no record cites
- four empty nodes
- template layout passes on CP-06 and EQ-06 · EQ-07
- section fits on five proposal pages
- the File index subtitle and a Reporting group

The remaining stage 2 steps wait for Dean's named version. No build, review, acceptance or deployment status changes.
