# P03 desktop and mobile inspection evidence

Original PNGs from [application run 33949129677](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33949129677), artifact `9964287660`. Source PR head `8e32049373fd13749cfb77b177f209e9f98d35d9`, implementation tree `ead79d134fb8e5753bc480e16de0f6a8e862cc94`. No image content was edited. [manifest.json](manifest.json) records original artifact paths, exact dimensions, SHA-256 hashes and archive provenance.

The implementing agent manually inspected all 38 captures on 5 September 2026. Desktop viewport: 1440×1000; phone viewport: 390×844; screenshots capture complete pages. Long pages use normal vertical scrolling. The navy/green shell, synthetic environment banner, visible focus and readable cards/forms are retained. No blocking overlap or horizontal page clipping was found. Native date controls follow browser formatting; long selected values can clip inside native controls and remain keyboard accessible.

The underlying run passed 4 unit, 29 PostgreSQL, 4 HTTP and 12 Chromium cases, plus install/build, migrations, fresh/upgrade seed/reset and real PostgreSQL restart. Screenshots supplement persisted and API assertions; they do not prove an independent review, physical phone, other browser, screen reader, offline behaviour or full PT/AT acceptance. The [handover](../../../delivery/p03-handover.md) and [delivery issue #24](https://github.com/deanrfiedler-gif/powerplants-one/issues/24) hold full results, corrections, limitations and final publication state.

| View | Desktop | Mobile | Inspection finding |
|---|---|---|---|
| Customer search and distinct identities | [PNG](desktop-customers-list.png) | [PNG](mobile-customers-list.png) | Same-name cards have distinct permanent references and permitted context. |
| Customer relationships and mapping status | [PNG](desktop-customer.png) | [PNG](mobile-customer.png) | Affiliations, related site, duplicate review and Proposed mapping shown; source account keys absent. |
| Shared contact identity | [PNG](desktop-contact.png) | [PNG](mobile-contact.png) | Person identity and permitted affiliations remain linked. |
| Site and equipment context | [PNG](desktop-site.png) | [PNG](mobile-site.png) | Historical operator and current operator/owner/billing remain distinct; timezone/access/unknown address explicit; loaded history and follow-up visible. |
| Equipment history and configurations | [PNG](desktop-history.png) | [PNG](mobile-history.png) | Unsuccessful cable replacement retains original author, time, previous site/operator and source key; configurations remain ReviewRequired; owned OEM task supplements immutable historical wording. |
| Unresolved equipment | [PNG](desktop-identity-uncertainty.png) | [PNG](mobile-identity-uncertainty.png) | Unknown identity and disputed serial questions remain explicit, with an owned identification follow-up. |
| My Work | [PNG](desktop-work.png) | [PNG](mobile-work.png) | Overdue, upcoming and due-date-needed groups remain separate, with current owner and permitted links. |
| Create activity | [PNG](desktop-create-activity.png) | [PNG](mobile-create-activity.png) | Labels, selected link context, owner and explicit due-needed controls fit both widths. |
| Owned clarification activity | [PNG](desktop-activity.png) | [PNG](mobile-activity.png) | CustomerContact classification, owner, due-needed and bounded lifecycle forms shown. |
| Completed activity | [PNG](desktop-activity-completed.png) | [PNG](mobile-activity-completed.png) | Outcome persists and terminal state is visible. |
| Create incomplete intake | [PNG](desktop-create-intake.png) | [PNG](mobile-create-intake.png) | Labelled fields, multiline symptoms and explicit requester/site unknowns remain usable. |
| Invalid triage | [PNG](desktop-intake-validation.png) | [PNG](mobile-intake-validation.png) | Stage blockers and focused validation summary retain form entries; urgent does not bypass missing information. |
| Competing intake edit | [PNG](desktop-intake-conflict.png) | [PNG](mobile-intake-conflict.png) | Saved version and retained proposal remain distinct; adopting the new expected version is explicit. |
| Completed intake assessment | [PNG](desktop-triaged.png) | [PNG](mobile-triaged.png) | Triaged and Urgent with completed owned clarification; work authorisation/booking boundary remains visible. |
| Service-request list | [PNG](desktop-tickets-list.png) | [PNG](mobile-tickets-list.png) | Distinct references and known/legacy-unverified received-time provenance are visible. |
| Confirmed empty query | [PNG](desktop-empty.png) | [PNG](mobile-empty.png) | Explicit complete filtered result and no-match message; search focus ring visible. |
| Unavailable query | [PNG](desktop-unavailable.png) | [PNG](mobile-unavailable.png) | Error and retry replace the previous empty result; no zero/empty queue is asserted. |
| Systems identity restriction | [PNG](desktop-permission.png) | [PNG](mobile-permission.png) | Previous business data cleared, identity banner changed, scoped permission failure visible. |
| Recoverable create failure | [PNG](desktop-failure-focus.png) | [PNG](mobile-failure-focus.png) | Entered name/owner/reason retained; keyboard focus visible. Browser test separately proves accepted-unreadable response retry creates one organisation. |
