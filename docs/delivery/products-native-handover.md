# Products native programme handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Authorised PD-01–05 implementation; integrated verification in progress. Owner acceptance and deployment pending.

The dedicated branch is `feat/products-catalogue-native`, based on refreshed main `cad98aca42cb233f142029d11601a78d7d4b521e`. Existing Field Quality work and all other worktrees remain untouched. GitHub access and merged #222/#308 were checked; current main is authoritative. The configured port-5433 database was unavailable; unchanged main was materialised and its actual PostgreSQL 16.15 schema/identity constraints inspected in a separate loopback cluster on 55439 before selecting tables.

The [contract](../contracts/products-catalogue.md) and [ADR-0048](../decisions/ADR-0048-products-native-catalogue.md) cover native catalogue/detail, authoring/review/publication, exact ES-03 pricing bindings, reviewed product relationships and controlled synthetic JSON import. Products is shared within the existing seven domains. Routes `/products`, `/products/[id]`, `/products/publication`, `/products/pricing`, `/products/compatibility` and `/products/import` use the current shell and reusable controls.

Migration 0049 adds typed Products, immutable revisions/events, exact CostSource and downstream-use sidecars, relationships/reviews and import batches/plans/events. It extends existing identity/audit/outbox/capability constraints with immediate/deferred identity-event handling. No seed or profile grants are added. Eleven Product capabilities are proposed explicitly, represented in the AD-01 working contract; operational allocation remains pending and current users gain no hidden Product authority. Disposable test fixtures are the sole grant source used for proof.

ES-03 retains all source content, monetary rules, review and deliberate estimate refresh. Engineering retains material suitability/substitution/release and change impact. Equipment retains installed lifecycle/bulletins. Exact use references preserve observed owner versions and original identities. No live supplier, MYOB, SharePoint or CAD operation exists. Production formats, FX/unit conversion, landed cost, tax/threshold policy and stock observations remain Not configured.

## Verification and review

The [evidence index](../testing/evidence/products-native/README.md) records executed commands, actual results and reviewed captures. Early validation found and corrected a table-specific trigger field-access error and import-result JSON serialisation. An initial build lacked worktree-local locked dependencies; the unchanged dependency lock was installed locally. These attempts are not passed evidence. Required final verification remains in progress until recorded below.

PD-01 preserves exact model/variant identity, separate technical revision, record dates, technical document applicability and commercial separation. PD-03 uses native ES-03 bounded pricing instead of adopting unconfigured standalone FX/landed features. PD-02/04/05 are native compositions derived from written scope/workflows, with no fabricated accepted HTML. All issued references remain unchanged. Design register/guides and component fixtures are maintained in the same contribution, with review fields left unapproved.

Code delivery, automated checks, visual inspection, owner acceptance, PR review and deployment are distinct. No merge or deployment is authorised by this task. Final branch head, current-main reconciliation, PR, completed checks and remaining limits will be recorded after verification.
