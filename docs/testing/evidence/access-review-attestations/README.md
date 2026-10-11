# AD-01 local review attestation execution evidence

Runtime source: `041402f`; publication/test head before documentation: `89937ba`. [Contract](../../../decisions/access-review-attestations.md) and [agent source review](review.md). Prototype API/record foundation; native attestation controls and campaign completion remain open. No owner/security acceptance or deployment.

## Completed checks

| Proof | Observed result |
|---|---|
| Access regression | 101 reported checks passed, including the new review suite and existing requests/application/withdrawal/team/inspection behavior. |
| Final precise-timestamp review suite | 18 reported checks passed on an independent UTF8 disposable database. |
| Compiled HTTP | Five checks passed: read/write duties, session/origin boundaries, strict input, stale basis, exact replay/recovery and unchanged grants. |
| Native inspection/catalogue | 14 of 15 initial cases passed; the failed 320 px case passed twice unchanged on replay. All 15 unique cases now have passing evidence. The app logged DatabaseConnectTimeout in the initial run; no test deadline changed. |
| Upgrade replays | FI-07, FI-01 and P07 each passed. Exact Field grant-count corrections are retained with the original failed run, which is still in progress across other historical files. |
| Estimating across 0026 | E2 original identities, accepted costs, quotation receipts and stored originals passed. |
| Selected units | 22 passed. |
| Retained design | 107 model and 40 browser checks passed; 137 capabilities, source hash from LF bytes. |
| Build and assurance | Final compiled build/TypeScript, targeted lint, studio, foundation and naming passed. Foundation retains 78 parent IDs and 22 issued sources. |

Broader historical migration proofs, reserved Products 0052 installation, existing-demo upgrade and the permissions-matrix wrapper replay are **still running**. CI is separate. The matrix first hit its existing 110-second deadline; no timeout or assertion has been relaxed. Final results will replace this in-progress handover before task completion.

The initial new fixture used an unsupported hosted issuer and was corrected to the existing PPO-EntraDemo fixture. A fresh independent Windows cluster inherited WIN1252 and rejected existing Unicode seed data before the new migration; only that task-owned disposable database was recreated as UTF8. The initial HTTP test expected route JSON for a foreign origin, but the launcher correctly refused earlier with plain text/no-store; the corrected assertion preserves both boundaries. Initial logs and replays are retained in [checks.json](checks.json).

Local execution uses PostgreSQL 16.15, Node 24.21.0/npm 11.19.0 and Chrome 155.0.8059.40. All database suites target only ppo_synthetic_test. The compiled app uses a separate synthetic database. Configuration, credentials and raw service data remain outside Git. Published logs are credential-scanned, path-redacted UTF8/LF text; their exact hashes are in checks.json. Existing source and review fingerprints are not updated as acceptance.

The working design register/guides document the API boundary and new capability label. No component implementation, host fixture, binding or layout changes; native review images remain missing. Operational D-020, other decisions, assigned campaigns, review-origin request separation, cadence/retention, membership lifecycle, independent/owner/device review and deployment remain open.
