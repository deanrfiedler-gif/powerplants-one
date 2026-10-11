# PT-27 interrupted narrowed loading block

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 10 October 2026. Synthetic diagnostic; independent and owner acceptance remain separate.

The declared `20261010-main-narrow-abba` block was interrupted at position 2. Main `narrow-a1` completed all 80 directory loads and 20 record handovers. Candidate `narrow-b1` did not start its compiled server within the unchanged 120-second startup allowance and collected zero samples. Its `results.json.gz` retains the original assertion. Positions 3 and 4 were not run after that failure; this is not a completed or pooled comparison.

The terminal failure then exposed a cleanup bug: `await readFile(...)` evaluated before the catch attached to `writeFile(...)`, allowing the missing gateway log to mask the startup error. Driver `a8549a1` catches both file operations and runs server/database cleanup in `finally`. No sample, application behaviour, network condition or readiness deadline changes. A process check found the recorded owned server PID had already exited and nothing listening on the task's port; unrelated processes were left running.

The [subsequent four-position block](../narrowed-repeat/README.md) is separately declared and uses new labels and fresh servers/browser processes with the same preserved application builds. No successful replacement is inserted here. The original main run, failed candidate result, both logs and host snapshots remain in [artifacts.json](artifacts.json). The missing candidate gateway file and missing after-fixture are explicit consequences of failure before startup, not evidence of a passed measurement.
