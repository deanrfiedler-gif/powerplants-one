# PJ-06 failure and review evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic verification only. Original local logs remain private and are identified by [SHA-256 hashes](retained-log-hashes.json). Failed and interrupted runs are not passes.

## Persistence findings

Initial development exposed a PostgreSQL operator-precedence error in the retained Activity comparison and a generated SQL delimiter error. Both were corrected; neither is attributed to main. A Library drift fixture also used the wrong response field for its expected version and was corrected to the native document version.

Independent review found three actionable persistence gaps:

- [Snapshot hash](https://github.com/deanrfiedler-gif/powerplants-one/pull/518#discussion_r4282947783): the database compared non-revision hashes with prior events but did not recompute the snapshot hash. The original direct-write test failed with `Retain exact submitted content and sources`, instead of `Exact source snapshot hash required`. The guard now recomputes canonical SHA-256 before transitions. Direct forged Revise and Accept hashes are rejected.
- [Extra snapshot members](https://github.com/deanrfiedler-gif/powerplants-one/pull/518#discussion_r4283017030): valid source members could be augmented with an invented authority field. The guard now accepts exactly `commercial`, `engineering` and `demand`. The regression supplies an invented `technical_release` with a correctly computed hash and proves rejection.
- [Extra content members](https://github.com/deanrfiedler-gif/powerplants-one/pull/518#discussion_r4283116044): required-field presence alone did not establish a closed projection. The database now checks exact content and nested reference members, reference types, required text, bounded unresolved-context reasons and calendar dates. Direct extra content/reference fields, string or missing reference versions, null title and boolean reason are rejected. A valid explicitly dated brief still succeeds.

The final PJ06-04 regression passed on `ad0e173108236cf3c3d2b8f7a3452e7bd33dc622` in 54.7738116 seconds. [Independent review of that exact commit](https://github.com/deanrfiedler-gif/powerplants-one/pull/518#issuecomment-6192704572) completed cleanly. The three threads were then replied to and resolved. Author resolution is separate from that independent review.

## Host and baseline comparisons

Earlier PJ-06 runs hit the unchanged 120-second case limit. An unchanged-main PJ05 concurrency control passed in 34.5160919 seconds; this did not reproduce a baseline failure. Two later upgrade attempts failed with PostgreSQL `57014` while executing the existing schema-disposal script, before migration 0103. The corresponding populated-0025 main control passed in 62.0988731 seconds. Those transient disposal failures are retained, not classified as proven baseline defects. Rechecks with unchanged limits passed. The final pinned native/upgrade run passed all eight cases; its longest case was 102.1582412 seconds. These synthetic timings are not service objectives or representative workload approval.

The complete pinned unit run executed 855 tests: 852 passed and three failed. All three reproduced on unchanged main `a676fde58d2ee88878bb2f9489912c97f49636b3`, with the same pinned Node 24.21.0 runtime: two `document-store.test.ts` cases returned `ExactDocumentUnavailable`; the `recovery.test.ts` private-directory case returned `Unsafe recovery directory` before its expected Git-path refusal. The Windows temporary directory uses a short-name alias and differs from its canonical real path. These guards and assertions were not weakened. The Linux CI result remains a separate gate.

The first application build used a shared dependency junction, which Turbopack refused because it pointed outside the filesystem root. The same standard build failure reproduced on unchanged main. The junction was moved into the private scratch directory without changing its target; this worktree then received its own `npm ci` using repository-pinned Node 24.21.0 and npm 11.19.0. The Node archive was checked against the publisher's SHA-256 manifest. No dependency version, lockfile or build configuration changed. The lockfile's existing npm audit advisories were not assessed or changed by this contribution.

An earlier combined application check was interrupted during full lint to reduce host pressure; it is not a pass. The later full lint completed successfully. No timeout, assertion, historical expectation or required test was relaxed to obtain a pass.
