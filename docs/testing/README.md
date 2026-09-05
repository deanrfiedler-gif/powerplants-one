# Acceptance and evidence

[acceptance-scenarios.csv](acceptance-scenarios.csv) contains AT-01–AT-38 from the master blueprint. Every scenario is planned and unexecuted. The catalogue describes business acceptance to elaborate, not tests that this documentation-only repository can already run.

Each future case needs requirement links, fixture/version, actor, preconditions, action, expected observable result, failure/recovery path, environment, actual result, evidence, defect links and reviewer disposition. Financial and calculation fixtures need independently accepted expected values rather than expectations copied from the implementation.

## Repository checks

`python3 scripts/check_foundation.py` validates source hashes, the derived register IDs/wording, initial backlog references, local Markdown links and selected hygiene. It makes no network calls and does not open or modify business accounts.

The GitHub documentation workflow uses `actions/checkout` pinned to the exact v7.0.1 commit verified from its official release/tag, with persisted credentials disabled and contents-read permission only. There are no deployment steps or application secrets.

Record execution status in [the foundation handover](../delivery/foundation-handover.md). Running the repository check cannot mark AT business scenarios passed. Branch protection and required checks must be assessed separately against actual account capabilities.

## Prototype procedures

[PP-01 acceptance](prototype-acceptance.md) provides 30 detailed synthetic procedures with a [structured catalogue](prototype-scenarios.json). All remain Not run. Parent scope coverage is bounded by the [disposition register](../prototype/traceability.csv); selected tests do not establish full-enterprise acceptance.
