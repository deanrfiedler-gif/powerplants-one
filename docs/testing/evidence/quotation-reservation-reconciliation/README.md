# Owned reservation outcome reconciliation execution ledger

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 4 October 2026. Source, automated proof, visual/owner acceptance and deployment remain separate. [Decision](../../../decisions/quotation-reservation-reconciliation.md), [contract](../../../contracts/quotation-supply-followup.md).

## Baseline and preserved evidence

Refreshed main is #344 merge `3b1daba3a3738afe8b53700de2efb9e14a28d30a`. Its tree equals final checked head `16d3767bc7f6f446169b9cd74f9f0bbb9a4e6721`: `e5ec7ea0b526b07f8bc957f6f200d5ae94ce0fbe`. GitHub confirms all 29 final-head checks successful. Earlier failure and correction records in the conversion, disposition and Supply ledgers are unchanged. Main checks were running at initial reconciliation. The separate Azure update later reported success; this task neither initiated it nor performed a deployment or verified its hosted behaviour.

No open PR or suitable unfinished dependency contribution existed. The isolated branch preserves Excel import and all earlier worktrees/databases. A new task-owned loopback PostgreSQL cluster at port 5654 contains only `ppo_synthetic_test`. Live 0063 constraints and registry were inspected before allocating 0064. No seed, grant, capability or identity is added. Reserved gaps remain unchanged.

## Execution checkpoints

The first focused database run timed out its first case at the unchanged 120-second limit; four subsequent cases failed waiting for the interrupted transaction's workspace lock. No passing retry or deadline extension is claimed. A separate task-owned baseline cluster and the unchanged #344 checked tree provide a controlled comparison. The baseline exact-allocation case also timed out at the unchanged 120-second limit on its clean source tree and separate cluster (161.9 seconds total). This reproduces a local timeout, not proof that every subsequent error has the same cause. A targeted candidate diagnostic retains its own result. Full isolated Linux CI remains required.

The initial build exposed an invalid UTF-8 byte from a Windows editing script. The new UI text was repaired to UTF-8; subsequent editing explicitly uses UTF-8. The failed build is retained outside Git. Three focused validation units pass, including exact canonical compatibility of prior #344 review payloads. A pre-final type check passed; final-source validation remains separate.

## Boundaries and next increment

Only an existing current Unknown ExternalOutcome/Reservation observation on the converted Demand can execute reconciliation. Confirmed, Failed and Absent require complete original-operation lookup evidence; absence of a PPO receipt remains inconclusive. Apply creates native successor evidence/history and an original receipt, without changing quantities, allocations, demand class or any external event. Other consequential holds remain owned and explicit. Fresh ES-07 review/application is required; Supply or Activity completion never resolves quotation exceptions automatically.

Operational authority, signing, age thresholds, unit conversion, item governance and external reservation commands remain Not configured. Accepted native imagery, paired visual, physical-device, screen-reader and owner acceptance remain pending. No merge or deployment is included. Next useful slice: an independently adopted shared receipt/inspection correction with explicit receiving/effects across every affected demand; it must not invent external receipt reversal.
