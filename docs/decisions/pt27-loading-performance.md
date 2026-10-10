# PT-27 loading performance

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Direction: 10 October 2026 (Australia/Brisbane). Requirements: NFR-04, AT-23, PT-27 and the existing Customers directory/record journey. Review and owner acceptance remain separate.

Dean authorised the next bounded performance increment: measure Customers first load and record navigation on a fixed compiled build, cover desktop/phone and ten concurrent virtual users, identify the largest measured delay, correct that cause and repeat the same workload. Preserve the three-second candidate target, permissions, current identity/company scope, navigation and exact saved work.

Repository writer for this scope: **Find the next project step**, isolated branch `codex/pt27-loading-performance`, initially based on main `794aee6c0a540189c7fcce16c7d077c21bac68c6`. PR #390's integration and owner walkthrough remain with the existing integration session. This contribution does not duplicate that work or record human observations on Dean's behalf.

Use the existing pinned stack and additive synthetic benchmark fixture. A standalone compiled mode in the existing performance sampler allows a declared local port and an exact retained fixture across source builds; the default development/compiled CI procedure, ten independent browser processes, four waves, viewports, network throttling, sample deadlines and readiness assertions remain intact. Linux process-memory counters are explicitly unavailable on Windows. Source/build identity, fixture fingerprints and original failed attempts must remain visible.

No new dependency, service, operational integration, deployment or production authority is included. A measured local improvement does not by itself close PT-27, the older browser timeout, owner/device/accessibility review or hosted timing obligations. Implementation choice and before/after evidence will be recorded in the contribution's execution record.

## Selected correction

The baseline ten-user Customers trace observes automatic shell destination requests during current-page loading, including Home before the session read finishes and Sales destinations while the directory settles. ProductNavigation links now use the existing Next Link `prefetch={false}` policy already adopted for directory links. This removes speculative destination rendering; URLs, click/keyboard/touch navigation, permissions and the unsaved-work guard remain unchanged. It is a bounded use of the existing stack, not a new technology choice.

The large variable-font transfer was investigated but does not explain the warm-load delay: repeat waves transfer no font bytes. No typography change is included. Keeping eager shell prefetch would retain the observed extra work; changing session authority, database timeouts or readiness thresholds would not be justified by this evidence.

## Review disposition

The [final comparison](../testing/evidence/pt27-loading/README.md) removes 940 observed speculative requests and improves desktop warm p95 from 3.234 to 2.520 seconds. Cold-phone p95 worsens from 5.196 to 7.407 seconds. Keep the contribution in draft: this is a measured candidate, not an accepted overall performance improvement. Investigate cold-phone request and render timing with controlled repeats before accepting the tradeoff. Full PT-27, the four-view sampler stall and hosted/device acceptance remain open.

## Authorised continuation

Dean authorised the next step after PR #390 merged. Integrate main `6c69d92`, preserve both contribution histories and compare unchanged main with the shell candidate in a predeclared main/candidate/candidate/main block. Build each source once, retain its build ID, restore the same build for repeats, use fresh server/browser processes and keep the existing fixture, device/network profile, readiness assertions and deadlines. Add diagnostic phase observations after the measured readiness boundary; no diagnostic may exempt a network request. The earlier evidence remains unchanged. Adopt a narrower correction only if the controlled observations support it.

## Narrowed correction after the first controlled block

The main/candidate/candidate/main block repeats the cold-phone loss with the broad policy; its full samples are retained in `docs/testing/evidence/pt27-loading/controlled-repeat/`. Main cold-phone p95 is 8.745/6.237 seconds versus 12.300/7.275 for the candidate. Substantial host/download variation prevents attributing every delay, but does not justify adopting the broad change. Narrow the candidate to the desktop rail Home, rail destinations and desktop More links. Restore the shared header, breadcrumbs and phone links exactly to the prior policy. Keep the phone touch/Back regression proof and retain its observed network work. Predeclare a new main/narrow/narrow/main block using one preserved build per source and the same fixture, network, samples and deadlines; retain all four runs without replacement.
