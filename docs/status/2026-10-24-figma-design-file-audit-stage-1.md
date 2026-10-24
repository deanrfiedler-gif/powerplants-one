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

The counts are scripted measurements, not visual review. Decisions R1–R11 in the report wait for Dean, and stage 2 (clean-up) has not started. No build, review, acceptance or deployment status changes.
