---
title: Offline restart proof uses the compiled build in CI
date: 2026-11-01
---

On #772, a documentation-only pull request, `P01–P11 http proof` failed in `scripts/offline-restart-proof.ts` at line 149 ([job 124613609747](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/41205930261/job/124613609747)). The download click completed, but after five seconds the notice still read "Downloading selected job — no new local save is confirmed yet." The server log shows why: the proof starts the development server, and the two requests behind that notice spent 1,674 ms and 1,392 ms compiling their routes before the page could confirm the save. The P12 recovery case, which runs the same proof, has failed in the same `download` phase on `main` ([run 40954630565](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40954630565)).

The proof now accepts the opt-in `PPO_PROOF_COMPILED=1` already used by `scripts/report-restart-proof.ts` and serves the completed build with `scripts/local-server.ts --compiled`. `application.yml` sets it on the offline restart step and on the database step that runs P12; both jobs run `npm run check`, which ends with `npm run build`, beforehand. Every assertion, deadline and phase is unchanged, and without the variable the proof still starts the development server as before. This follows the HTTP routes step's own rule: route compilation is not the contract under test.

Not verified here: the browser and database suites, which need CI. A passing run will show that this removes one source of delay; it does not prove the historical P12 cause. The separate CR05 failure in the same #772 run (`tests/browser/sales-workflows.spec.ts:358`) is addressed by draft #738, not by this change.
