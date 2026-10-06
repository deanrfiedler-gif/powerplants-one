# ES-07 owned reservation outcome reconciliation handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 4 October 2026. [Decision](../decisions/quotation-reservation-reconciliation.md), [contract](../contracts/quotation-supply-followup.md), [execution ledger](../testing/evidence/quotation-reservation-reconciliation/README.md). Implementation, proof, visual/owner acceptance and deployment are separate.

Previously held converted demands carrying a current Unknown ExternalOutcome/Reservation fact now have an executable native evidence reconciliation. The existing Supply owner accepts, returns or holds the exact referral; an accepted owner may retain/hold the position or review a Complete Confirmed/Failed/Absent observation of the exact original source operation. Apply separately executes the existing native fact command and returns its original receipt, successor fact, resulting demand version and full remaining position. It cannot perform or reverse the reservation.

The command preserves demand quantities/class, allocations and other demands. Purchasing, fulfilment, receipt, custody and return dependencies still require their owning workflows; all existing allocation and Forecast-disposition guards remain. Returned evidence changes the ES-07 basis. Fresh explicit disposition review/application may retain the resulting position or continue its hold; it never clears independent operational dependencies. Prior dispositions, notes, Activity completion and completed Supply work cannot resolve newly changed evidence.

Original quotation/issue/source line, completed conversion, referral, receiving, review/predecessor, native operation and receipt remain attributable. Workspace serialization and existing operation reservations prevent competing effects. Same-operation replay returns the original result under current authority; changed payload conflicts. Browser uncertainty retains the original through reload, and missing lookup stays inconclusive. Additive 0064 preserves all installed migration bytes, rows, grants and outputs; no new seed, capability, identity, dependency or service is added.

Final-source validation and exact PR head/check results are maintained in the execution ledger and PR. The first local database timeout reproduced on the unchanged #344 tree in a separate fresh cluster; neither failed run is claimed as passing. The initial build's newly introduced text-encoding error was corrected. No deadlines or test retries are changed. Both mandatory database shards, both broad browser invocations, both compiled proof groups and their aggregate gates remain intact.

Operational authority, signing, observation-age thresholds, item governance, live mappings and external reservation commands remain Not configured. MYOB, SharePoint and native CAD retain their responsibilities. Accepted native reference images, paired visual, physical-device, screen-reader and owner acceptance remain pending. This task does not merge or deploy. Next concrete increment: separately adopted shared receipt/inspection evidence correction with affected-demand receiving and conservation, preserving the distinction from external receipt reversal. Excel import and ES-09/10 remain separate.


The successful implementation checkpoint `126e21f` proves 22 dedicated PostgreSQL, five HTTP and 19 compiled browser/shared-control cases, plus an actual application/PostgreSQL restart recovering 30 exact original receipts and four unchanged output files. All 585 units and 59 full HTTP cases also pass at that source head. The execution ledger retains hashes and earlier failures. Final-head aggregate results remain an exact separate PR record; no pending check is labelled passing.

## Post-merge reconciliation — 5 October 2026

Merged #345 is `24f3f461da8d2046e53c34eddd1a685e05c1b316`. All 27 observed post-merge assurance checks completed successfully, separately from the 31 checks on final PR head `bd9be0fe8cdeb82724144c36de01f4871be5550b`. Exact check URLs/times are retained in `docs/testing/evidence/quotation-receipt-correction/main-postmerge-verification.json`. Earlier failures and repaired-head evidence remain unchanged. No hosted behaviour or deployment is verified here. The next candidate is now the separately adopted SYN-ES07-05 Receipt correction contribution; its validation and acceptance remain separate.
