# SH-06 source — approvals and handover inbox

The [portable HTML](../../reference/ui/approvals-handover/PPO-Cross-Module-Approvals-and-Handover-Inbox-r01.html) and [detailed report](../../reference/ui/approvals-handover/PPO-Cross-Module-Approvals-and-Handover-Inbox-Report-r01.md) are the review deliverables.

- `template.html`: workspace interior and assembly markers.
- `workspace.css`: r20 visual tokens, queue/detail and responsive presentation.
- `model.js`: synthetic permission-filtered projections, dates, deduplication and exact source resolver. No decision command.
- `workspace.js`: queue/detail, seven domain destination previews, local view preferences and recovery.
- `fonts.css`, `icons.json`: unchanged copies from SH-03 Notifications, grounded in the supplied r20 board. Embedded Roboto remains under its existing Google/Apache 2.0 provenance.

```sh
python3 scripts/build-approvals-handover.py
node scripts/check-approvals-handover-model.mjs
node scripts/check-approvals-handover-browser.mjs
```

The native check requires the existing repository Playwright and Chrome pins. The focused read-only GitHub workflow installs those pins and retains original screenshots. Edit sources and rebuild; do not hand-edit generated HTML. No new runtime dependency or application architecture is introduced.

The dates and entities are fictional. Preview role selection is not authentication. Domain destination previews are bounded explanatory screens, not connected operational approval modules. [Verification and limits](../../testing/evidence/approvals-handover-r01/README.md).
