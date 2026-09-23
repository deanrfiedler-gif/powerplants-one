# ADR-0044 — Explicit placement of held legacy fields on fertigation import

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **State:** Accepted on direction, 23 September 2026; implemented on branch `claude/ecstatic-lamport-1n1eoh`. Owner acceptance of the running screens is open. **Date:** 23 September 2026.

## Decision owner and evidence

Dean Fiedler. On 23 September 2026 Dean directed that the fertigation workbench
improvements be applied ("apply all the improvements that you believe will make
this module as advanced and professional as possible"). This ADR records the one
improvement that changes an existing import rule, feature F1 of the
[workbench refinement record](fertigation-workbench-refinement.md). It amends the
held-import behaviour of [ADR-0038](ADR-0038-priva-fertigation-native.md); it
does not change its calculation edition, source binding or identity rules.

Related: ES-02, EST-02/03/06, matrix UI-22, AT-39/AT-43/AT-44, FN-T40, A3 of the
refinement audit.

## Context

ADR-0038 imports a standalone r02 file as a separate native draft and holds the
import when any populated legacy field has no verified native mapping, so that
nothing is silently truncated. That rule is right, but the screen offers no way
forward: Confirm stays disabled and the user cannot resolve a held field.

Evidence: r02's own sample project, downloaded from r02, previews with 80 held
fields across 21 record families (project narrative, block geometry, valve
condition, group duty, scenario storage, curve provenance, stock channel limits,
controller and bank details, responsibilities, commissioning, the alarm
register and local history). A genuine r02 project therefore cannot reach a
native draft at all.

Constraints: no silent truncation; no guessed mapping to a native field; the
original file is never changed; no new table, dependency or service; the
customer report allowlist already excludes free-text notes.

## Options

1. **Keep holding.** Correct but leaves every genuine r02 project stranded.
2. **Drop unmapped fields on confirm.** Silent truncation; rejected by ADR-0038.
3. **Map each field to a native field.** Most useful long term, but most of the
   80 fields have no native field today and each mapping is its own technical
   decision. Not deterministic now.
4. **Explicit placement (selected).** Every held field is placed by the user
   before confirmation, into one of a fixed set of dispositions, and the
   placements are retained with the import.

## Decision

A held preview may be confirmed only when every held path has exactly one
placement:

| Disposition                    | Meaning                                                                                                                                                                                                                                                                                                                                            | Allowed for                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `keep_as_note`                 | The verbatim legacy value is appended to the notes of the native record the legacy record mapped to, labelled as an unverified r02 source value. Project-level fields, whole collections and fields whose record has no native counterpart go to one generated evidence reference, kind assumption, named "Legacy r02 source values (unverified)". | Every held path                                              |
| `covered_by_discovery_binding` | Not carried; the saved Discovery alternative owns this context.                                                                                                                                                                                                                                                                                    | `project.reference`, `project.customer`, `project.site` only |

The server recomputes the preview from the submitted file, checks the preview
hash and proposal signature as before, validates that the placements cover the
held paths exactly and that each disposition is allowed, then applies them
deterministically. The resulting proposal passes the normal native validation.
The placements (path and disposition) are stored in the import record's
provenance next to the source hash, so the audit shows where every held value
went. Notes stay internal: the customer allowlist is unchanged.

Mapping held fields to native fields (option 3) remains future work, one field
family at a time, each with its own rule and test. F1 also proposed an
"evidence for a declaration" disposition and offering r02 values for the draft's
declarations; neither is part of this decision.

## Consequences

- A genuine r02 project can now be imported. Its held values are visible in the
  workbench next to the records they describe, not lost and not promoted to
  native technical values.
- The draft opens with native findings for anything r02 did not declare
  natively (for the r02 sample: 28, reducing to 12 decisions). The guidance
  layer ranks them with a responsible role.
- Compatibility: previews without held fields confirm exactly as before;
  `placements` is optional in the confirm request. Imports confirmed before this
  change keep their provenance unchanged.
- Reversal: remove the placement path; held previews return to being
  unconfirmable. Drafts already imported keep their notes.

## Validation

Unit tests place every held field of the genuine r02 sample and confirm the
result validates, carries each kept value exactly once and records the
placements; incomplete, duplicate, unknown or disallowed placements are
refused. A database test confirms the genuine sample into a native draft and
reads the placements back from the import record. A compiled browser test at
desktop and phone widths places the sample's held fields on the import screen,
shows that Confirm stays disabled until every field is placed and the review is
ticked after the last change, and confirms the result. See matrix
FN-T109–FN-T112.

Open: owner acceptance of the placement screen; per-family native mappings.
