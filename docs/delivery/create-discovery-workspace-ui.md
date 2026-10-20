# Create discovery workspace — UI delivery

<!-- versioning: git -->

Owner: this Codex ES-02 creation session. Implementation is delivered in [draft PR #641](https://github.com/deanrfiedler-gif/powerplants-one/pull/641). Executed checks and confirmed local baseline limits are recorded in the [evidence record](../testing/evidence/create-discovery-workspace/README.md). Complete pinned-runtime CI and owner visual review remain pending.

This page change depends on the reviewed creation/initial-owner contract in PR #637. It retains the accepted **PPO - Design**, page `1414:356570`, named version **Create discovery workspace — accepted**, and the later [combined creation review direction](../decisions/discovery-creation-journey.md). No new parent ID, dependency, capability or deployment is proposed.

## Claimed build plan and delivered scope

- Replace only `/estimating/discovery/new` with the choose-opportunity and five-step first-discovery composition. Keep neighbouring register and saved workspace behaviour intact.
- Reuse the wizard's fields, configuration editors, family overview, status/change primitives and dialog pattern, shared Button, RecordTabs, command recovery and compact phone header. Extract only the existing dialog and question editor where a second consumer requires them.
- Keep `estimatingOptions` and `discoveryFormOptions` unchanged. Add narrowly scoped reads for permitted Sales brief labels and the existing-workspace collision destination; compose the prerequisite create/preview contract.
- Use synthetic fixtures with stable IDs and explicit provenance. Exercise accepted-brief entry, automatic exact brief attachment, estimator assignment, incomplete valid creation, stale sources, duplicate creation, permission loss and uncertain original-operation recovery.
- Update the page contract, register, guide, shared consumer bindings and status in this PR. Generate the build sequence and status; preserve the retained reference captures.
- Compare desktop 1440, tablet 1024, phone 390 and 320 and every drawn state. Run studio, lint, types, unit, build, naming/foundation and focused browser proofs. Record actual outcomes and limitations separately.

## Known adaptation points

The latest user direction combines exact Sales linking and initial estimator selection in the final create review. The older banner's second linking journey therefore changes. Current validation requires an owned follow-up for every unresolved required answer, including Answered Sales statements; counts must come from the current proposal rather than the example's two follow-ups. The shared compact phone header supersedes the older task header composition. None of these changes grants owner visual acceptance.
