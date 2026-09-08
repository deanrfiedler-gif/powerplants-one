# PPO Assistant — Design handover

**Document:** PPO-AI-HO · **Revision:** r01 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler · **State:** Specification authored; publication/check evidence below; application and model acceptance not run.

## Delivered scope

The [specification](../blueprints/ppo-assistant-specification.md) defines one customer search → sourced CRM summary → reviewed opportunity/initial Activity journey, desktop/mobile screen behaviour, exact existing field mapping, narrow server tools, current-authority checks, durable original-command recovery, provider alternatives, illustrative costs, AI1–AI4 sequence and 20 future acceptance procedures. The [direction/architecture decision](../decisions/ppo-assistant-direction.md) records rationale, alternatives and authority.

Dean authorised proceeding after the recommendation to prepare this package. This contribution is documentation only. It changes no app/schema/seed, identity/permission, provider credential, dependency pin, CI workflow, paid service, hosted environment or source integration. No model inference, microphone recording, actual assistant screen or customer communication was performed. AIA-01–AIA-20 and live-model/phone/screen-reader tests remain Not run.

## Source and concurrent-work evidence

Private repository access verified through the connected GitHub API on 8 September 2026. Starting main is `b3597f79413f87b9b2f1ce75a66a2addefbb0e34`. Read AGENTS, README, STATUS, naming, BP-01/BP-02, ADR-0003/0015 and relevant CRM/shared/Activity/permission/HTTP/operation code. Source conclusions are tied to that commit.

Current open #61 mobile CRM, #62 Email & Calendar, #63 P11 Finance read recovery and #60 private demo remain independent. P11 source merge is not verified publication completion; #54/#63 records the remaining failures. This design claims no progress on those contributions, no Projects implementation and no live Microsoft dependency.

Direct Git clone was unavailable because this environment has no GitHub shell credential. The connected API supplied a partial documentation/source snapshot; each materialised file's Git blob SHA was checked against the API result. Local checks are reported with that scope. Full-repository foundation assurance is delegated to the unchanged existing CI workflow, not simulated with empty files. Original issued references are preserved byte-for-byte.

## Validation and publication

Local verification of the eight-file documentation contribution:

- All 183 materialised existing source/document files matched their Git blob SHAs. This is a partial source snapshot, not a runnable checkout.
- `python3 scripts/check_prototype.py` passed: 78 parent dispositions, 29 decisions, 30 existing prototype procedures and 12 implementation packages preserved.
- `python3 scripts/check_naming.py` passed: 87 document records, seven standing exceptions, unchanged 7,898-character project instructions.
- `python3 scripts/check_foundation.py` ran and reported failure because 231 links target files omitted from the partial snapshot. Every omitted target was verified to exist in the exact remote tree; no other foundation error was reported. This is not a full foundation pass. CI must run the unchanged check on a full checkout.
- All 20 new-document local links resolve; AIA-01–AIA-20 are unique and map only to existing parent IDs. All three illustrative cost scenarios and the Brisbane/UTC example were checked.
- `git diff --check` passed. The change contains three new documents and five index/status/register updates; no runtime, issued reference, original requirement wording or workflow edits.

The final publication record belongs to the design PR, including exact head/tree, check URLs and any failure dispositions. This file does not claim its own future commit hash. Local and CI evidence is updated before delivery; unrun broader application checks are not assistant acceptance.

## Next bounded step

Implement AI1 after checking fresh main/current I1/I2 publication and shared UI/identity/recovery changes. Deliver the local synthetic adapter, bounded sourced read, editable/confirmed creation, durable original-command recovery and the relevant acceptance cases. Keep the provider default off and ordinary CRM working. Then prepare a funded live synthetic evaluation using the same fixtures; account/budget/provider selection is a separate paid-use decision. No Azure subscription or Microsoft mailbox is required for the local simulated workflow proof.

For publication, preserve normal review/checks and the exact expected head. No failed regression is waived by this documentation work. Maintain separate design completion, implementation results, real-model evaluation, owner acceptance and production-readiness records.
