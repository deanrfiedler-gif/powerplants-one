# AD-02 implementation evidence

Owner: Codex for Dean. Branch: `codex/settings-hub`; draft PR #802. All values are synthetic.

## Status

Implementation and validation in progress. Functional proof is incomplete. Visual review is pending; owner acceptance and deployment are not claimed. [Accepted frames](../../../reference/ui/settings/settings-hub-design-r01/README.md) remain unchanged.

## Design differences

- Dean chose on 31 October 2026 to hide unavailable areas. Nine catalogue entries remain; only real, permitted destinations appear. Templates has a backend, while its management page is in PR #704 on the starting main.
- Native source rows, names, dates and counts replace the 22 October story. No MYOB health result or access request is fabricated.
- Only Terms and proposal tabs are built. History/Affected work and amendment phone sheets are excluded. Used by remains record facts, without a separate tab. Waiting to publish filters the same authorised register read.
- Readiness and working calendars use read-only terms, with no editor. No migration, capability or grant is added.
- The native required command reason uses the explicit confirmation text when the optional publication note is blank. Proposal/review reasons remain required.
- Review remains an explicit server action with proposer refusal. Standard shared modal behaviour applies on phones; no amendment sheet is claimed.
- No bulk selection or column customisation is built; there is no bulk command. Search and policy-name sort work.

## Verification log

Validation is in progress. These are executed results, not a claim that the final head is ready:

- Genuine npm ci passed on Node 24.22.2/npm 11.19.0, without an engine override or node_modules junction.
- Typecheck with an 8 GB heap passed after the phone group and stacked terms changes. The two focused unit tests passed in the earlier run.
- The combined policy database/HTTP run had 15 passes and two failures: an HTTP exact-retry fixture used the wrong actor (corrected), and one authority test timed out while seeding. The corrected direct HTTP harness and isolated authority test subsequently passed. The unmodified-main authority test also passed on the private cluster. No unresolved failure is called unrelated.
- The three new AD-02 database tests passed: per-area/direct access, read-only seed families, atomic proposer refusal without new grants, stale-publication refusal, exact receipt recovery and future publication versus the in-force version.
- An earlier four-test AD-02 browser run passed. A later run had three passes and an initial identity-read connection timeout. Final phone captures are being rerun. The native PL-04 regression run also encountered a login database connection timeout before entering the workflow; this is not counted as a pass.
- Earlier foundation, naming and status checks passed. The latest studio check identified an overly broad SharedRecord consumer declaration; that declaration is corrected and awaits rerun. Full lint and final documentation checks are pending.

Local runtime uses private PostgreSQL 16 clusters on loopback 55482 and 55483, each named ppo_synthetic_test, and the dedicated development server on PPO_PORT 3182. Native connection/query limits remain unchanged. Existing services are untouched. No deployment, independent review, owner acceptance or completed visual review is claimed.
