# Parent mobile browser regression

Parent PR #423 at `988a7343f262d4c083200337b7be344b0bb3dbbd` reported a failure in [P01–P11 browser-mobile proof](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38134036369/job/114454108725) during this increment's validation. The job reported 362 passes, 74 skips and one failure: `AD-01 submit, reopen and independently return an exact proposal without changing grants`, waiting for `Decision reason` after changing to the reviewer. Its retained page snapshot shows the Saved requests queue and the review-only identity, rather than the saved record.

The test clicked Open saved request and immediately used queue-compatible content (`SYN-B` and absence of Record decision) before capturing `page.url()`. Client navigation could finish after the old queue URL was captured; the later reviewer visit then reopened that queue. The repaired test obtains the exact link destination and waits for that URL before retaining it for reload and reviewer navigation. All decision, independent-authority and unchanged-grant assertions remain; no application behavior or timeout changes.

The local replay uses the existing compiled application at source `039df64103f09d804507ff226f4a35e3e11d7a4a`, the 45-second CI test budget, three repetitions at each of 1440/390/320 widths, and one worker. The first attempt started before the compiled server finished its cold startup; all nine attempts failed immediately at the initial session call with `ECONNREFUSED`. That setup log is retained separately. The actual replay begins only after the server reports ready and a successful local HTTP check.

The raw CI artifact, screenshots, traces and private configuration stay outside Git. This record links the original job without publishing icon-bearing screenshots or session data. The correction is carried by this draft; it does not turn the historical parent CI run green.

Result: all nine replays pass (three repetitions at each width), with targeted ESLint passing. `parent-browser-replay.txt` and the separate setup-failure log preserve both outcomes.
