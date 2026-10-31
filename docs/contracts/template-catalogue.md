# DK-06 read-only template catalogue API

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: implementation contract; business acceptance pending. Source: [authorised decision](../decisions/template-catalogue-backend.md), DK-06 R1 / BC-03, DOC-02/DOC-03/DOC-06, AT-20/AT-36.

## Routes and queries

All routes use the existing authenticated, private/no-store read boundary. Only GET is exported. Unknown query fields and invalid values return 422; POST returns 405. A family is always explicit, so IDs from different family stores cannot be conflated.

| Route | Query and result |
|---|---|
| `/api/v1/document-templates` | Required `family=OUT-09`, `OUT-10` or `OUT-14`; optional `limit` 1–50 (default 50) and `cursor`. Lists retained definitions in UUID order, including historical and currently unsupported definitions. |
| `/api/v1/document-templates/:id` | Required `family` only. Returns exact saved definition text plus catalogue metadata. No `latest` substitute. |
| `/api/v1/document-templates/:id/usage` | Required `family` and `kind=PackRevision`, `RenderJob` or `Issue`; optional `limit` and `cursor`. PackRevision is available only for OUT-09. Returns saved references to that exact template identity. |

Signed continuation binds actor, workspace, selected working company, family, template/kind and page size. Altered or cross-context tokens return 422. Tokens are transient and invalid after server restart. Pages are live reads, not a frozen cross-request snapshot. Start again after a changed filter or context. Definition and consumer identities are permanent.

## Meaning of returned facts

`content_hash` and detail `definition` are retained originals. `definition_integrity` compares those saved bytes to their saved hash. `runtime_support` is Supported, DefinitionChanged, RendererChanged, UnsupportedVersion or Unavailable, determined against the existing native support function; it does not install a version. `selected_by_policy` is separate from support; `policy_version` is the current family policy's version, including on historical rows. `definition_eligible` means only that this definition is selected, intact and currently supported. It grants no render, business approval, issue or distribution authority.

`dependencies` contains the original definition's path/hash/byte-count manifest and Recorded, NotRecorded or Invalid status. The catalogue never resolves a retained path as a filesystem request. OUT-09 version 1 stores a plain definition without a dependency manifest. No fabricated historical fingerprint is added. Generic form definitions, quotations, CAD and external templates are outside this R1 catalogue.

Usage reports exact consumer ID, parent record ID, revision ID, recorded state and saved template ID/version/hash/policy version. `exact_definition_match` compares that saved binding to the retained definition. A RenderJob is a reservation, not proof of issue; Issue identifies an original issue event, not its current applicability or successful delivery. `file_availability=NotChecked` explicitly avoids claiming that retained output bytes are available. Consumers must use the native protected record/file endpoints for further inspection; store keys and file content are never disclosed here.

## Authority and completeness

Family metadata requires its existing `pack.read`, `report.read` or `finance.read` permission intersecting a real site in the selected working company. Finance additionally requires `shared.finance.read` at the same scope. No permitted scope yields 403; an unknown or wrong-family template yields 404 after that gate. Inactive users and expired/revoked grants are refused.

Every usage item also passes native pack/issue, report or Finance context checks. Pack/report render jobs require the corresponding issue duty. Pack preparation revisions require staff preparation/check/issue authority or the exact currently issued revision available to the assigned crew. Finance checks its current handoff, work and account permissions. Hidden consumers contribute no IDs, totals or cursors. Final authority is rechecked before return; unexpected source failures propagate rather than being labelled empty.

Definition pages use `scope=FamilyDefinitions`; usage pages use `scope=CurrentPermittedRecords`. `completeness=Partial` means a permitted continuation exists; Complete means the final page of that selected, currently permitted family/kind stream. It never asserts that the caller sees every workspace record or every possible consuming system. There is no global usage total. Candidate scanning precedes public pagination and cursors name only returned visible IDs. The workspace share lock aligns with native command locking. Grant expiry uses current server time.

## Acceptance proof

Verify all three exact current/historical families; policy/support distinctions; unsupported and changed bytes; family/actor/company-bound paging; role/company/workspace denial and grant revocation; crew draft protection; native pack/report/Finance reservations and issues; immutable original consumer bindings; strict compiled routes; and no business-row mutation on repeated reads. Existing runtime templates, original files, native commands, seeds and permissions must remain unchanged. Evidence is in the [execution ledger](../testing/evidence/template-catalogue/README.md).

## Native workspace labels (implementation in progress)

The read projection exposes the stored Job pack definition name. Families without a stored name use Version N; the page does not invent titles or render output values. Definition, publication, proposal and site-use identities stay separate. Native workspace contracts and component bindings are maintained under DK-06; visual acceptance remains pending.
