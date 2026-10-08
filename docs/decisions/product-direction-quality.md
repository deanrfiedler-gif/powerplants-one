# Independent Powerplants One product direction

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Decision: 8 October 2026. User-adopted direction; implementation evidence and independent/owner acceptance remain separate.

Dean directed that the original CREMS guide can be disregarded as the guide for Powerplants One, and authorised the next reliability, performance and usability increment. Powerplants One is designed around current business needs, explicit product decisions and verified connected user journeys. CREMS parity, reconstruction of undocumented CREMS formulas and reproduction of its screens are no longer prerequisites for development.

The CREMS materials in `docs/reference/` remain unchanged historical sources. Statements about documented CREMS behaviour remain historical observations, not current design obligations. Read this decision before older blueprint, discovery, evidence, backlog or issue wording that makes CREMS reconstruction a dependency. PPO-010 / issue #10 is now interpreted as defining and testing PPO's estimating rules; its old title and original evidence are retained for traceability. The original 78 parent requirement IDs stay stable. Later independently adopted PPO workflow, authority, recovery and calculation decisions remain in force until explicitly superseded.

New estimation calculations and routing rules must state their purpose, inputs, units, rounding, assumptions, boundaries, ownership and independent test cases. Missing CREMS source is not a blocker to proposing and implementing explicitly synthetic PPO rules. Actual commercial values, technical claims and operational approval still need their own evidence. This decision does not supply those facts or authorise cutover of an operational system. MYOB, SharePoint and native CAD responsibilities retain their existing scope.

Professional quality is assessed by observable outcomes: users can find their work, understand the current state and next action, complete connected journeys, recover exact saved work after interruption and receive timely responses. Tests, actual screen inspection and measured before/after workloads are separate from owner, physical-device, accessibility and operational acceptance.

## Authorised bounded increment

Baseline: merged PR #369, main `f0953c5f9f5a0c5e1c5179ef933fd87c9e37b00e`.

1. Align the living blueprint, project instructions and current work record with this direction.
2. Reproduce the large offline queue's completion handoff, preserve all originals/receipts/photos and verify the normal user interface through submission for review. Retain the bounded offline protocol and existing authority checks.
3. Profile the slowest current core reads, make a bounded improvement justified by measurements and repeat the same workload. Keep the candidate target and failure boundaries unchanged.
4. Walk through connected synthetic customer and service journeys, record observed friction and handover gaps, and distinguish automation/source inspection from human acceptance.

Use an isolated branch and reviewable PR. No merge, deployment, operational migration or external business transaction is part of this increment. Execution and remaining limitations belong in the [quality increment evidence](../testing/evidence/product-quality-next/README.md).
