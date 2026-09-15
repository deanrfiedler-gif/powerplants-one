# Requirement register

[requirements.csv](requirements.csv) indexes all 78 parent requirements from Master Blueprint v02: 66 functional and 12 non-functional. It preserves the exact proposed requirement wording and adds Appendix B evidence, owner role, release allocation, dependency/specification and planned acceptance references.

`initial_backlog_ids` maps each parent to at least one initial discovery/design work package. That mapping is not proof that a single issue fully implements or tests the parent. Split accepted scope into child requirements as the module specifications develop.

The issued master owns the source requirement text. This CSV is a derived index; the foundation check detects missing/duplicate IDs, altered source wording and invalid initial-backlog or acceptance references. GitHub issue status describes work execution. Requirement approval, implementation and test status remain explicit and separate.

The original CSV retains the issued proposal wording and foundation status. Later adopted scope is recorded in the [product-quality child register](product-quality-register.md) and current decisions; none of its parent requirements is marked fully implemented by this amendment. A-min or A-manual delivery does not mean the whole parent is complete.

## Prototype scope disposition

[PP-01 traceability](../prototype/traceability.csv) retains all 78 parent IDs and classifies 24 Core, 25 Partial and 29 Deferred for this synthetic release. These classifications are design scope, not implementation or approval status. The original registers derive from the frozen issued v02 snapshot; the stable working master can evolve through explicit scope reconciliation.

## Naming, communication and SharePoint derived scope

[Naming assistance](naming-assistance.csv) defines NC-01–NC-16 under existing parent requirements. The additive `naming_assistance_refs` column in the parent register supplies reciprocal links; issued requirement wording and original source-derived columns remain unchanged. The [pilot plan](../delivery/naming-sharepoint-pilot.md) maps NA-01–NA-22 to these children. Design authorisation, prototype checks, application implementation, provider proof and whole-parent acceptance remain distinct.
