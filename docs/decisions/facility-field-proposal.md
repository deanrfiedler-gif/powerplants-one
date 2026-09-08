# Facility fields — proposed first persistence increment

**Revision:** r01 · **Prepared:** 8 September 2026 · **Owner:** Dean Fiedler · **State:** Proposed for review; no schema/UI implementation or field-policy acceptance · **Workstream:** [PPO-009 / #9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9).

The next useful facility journey is: an authorised user opens an existing permitted Site, records a Facility's structure and growing context, saves it, reloads, and sees the same details in the organisation's Sites hierarchy. It should support the greenhouse, berry and mixed-nursery scenarios named in the [mobile handover](https://github.com/deanrfiedler-gif/powerplants-one/blob/5b6b8bf73e9486858b22e7561f1ec1ece8ee59de/docs/delivery/mobile-crm-handover.md).

That handover names the scenarios but the inspected repository does not provide their complete approved field dictionary. The taxonomy, field limits and change rules below are **new recommendations**, not recovered prior approvals or imported Pipedrive/CREMS fields. Dean authorised preparation while PR #61 is under verification. This document changes no tested application source and does not start implementation.

## Existing contract and boundaries

[Service data dictionary](../contracts/service-data-dictionary.md) defines Facility as a same-site subdivision with a name and optional parent. [Migration 0002](../../db/migrations/0002-shared-foundation.sql), [shared commands](../../src/shared/commands.ts) and [shared reads](../../src/shared/reads.ts) persist stable identity, version/audit metadata, company/site, name and parent; same-site keys, graph guards and protected deletion preserve the hierarchy. The current create command accepts no facility taxonomy or horticultural details. A facility type is not a CRM stage, organisation type or crop.

Retain Organisation → Site → Facility through existing SiteParty relationships; do not add a copied organisation owner to Facility. A Site may have different operator, owner and bill payer. Equipment remains an Asset with its own identity and existing facility/site link. Do not copy manufacturer/model/controller records into free-text facility fields. Site address, timezone, access and biosecurity instructions remain on Site; approved job-pack controls retain their existing review process.

## Recommended common fields

Keep the approved mobile shell, record tabs, controls and save/error language. Place a compact **Facility details** form within the existing Site context; show conditional fields only when relevant. Labels below are proposed product terms; stored keys and final types belong to the reviewed implementation contract.

| Field | Required/default | Proposed rule |
|---|---|---|
| Site | Required, inherited from the open Site | Existing exact permitted ID; company/site cannot be changed through this increment. No name-based matching. |
| Facility name | Required | Existing trimmed 1–200 character rule; names may repeat, identities may not. |
| Parent facility | Optional | Existing same-site identity; reject self-parent/cycles. Parent is grouping only and does not grant access or imply inherited dimensions/type. |
| Structure type | Explicit selection on new/edited details; **Unknown** allowed | Greenhouse, Polytunnel, Shade/net house, Open growing area, Indoor growing room, Non-growing facility, Other, Unknown. Stable controlled codes; a label change does not rewrite history. |
| Type description | Required for Other; otherwise absent | Trimmed 1–200 characters. Do not invent a new controlled type from arbitrary text. |
| Type unknown reason | Required when a user saves Unknown | Trimmed 1–1,000 characters; legacy records display “Not recorded” until reviewed and require no fabricated backfill reason. |
| Use | Optional | Propagation, Production, Trials, Mixed, Non-growing, Unknown. Keep separate from structure and crop. |
| Crop or crop group | Optional bounded text, 1–200 characters when supplied | Visible when use is growing, Mixed or Unknown; e.g. “Raspberries” or “Mixed nursery stock”. Informational snapshot, not a crop-cycle or variety register. |
| Footprint area | Optional decimal square metres | Greater than zero when supplied, at most two decimal places, proposed storage `numeric(12,2)`; blank means unknown, never zero. Label m² explicitly. No automatic parent/child roll-up or inference from covered/growing area. |
| Detail notes | Optional, up to 2,000 characters | Fictional descriptive context. Do not use these notes to replace authoritative access, safety or equipment records. |
| Saved by / saved at / version | Server-derived | Reuse audit identity and optimistic version handling; users cannot supply an authoritative author/time. |

Greenhouse includes glasshouses and other framed greenhouses; cladding below distinguishes them. “Berry” and “nursery” describe crop/use, so a berry polytunnel and a berry open growing area remain distinguishable. Unknown means not established; Other means established but outside the controlled list.

## Recommended conditional fields

These are optional context, not technical design criteria or readiness certification. Missing applicable details show **Not recorded**. Irrelevant fields are not editable; the server rejects irrelevant submitted values rather than trusting hidden UI controls.

| Structure type | Additional fields in the first increment | Limits / meaning |
|---|---|---|
| Greenhouse | Cladding: Glass / Plastic film / Rigid plastic / Mixed / Other / Unknown; bay count | Optional positive whole bay count, proposed maximum 10,000. Other cladding requires a 1–200 character description. No thermal/load/performance calculations. |
| Polytunnel | Tunnel count; cover: Plastic film / Net / Mixed / Other / Unknown | Optional positive whole count, same limit; Other cover requires a short description. Do not assume one tunnel equals one bay or Asset. |
| Shade/net house | Cover: Shade cloth / Insect net / Mixed / Other / Unknown | Other requires a short description. Shade percentage, mesh aperture and certified performance are deferred until units/source requirements are agreed. |
| Open growing area | Layout: Beds / Rows / Benches / Containers / Mixed / Other / Unknown | Other requires a short description. No cadastral area, drainage or irrigation design claim. |
| Indoor growing room | Growing levels | Optional positive whole count, proposed maximum 100; not an automatic multiplier for footprint or yield. |
| Non-growing facility | Function: Pump/equipment room / Storage / Packing / Other / Unknown | No crop field when use is Non-growing. Existing equipment appears by canonical Asset links. No plant, stock or dispatch workflow is added. |
| Other or Unknown | No additional typed structure fields | Common fields and explicit description/reason retain useful incomplete context. |

## Three concrete synthetic examples

The names below are proposed fixtures, not existing records or customer facts. Implementation allocates stable test UUIDs using repository conventions, never operational identifiers.

| Scenario | Proposed records and values | Acceptance focus |
|---|---|---|
| Greenhouse grower | “SYN Demo Grower A” → “SYN North Site” → “SYN Glasshouse 1”; Greenhouse, Glass, Production, Tomatoes, footprint 2,400 m², 8 bays. Existing linked equipment remains a separate Asset. | Save/reload the same Facility and Asset identities; show greenhouse fields and m²; editing notes cannot alter equipment or Site controls. |
| Berry grower | “SYN Demo Grower B” → “SYN East Site” → “SYN Berry Tunnel Block”; Polytunnel, Plastic film, Production, Raspberries, 12 tunnels, footprint not recorded. | Persist unknown area without inventing zero or blocking useful save; tunnel fields visible, greenhouse bay count absent. |
| Mixed nursery | “SYN Demo Nursery C” → “SYN West Site”; sibling Facilities “SYN Propagation House” (Greenhouse), “SYN Shade Area” (Shade/net house), “SYN Outdoor Container Area” (Open growing area); optional child “SYN Propagation Bay A” under the first. | Mixed types and same-site nesting; no duplicated parent/child area total, inferred access or cross-site parent. Crop/use may differ across siblings. |

## Persistence, authority and changes

1. **Create and update explicitly.** Extend the shared Facility contract with a bounded versioned update, existing `shared.create` / `shared.edit` plus `shared.read` scope, current relationship checks, command receipts and audit history. Reuse current patterns, not a general custom-field builder. A new/edited details form must choose a type or record Unknown with a reason; optional technical details do not block save.
2. **Protect older records.** Use an additive forward migration selected against actual main/open reservations at implementation time; no migration number is reserved here. Existing Facilities remain valid with unrecorded attributes. Do not change old migrations, seed receipts, IDs, grants or original issued pack/report bytes. Repeated seed must preserve user edits.
3. **Handle type changes deliberately.** Show a comparison of fields that will become inapplicable. Require a reason and explicit confirmation to clear them from current active details in the same versioned save, while preserving the before/after values in audit history. Cancelling changes nothing. Switching back does not silently restore historic values; a user may deliberately re-enter them. Apply the same rule when changing use to Non-growing hides a crop value.
4. **Retain failure meaning.** A stale version returns the existing conflict pattern with no partial write; the proposal stays reviewable. An uncertain save retains its original operation identity and uses receipt reconciliation. Server validation independently enforces type/field compatibility, lengths, units, numeric bounds and same-site relationships.
5. **Maintain current permissions on every surface.** List/search/detail/create/update/receipt/history must check current actor and site/company access. Hierarchy does not grant access; summaries include only permitted records. Identity changes clear drafts and loaded data. Do not introduce a new role or silently broaden fixture grants.
6. **Keep scope references exact.** Existing Equipment→Facility links are preserved and cross-site assignments remain rejected. Estimate/service navigation retains existing organisation/site/Asset IDs. The current [E1 contract](../contracts/estimating-e1.md) has opportunity/site context but no general structured Facility selection. Adding Facility scope junctions, copying reviewed Facility attributes into a new estimate/work revision, or changing rendered outputs requires a separately bounded receiving-contract change; plain notes do not count as completed structured integration. Preserve those remaining mobile-handover obligations explicitly.

## Proposed verification for implementation

| Local case | Observable result | Evidence layer |
|---|---|---|
| FAC-A01 — Not run | Each of the three scenarios creates/edits the intended Facility, then retains type, common fields and conditional values through reload and actual application/database restart. | Real PostgreSQL, HTTP, desktop/phone journey and restart proof |
| FAC-A02 — Not run | Wrong company/site/parent, self-parent/cycle and invalid Asset link are rejected; direct SQL cannot violate structural relationships. | Database constraints plus current-session HTTP |
| FAC-A03 — Not run | Unknown/Other and blank optional values behave as specified; zero/negative/excess-precision/out-of-range numbers, overlong text and irrelevant fields are rejected without partial save. | Meaningful validation boundaries, database/API tests |
| FAC-A04 — Not run | Type/use change comparison, cancel and confirmed clearing preserve history; two competing saves produce one winner and a conflict. | Database concurrency and browser comparison |
| FAC-A05 — Not run | Lost response reconciles one original effect; changed-content reuse conflicts; revoked users cannot replay, view history or infer hidden counts. | HTTP receipt/revocation and permission tests |
| FAC-A06 — Not run | Upgrade and repeat seed preserve old Facilities/Assets, grants, receipts and issued document hashes; unrelated CRM/E1/Service procedures still pass. | Fresh/upgrade databases, restart, original output and required regression checks |
| FAC-A07 — Not run | Approved mobile UI retains 320/390px reflow, labelled errors, keyboard/touch access, unsaved-draft handling and identity clearing. | Browser plus later physical-device review |

All are prospective cases, not additional master requirements or executed evidence. Traceability: CRM-04/08, CA-05/06/10/13, AT-02/23/25 components and the existing Facility/Asset dictionary. Master AT/PT status and Projects J1 are unchanged. The existing PR #61 CI must finish on its own candidate; these cases cannot replace a failed current-head gate.

## Decisions for Dean

These three choices make the next increment concrete without reopening the approved visual design. **All remain Proposed**; “OK, do that” authorised this preparation, not an unseen field dictionary.

| Decision | Recommendation | Alternative and trade-off |
|---|---|---|
| FAC-D01 — Type and field vocabulary | Adopt the structure/use split and the common/conditional tables above for the synthetic first increment. | Amend named fields/options now; a generic custom-field builder adds unnecessary configuration and validation scope. |
| FAC-D02 — Incomplete context | Require name/site and an explicit type or Unknown reason; allow optional technical details to remain Not recorded. | Requiring all applicable detail would force users to stop or guess before a site review. No completeness/readiness certification is proposed. |
| FAC-D03 — Type/use changes | Require a comparison and reason; clear inapplicable active values only on explicit save and preserve their history. | Lock type after create for a smaller first release, at the cost of a separate correction process. Silent hiding or deletion is not recommended. |

After these choices are reviewed, the next implementation can be scoped against freshly verified main and active workstream reservations. This preparation creates no database change, external connection, hosted environment, real customer record or implementation acceptance. Use the [mobile acceptance checklist](../testing/mobile-crm-acceptance-checklist.md) for the current delivered journey.
