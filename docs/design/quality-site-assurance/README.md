# Quality, Safety & Site Assurance design source

This is the reproducible source of the [standalone r01 workspace](../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html). The [detailed report](../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-Report-r01.md) documents every delivered view, interaction and boundary. The [decision/handover](../../decisions/quality-site-assurance-design.md) retains authorisation, provenance and receiving scope.

| File | Purpose |
|---|---|
| `model.js` | Synthetic source/context, immutable-by-command submissions and decisions, guarded actions, receipt recovery and session validation |
| `workspace.js` | Six-view UI, record dialogs, file decoding, local session persistence and recovery |
| `workspace.css` | Scoped r20 palette, layout, forms, snapshots and responsive rules |
| `fonts.css` | Exact embedded r20 Roboto declarations |
| `template.html` | Self-contained document assembly template |

Use the existing repository runtime pins for repository checks:

```sh
python3 scripts/build-quality-site-assurance.py
node scripts/check-quality-site-assurance-model.mjs
node scripts/check-quality-site-assurance-browser.mjs
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
git diff --check
```

The native script uses the existing pinned Playwright and Chrome installation. It writes results and screenshots under the ignored `verification-evidence/quality-site-assurance/` directory. The focused workflow retains its original artifact; the [evidence record](../../testing/evidence/quality-site-assurance-r01/README.md) records actual execution, hashes and visual review limits.

No application dependency or framework is added. Procedures and values are fictional; local roles are not authentication. The file can be opened directly after download and has no runtime network dependency. External links open reference sources only.

Roboto attribution: copyright 2011 Google Inc., Apache License 2.0. The exact declarations were extracted from the repository r20 style board, SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`.
