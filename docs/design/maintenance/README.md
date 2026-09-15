# Service Agreements & Maintenance source

The standalone r01 workspace covers MA-01–MA-04 and the local renewal-review preparation in MA-05. See the [design and receiving handover](../../decisions/service-agreements-maintenance-design.md).

Edit the model, workspace script, CSS and template here, then build from the repository root:

```sh
python3 scripts/build-maintenance-design.py
node scripts/check-maintenance-model.mjs
node scripts/check-maintenance-browser.mjs
```

The browser check uses the repository's maintained Playwright/browser installation. No runtime dependency is added. The builder embeds all fonts, icons, CSS, synthetic records and scripts into [the HTML](../../reference/ui/maintenance/PPO-Service-Agreements-and-Maintenance-Workspace-r01.html). Once r01 is accepted as an issued baseline, material successor changes need a new reviewed issue; Git records this draft's development history.

The three embedded Roboto weights are copied exactly from the supplied Theme & Style Board r20 (Roboto, Google, Apache License 2.0). The shared line icons retain the supplied Work Orders / Service Review lineage. The source templates and terms are fictional and prescribe no operational equipment-maintenance intervals.
