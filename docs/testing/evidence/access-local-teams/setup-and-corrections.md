# Setup and retained corrections

Temporary PostgreSQL 16 and the compiled local application use loopback ports 55492/3092. Credentials and environments remain outside Git in the previous task's private directory. PostgreSQL was started with explicit loopback/port options; no durability settings were changed. Test database is `ppo_synthetic_test`; the browser uses a separate `ppo_synthetic` database on that same server. The test document store also remains private and outside Git.

The first database run used `ValidationFailed` instead of the repository's `InvalidData` error code in four refusal subtests. Correcting those assertions exposed the hosted-identity fixture's missing separate demo migration; the fixture now installs `db/demo/0001-identity.sql` before testing hosted masking. No application check was relaxed. Both failed logs are retained. The corrected access regression run passes 81 tests, including 15 local-team checks (13 subtests plus two parents).

The initial 42-check compiled browser run passed 39 and failed the unavailable/denied scenario at all three widths because its exact selector sought `Retry` while the shared control is labelled `Retry loading`. The corrected nine local-team checks pass; the other 33 original inspection/role checks passed in that initial run. The initial log's code-frame text reflects the corrected working file, but its call log retains the actual old `Retry` selector. Raw traces/cookie jars and unsanitised failure screenshots remain outside Git.

The project-instructions update initially exceeded its 8,000-character copy limit. Its compact decision pointer now keeps the instructions at 7,994 characters without changing the maintained authority boundary. The failed naming report and passing report are both retained.

The retained browser checker was run through a temporary copy with only its repository/output paths and Playwright import resolved explicitly, to keep generated captures outside Git. Its first setup failed because a Windows absolute ESM import lacked a file URL. Correcting that import ran the same 40 checks successfully. Only the checker JSON/text is retained here; its icon-bearing captures are not published. The six native images in this folder substitute placeholders in the DOM before capture and were all inspected.

The implementation build was repeated after the roster loading adjustment so its opener retains keyboard focus. Both builds pass. A mistaken unit command included a nonexistent navigation filename and ran only the two available access files (three tests); the final explicit file list ran all 19 intended checks. The final unit log is authoritative.

No setup failure grants owner review, visual acceptance, business-policy adoption or production readiness.
