---
title: Facilities CS-05 browser regression repair
date: 2026-10-21
---

[PR #627](https://github.com/deanrfiedler-gif/powerplants-one/pull/627) repairs a Facilities record scroll defect that left the final Sources control under the fixed phone actions. Native browser proof now exercises normal pin-form clicks at 390 and 320 px. Facilities tests also follow the real hierarchy and phone controls, wait for required review acknowledgement and use distinct synthetic names. The page contract, component contract, guide and register describe the reachable controls without changing grants or persistence.

[Verification evidence](../testing/evidence/cs05-accepted-build/README.md) separates the resolved Chrome installation dependency, the failing integration run, local repair checks and subsequent CI. The runtime repair remains in the separately merged PR #643. Owner visual review remains pending; no merge, deployment or business acceptance is claimed.
