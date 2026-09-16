# ES-10 r01 verification record

Baseline: main `d565a9de01b94aa7ad3fffe3a996f78c3aee589b`. Incoming ES-09: PR #220 source `19a029bb9f7e97517432b9538ba17f7144ed2023`.

## Executed locally

- 24 model groups passed using `node scripts/check-reference-calibration-model.mjs`.
- Syntax checks passed for both source JavaScript files and both `.mjs` verification runners.
- Deterministic builder executed; output hash and publication evidence will be recorded below.

The environment could read GitHub through the connector but could not complete a direct clone. Required foundation/prototype/naming checks therefore run against the full checkout in the dedicated CI workflow; no complete local repository pass is claimed.

The cloud browser blocked local HTTP and file URLs. No local native rendering or visual-inspection pass is claimed. The dedicated **Reference cases and calibration design** workflow uses the existing repository Node/npm/Playwright/Chrome pins, runs the model suite and all three repository checks, and executes native interactions at 1440, 1024, 820, 390 and 320 px. It retains original screenshot hashes, browser version, source head, HTML hash and group results in the workflow artifact.

## Publication evidence

Pending initial CI publication. This section will be updated with observed results, source hashes and visual review; successful source inspection is not substituted for execution.

## Remaining acceptance

Owner acceptance, screen-reader and physical-device review, high-contrast/200% zoom assessment, controlled print output, authenticated server permissions, durable storage, actual ES-09 receiving integration and ES-08/adoption governance remain separate.
