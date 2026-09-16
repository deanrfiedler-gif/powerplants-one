# Screen Systems r02 source

This successor uses the supplied normalized workbook and rules report to refine ES-08. `evidence.js` contains sanitized source metadata, not historical customer, quantity or commercial fixtures. `model.js` implements bounded recovered quantity rules and review-state safeguards; `workspace.js` and `workspace.css` provide the r20 interaction design.

Build with `python3 scripts/build-specialist-r02.py`. The assembler reuses the existing embedded font CSS and emits `docs/reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r02.html`. The issued r01 package and original source are preserved.

The report defines the coverage boundary, remaining defects, all 61 primary controls and five additional-screen slots. Twenty-six synthetic model groups exercise meaningful arithmetic and recovery risks. Native interaction and visual evidence is recorded separately under `docs/testing/evidence/specialist-r02`.

This is a source-informed review tool. Current catalogue selection, approved ranges, engine acceptance, server permissions and application integration remain separate. No new framework or dependency is introduced; the architecture rationale continues the established standalone design approach in the decision record.
