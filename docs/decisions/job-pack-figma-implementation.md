# Job Pack application implementation

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Decision date:** 13 October 2026. **Scope:** SV-05 / SC-06; SVC-03, SVC-06, OUT-09. Implementation and owner/device acceptance are separate.

Dean requested implementation of the accepted Job Pack Figma page in the application, including backend improvements where needed. This authorises the application build described here. It does not turn synthetic data or rules into operational authority. The named design version and frame identities remain in the [accepted design decision](job-pack-figma-design.md); the private Figma link and licensed artwork are not copied into the public repository.

## Design and architecture

Reuse the existing Next.js/React application, PostgreSQL reads, permissions and durable command services under ADR-0003 and ADR-0011. The register needs a permission-filtered projection of existing saved revisions, appointments, render jobs and dispatch results, plus a read of confirmed unstarted visits genuinely lacking a pack. These reads do not require a new store, schema, seed, capability, dependency or service. A separate browser-maintained pack model would duplicate authority; copying current source text into a register title would bypass the saved-section verification contract. Neither alternative is adopted.

The page types remain Register / worklist, Record detail, guided Preparation and decision dialogs. The record uses the shared `SecondaryMenuFrame`, header identity, Font Awesome Kit/fallback, worklist menus and dialog patterns; the register uses shared Button and RegisterTable controls. Existing PackDialog, sections, preparation forms and status cards retain their specific exact-revision behaviour. Incoming handovers are appointment, work order and personal job; outgoing handovers are appointment readiness, approved work scope, exact issued document, recorded distribution and field acknowledgement.

The accepted arrangement is implemented with a 240 px secondary menu, visit-day register groups, filters and neutral counts, a record window, selection limited to opening/export, state-dependent primary action, dispatch summary, nine saved sections and a collapsible status panel. Phone register rows and coordinator Pack / Readiness / History views use the same permitted records. Display preferences are per workspace, viewer and device. They contain no business data. The shared main rail retains the viewer's expanded/collapsed preference.

## Checking one's own preparation

The accepted design left Q5 open. Asked whether to retain current permissions or require a separate checker, Dean delegated the choice: “Proceed however you believe is the most professional.” For this build, retain the existing `pack.check` permission and exact saved-revision/reason requirements. Do not infer the Estimates separation-of-duties rule for Job Packs. This is an explicit implementation choice within the delegated scope, not a claim that independent checking was an existing requirement. A later operational separation-of-duties policy would require its own decision and server enforcement.

## Boundaries and recovery

- Register rows follow the detail read's scope and recipient rules. A technician cannot receive an unissued successor, staff preparer metadata or staff readiness detail. Unavailable data is not reported as zero.
- The verified saved scope provides the job title. Unsupported or mismatched structured content keeps the saved reference/text fallback. D6, D7 and D9 of the earlier design remain applicable.
- Every readiness criterion and additional dispatch hold remains authoritative on the server. Summary conditions never clear an incident, policy, customer agreement, crew or source hold.
- A saved successor retains `needs_review` until issue. Current source drift drives the review action; a freshly Checked revision can queue its exact output, while an Issued revision needing review offers successor preparation.
- Saving creates an immutable revision. Checks, output requests, withdrawal, recovery and acknowledgement use the existing command/version/idempotency rules. Selection cannot perform those commands.
- An acknowledgement confirms the exact issue, assignment version and hash; opening, downloading or simulated sending is a different event. Failed acknowledgement leaves its confirmation and error available for retry.
- Export contains only the permitted register fields. Quoting and formula neutralisation cover user-supplied text.

## Verification and release

See [execution evidence](../testing/evidence/job-pack-figma-ui/README.md). The working page, component and guide masters are updated together. Retained Figma captures and issued r03 references remain unchanged. Tests and agent visual comparison do not grant owner, physical-device, assistive-technology or business acceptance. Source availability and deployment must be recorded separately against their actual commits.
