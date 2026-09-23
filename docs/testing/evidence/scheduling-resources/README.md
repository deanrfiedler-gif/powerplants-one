# Scheduling & Resources — verification evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Base:** `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`.
Implementation, automated proof, visual inspection, owner acceptance and deployment are separate.

## Executed during implementation

- Node 24.21.0 / npm 11.19.0; installed maintained Chrome 154.0.8037.58 passed the repository browser/PDF guard.
- Focused unit suite: 6 passed, 0 failed. Covers competence validity/unknown evidence, travel order/buffers/overlaps, separate resources, analytical deduplication and safe exact return links.
- TypeScript: initial new-component typing failures corrected; subsequent check passed.
- PostgreSQL 16.15: task-owned loopback cluster on port 55475, named `ppo_synthetic_test`; all maintained migrations applied. Initial seed failed with statement timeout. Unchanged main's seed code reproduced the same failure against this isolated database; disabling JIT did not fix it and was reverted. This is setup evidence, not a Scheduling database pass.
- Broader automated checks, native captures and PR-head CI results are pending and will be recorded here after execution.

## Review boundaries

Retained source: `docs/reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html`, SHA-256 `def8ebed4adc4f41b41bbfe954f8286e1162a23bf0f734fc3007c9aef78cf6d5`. It is a proposed module reference, not an accepted whole native shell baseline. PL-02 full detail, PL-03 and PL-05 have no exact issued mockup.

Required review sizes: 1440 × 960, 1024 × 768, 390 × 844, 320 CSS px and 200% zoom. Check shell/scroll ownership, wrapping, visible controls, empty/denied/failure states, keyboard movement/focus and preserved booking recovery. Physical-device, independent accessibility and owner acceptance remain separate.
