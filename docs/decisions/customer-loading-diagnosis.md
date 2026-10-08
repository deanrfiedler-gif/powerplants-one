# Customers loading diagnosis and compiled asset caching

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Direction: 8 October 2026. User-authorised bounded quality continuation; automated evidence is separate from owner acceptance and deployment.

The [quality increment](product-direction-quality.md) improved the customer directory query while whole-page readiness remained unresolved. This experiment retains browser network/resource/long-task timelines before choosing a change. CREMS is historical background; the existing PT-27 three-second candidate target remains unchanged.

## Observed problem and bounded change

The compiled local launcher forced `private, no-store` onto successful public JavaScript and stylesheet chunks. Real headers and all 80 original navigations showed those build files being downloaded again on every wave. The single local-session read precedes the directory request; two shell-context reads and background prefetches also occur. Browser timing alone does not identify SQL, server CPU or process scheduling as the cause.

Allow only compiled GET/HEAD requests for flat `/_next/static/chunks/*.js` and `*.css` paths to retain Next's normal immutable cache headers. Existing loopback, host, origin, gateway and security-header checks execute first. Business pages, APIs, private images, non-chunk assets, unsafe methods and development mode retain no-store. Missing chunks retain Next's error policy, verified by actual requests. No customer data is put in a public cache. The hosted-demo gateway is unchanged; this is a local compiled-launcher correction, not a hosted performance claim.

## Verification and unresolved findings

The same compiled application, build `bXz2zLSgUTZhicOrJw-F3` at `24d19b1`, and the same fresh synthetic load fixture were used for baseline, candidate, reversal and confirmation. Exact authorised content, one directory read per navigation and seven declared table fingerprints were preserved in four complete 80-navigation runs. The candidate avoids repeat static transfers. Host/order variation remains visible: final desktop p95 is 4.421 seconds versus the reversal's 4.321, while phone is 2.469 versus 2.845. No overall desktop improvement or full PT-27 pass is claimed.

One intervening candidate repeat timed out waiting for a phone core response after recording 40 completed desktop checks. Its cause remains unresolved. The initial driver did not persist its in-memory samples; that limitation and the failure log remain explicit. Failure/checkpoint retention was strengthened without extending readiness deadlines; the following complete run does not erase the timeout.

[Execution, raw timelines and manifest](../testing/evidence/customer-loading-diagnosis/README.md) preserve every complete run and the unsuccessful attempt. The next performance boundary is the remaining pre-directory/cold-load delay and the unresolved timeout, with server-phase evidence before any database, session or shell deduplication change. Physical-device, hosted, accessibility and owner acceptance remain separate. No merge or deployment is authorised by this evidence.
