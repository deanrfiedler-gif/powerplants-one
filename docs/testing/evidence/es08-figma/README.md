# ES-08 Figma implementation evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Prepared: 13 October 2026. Review status: implementation verification in progress; owner acceptance separate.

Source checkout: branch `codex/screen-configurator-figma`, based on `c3ff5b9`. Scope and source frames: [implementation decision](../../../decisions/es08-figma-implementation.md). No private Figma URL, Pro artwork or unmasked source capture is retained here.

The isolated local environment uses the disposable `ppo_synthetic_test` database, authored Northbank fixture and synthetic coordinator. Migration and seeding are setup of this private test instance; this increment adds no migration or seed.

## Verification ledger

Checks and reviewed captures will be recorded here after execution. A successful check is documentation or synthetic functional assurance, not business or engineering acceptance.

Local setup limit: Next's default Turbopack build refuses the isolated worktree's dependency junction because it points outside its filesystem root. That initial attempt also found the shared dependency folder missing the existing yauzl dependency. Installing the unchanged lockfile into this checkout resolved the setup; verification uses the normal build command. An intermediate webpack attempt was stopped when the isolated install was chosen.

## Remaining review

Named accepted Figma version and icon-free Figma source captures are not recorded. Physical-device, screen-reader and owner visual acceptance remain open. No production rules, ERP transaction, CAD authoring or customer communication are introduced.
