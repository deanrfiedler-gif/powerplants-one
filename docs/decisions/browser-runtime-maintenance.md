# Browser runtime maintenance

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Review status:** Repository repair prepared; final-head CI and hosted rollout are separate. **Source baseline:** `58679be051d8dc8da4356a714fb0f37d09902092`. **Related decision:** [ADR-0022](ADR-0022-maintained-browser-runtime.md), whose retained r02 record remains unchanged.

## 7 October 2026 — Chrome 155 and Azure update #90

[Update Azure private demo #90](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37525905563), source `58679be`, failed during `RUN npm run browser:install`. The log records installation of Google's stable Linux package `155.0.8059.39-1`, followed by rejection from `assertSupportedBrowser`, which accepted only majors 153 and 154. Three installer attempts encountered the same compatibility refusal. Authentication and resource checks passed; image build failed before push, and both the database operation and web/worker rollout were skipped. This run did not change the hosted database or web/worker images. Previous successful update [#89](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37450254675) used source `1ffcf653cd94982ea3f58253d3dc9c4f9be7ebbc`; that receipt does not establish the currently serving state.

Google's [6 October stable release announcement](https://chromereleases.googleblog.com/2026/10/stable-channel-update-for-desktop_086471744.html) lists Linux `155.0.8059.39` and Windows/macOS `.39/.40`. Continue using the existing [Playwright Chrome channel](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge), with **major 155 accepted from `155.0.8059.39`**. Retain the earlier major-specific floors, reject earlier 155 builds and unreviewed majors from 156, and include the actual installed version in rejection diagnostics. This is a compatibility range extension under ADR-0022, not a new browser installer or permission change.

Removing the guard would silently accept future majors; pinning or downgrading to a historical browser package would change the maintained stable-channel policy. Neither is needed for this repair. Keep exact Playwright dependencies, launch defaults, request blocking, document hashes and actual-browser receipts. Existing issued outputs remain unchanged. The repair adds no SQL, seeds, grants, template changes or workflow permissions.

## Verification and recovery

Boundary regression cases cover the exact 155 floor, earlier builds/patches, later patches/builds, retained 153/154 compatibility, malformed versions and future-major rejection. Actual PDF rendering, browser journeys and the final non-root image check remain distinct from these unit cases. The existing Azure preparation PR workflow builds the same Dockerfile without a cloud sign-in; its success is required to establish the previously failing build path on Chrome 155. Independent review and owner acceptance are not inferred from an edit or passing check.

After the repair is merged and the selected source passes its checks, start a **new main-source update** under the [existing release runbook](../delivery/azure-private-demo.md#release-a-reviewed-update). Rerunning #90 still selects its old source and cannot use this repair. Keep the database review/gate and main/environment restrictions. This browser fix alone needs no database upgrade; any pending migrations in the selected main source retain their own reviewed upgrade requirements. Do not reset data or change tester expiry to resolve this build failure.

Local focused verification on Node 24.21.0/npm 11.19.0 passed all 19 browser-policy, hosted-boundary and login unit cases. `npm run browser:check` passed a real synthetic PDF render with the workstation's Chrome `154.0.8037.98` and Playwright 1.63.0; that is retained-major evidence, not a Chrome 155 pass. The local Docker engine is unavailable, so the Linux image and Chrome 155 checks require CI. Final-head verification is recorded on the repair PR. No Azure deployment has been run by this repair session.
