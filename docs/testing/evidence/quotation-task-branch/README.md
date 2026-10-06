# Three-task Project branch execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. SYN-ES07-10. Functional proof, final-head CI, visual review, owner acceptance and deployment remain separate.

## Starting reconciliation

[Actual GitHub observation](starting-verification.json) confirms #352 merge 1ffcf653 and all 41 successful checks on final head 3a2e1c0. The separate post-merge observation records 28 successful checks and eight still running; these are not passes. Refresh again before handover. #349's cancelled compiled job and failed aggregate, #351's unchanged-main Scheduling race and repaired ledger assertion, and #352's development failures, naming repair and superseded cancellations remain unchanged in their original ledgers. Current reconciliation supersedes pre-merge wording without rewriting historical checkpoints.

New task-owned PostgreSQL 16 cluster on loopback 5683, ppo_synthetic_test; live schema inspected through 0069 before selecting 0070. Existing proof databases and unfinished Excel import remain untouched. Node 24.21.0/npm 11.19.0 and copied locked dependencies. No dependency or lockfile changes.

## Development observations

Initial TypeScript found an overly broad role conditional during extension; it was corrected to keep ChainEnd and BranchSuccessor distinct. Initial branch PostgreSQL failed before proposal insertion because the new registry file had been added but latestMigrationVersion still named 69. Updating that constant and the separately reviewed hosted-upgrade gate fixes the contribution error. No assertion, deadline or retry policy was weakened. The corrected focused FS/FS case passed in 56.6 seconds including setup, proving six decisions and exact native effects. Seven focused units passed, including all branch FS/SS combinations, touching-edge refusals and retained earlier contracts. Complete branch execution and final-head gates remain separately required.

The new branch database/runtime groups extend the existing mandatory Supply aggregate. All eleven earlier Supply groups, both database shards, both complete broad browser runs, retained compiled proofs and aggregates remain. New rollback cases target B, C, Impact and immutable outcome independently. Populated 0069 cases preserve isolated, paired and linear-chain records and original recovery. Actual execution results will be appended here; pending work is not passed evidence.

Accepted branch mockup images are missing. Automated viewport proof and assistant observations cannot grant paired visual, device, screen-reader or owner acceptance. No review fingerprint is promoted.

## Reviewable candidate checkpoint

Local lint, TypeScript, eight focused units, foundation, prototype, naming and studio checks pass. Naming retains 7,993 instruction characters; all 330 design entries remain unreviewed, without promoted fingerprints. The complete development database execution is still running at this checkpoint; four dependency combinations, four late rollback stages, independent corrected/revoked receiving, quotation retention/fresh disposition, competing work and the isolated/pair populated upgrades have passed so far. This is not a claim that the unfinished suite or final-head CI passed.

The reviewable candidate strengthens complete native write-footprint assertions, adds explicit linear-chain consent refusal and rechecks introduced incoming/outgoing edges at each selected task without relying only on Project-version changes. Both old browser invocations and all mandatory aggregates remain unchanged. Final PR-head execution and exact browser identity/outcome comparison are required before handover.
