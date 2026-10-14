# CPQ explicit rebase and estimate conflict resolution

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 14 October 2026. Status: backend implementation authorised; operational and visual acceptance remain separate. Scope BC-04 / ES-02 / ES-03, preserving EST-01–EST-09.

## Context and decision before implementation

Published Products (#490) and governed cost/labour sources (#491) retain exact release and calculation evidence. Their existing guards correctly refuse stale overrides and manually changed CPQ-owned estimate lines, but there is no durable, explicit resolution workflow. Continue those contracts in an isolated `codex/cpq-rebase` contribution. Reuse the current TypeScript runtime, bounded worker, PostgreSQL transaction participants, permissions, immutable runs/adoptions, audit and receipts. No new dependency, service, grant or pricing policy.

Use a version-1 workflow envelope, independent of definition schemas 1–4. Existing definition, arithmetic, result and receipt hashes remain unchanged. An opted-in successor run adds `binding.rebase` evidence: exact parent ID/content hash, preview hash and normalized decisions. Its outer content hash binds this evidence; current calculation-basis comparison excludes only that explicitly typed workflow evidence. A new definition schema would misrepresent a receiving workflow as a calculation language change. New tables would duplicate the existing immutable run and accepted-command evidence without providing a needed independent mutable lifecycle. No migration is required; verify the live amended immutability/receipt contracts and populated repeat-run stability.

## Override rebase

Preview and save are separate server operations. The caller supplies the chosen current discovery revision and new facts/pricing date, without precomputed overrides, plus an explicit decision for each parent override: Keep, Replace, Remap or Revoke. Keep retains its value on the same target; Replace changes its value on that target; Remap retains its value on an explicitly selected compatible category/unit target; Revoke removes it from the successor only. Every decision needs a reason. Missing, duplicate, ambiguous or incompatible decisions prevent saving; absent targets require remap or revocation. Rebase is not an approval of changed Product publication or costs: all current source checks still apply.

Recompute material override bases before labour bases so labour depending on the effective BOM receives the correct hash. Use the existing isolated calculation worker and unchanged formula limits. Preview binds the exact parent, current release/discovery/estimate basis, normalized proposal and decisions. Save recalculates within the shared mutation lock and refuses a stale preview. The new run retains the parent; old runs and their evidence are never edited. Original-operation recovery checks current authority before returning the original receipt and does not require yesterday's basis to remain current.

## Estimate receiving decisions

Expose a read-only resolution preview for changed/removed owned lines and obsolete generated items. Keep preserves the exact current line, Replace adopts the exact newly generated line, and Remove explicitly acknowledges deletion. Only tracked CPQ lines may be resolved; unrelated manual lines remain intact. Missing decisions block adoption, and existing adoption calls also refuse newly unacknowledged obsolete removals. Kept or deliberately removed lines remain visible in immutable resolution evidence and require deliberate handling if a later generated result would overwrite or recreate them.

Persist the normalized decisions, exact before/current/proposed line snapshots, prior adoption and resulting line attribution in the existing immutable adoption audit details. The adoption row retains only the generated lines actually received from its run. Retained manual lines keep their original native source bindings where the native writer permits inheritance. They must not be relabelled as using a newer run's Product or cost basis. Product provenance reads distinguish exact generated adoption from retained historical/manual attribution and authorize every referenced source run. Quotation projections remain customer-safe.

The preview hash binds all receiving decisions, estimate version and line evidence. Adoption rechecks that hash and all current source/ownership guards, then writes estimate version, source bindings, adoption, decision evidence, audit, outbox and receipt atomically. Stale, concurrent, repeated and lost-response commands retain existing original-operation semantics. No permission bypass or silent price/quantity substitution.

## Verification and remaining scope

Prove all override actions, material-to-labour dependency ordering, missing/duplicate/incompatible decisions, current source and company/access denial, immutable parent/legacy hashes, changed and removed manual lines, explicit obsolete removal, preserved unrelated/native-bound lines, exact Product attribution, stale confirmation, rollback, racing/repeated commands, receipt and application/PostgreSQL restart recovery, and quotation privacy. Record local checks, CI, independent automated review and operational acceptance separately.

Native UI controls, automatic semantic target matching, operational pricing/compatibility approval, broader fact mapping, new commercial policy and live integrations remain outside this increment. Do not merge or deploy. After this increment, the next planned backend slice is release quality and impact assessment.
