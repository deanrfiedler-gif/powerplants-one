# Job Pack integration handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. SV-05 / SC-06; SVC-03, SVC-06, OUT-09. I5 is the final bounded Job Pack increment, after I4 #304, I6 #306 and I7 #309. This record does not close the wider SV-01–SV-08 programme.

## Delivered behaviour

Field Technicians and appointment detail open the canonical permitted pack, or offer preparation when no visible pack is returned and the server permits preparation. Failed/denied/loading reads remove stale links. Header actions follow the adopted limit, with appointment context in section 01 and earlier exact issue access retained. Browser A4 print releases the shell’s clipping containers and includes all saved sections, a repeating reference/revision/state and page numbers; the workbench warning distinguishes it from the exact controlled issue. Unsaved form entries are excluded. The production output mechanism and domain authority are unchanged.

The phone shell correction fixes utility icons falling into the navigation row under the legacy identity-dependent grid rule. The separate CRM phone filter row remains. Unused legacy pack CSS is removed only after checking actual consumers. [Integration conformance and adaptations](../decisions/job-pack-integration.md) preserve all adopted departures.

## Verification

Actual-component conformance: two passed / four deliberate project skips. Compiled I4/I6/I7/I5, Field Technicians and shell regression: 46 passed / seven deliberate skips, including warm-up. Final print correction: six focused compiled checks passed / one deliberate skip, including warm-up; safe print-string unit proof passed. Typecheck, changed-file lint, production build, studio, foundation and naming checks passed. All 41 tokens match the accepted reference in an independent read of a permitted persisted pack. Five-page A4 inspection verifies repeating reference/revision/state/page count, no unsaved text and the final section. Paired captures include six widths and accurately labelled 200% reflow emulation. Existing I4/I6/I7 handovers retain earlier proof and local limitations.

I6 PR #306 has all 18 checks passing. I7 PR #309 has an isolated dev-server Planner schedule-refresh wait timeout at planner.spec.ts:415; its compiled sibling suite passes, and I6 passed the unchanged Planner test. An unchanged-commit retry is planned after the workflow finishes; GitHub refused the request while its database job was still active. No Planner code or timeout is changed on inference alone. Its final CI result remains separate from I5 local proof.

[Evidence](../testing/evidence/job-pack-i5/README.md) contains application/reference pairs, exact capture context and visual findings. The absent historical five reference uploads are distinguished from newly generated r03 reference captures. Three shared token differences remain an owner decision. Owner/device acceptance, screen-reader review and deployment are not inferred from these checks.
