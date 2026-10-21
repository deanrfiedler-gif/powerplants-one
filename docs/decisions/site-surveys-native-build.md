# Site surveys CS-08 native build

<!-- versioning: git; committed history is authoritative -->

Date: 21 October 2026. Owner: Dean Fiedler. Implementation and owner visual review remain separate.

## Authority and scope

Implement the accepted Site surveys design, D1–D7 and Q1–Q4, from **PPO - Design**, named version **Site surveys — accepted**. Node 1464:2918 and notes 1464:4164 govern the existing /surveys and /surveys/[id] routes. Dean authorised the naming amendment and required migration: “Yes, adopt that naming approach across PPO for new records, preserving existing references. I approve the required migration—continue the Site surveys CS-08 build using SYN-SRV-000nnn.” See [reference namespaces](readable-reference-namespaces.md).

## Implementation choices

Migration 0114 broadens legacy synthetic reference validation, changes only new allocation defaults and adds first references for unnumbered surveys. The permanent synthetic counter namespace stays unchanged, so counters cannot restart. Existing reference values, 78 parent requirement IDs, external keys, survey revision content, snapshot hashes, grants and seed receipts remain unchanged. Planned visits and contact on site live in the existing revisioned survey content; original photo filename/media type are immutable file facts, separate from older snapshot payloads. No new capability, seed, library, service or document-store connection is introduced.

Reuse existing shared record, register, form, tab, shell, permission and command-recovery components. Scope-source changes are visible and nonblocking for independent review of an exact submission; permissions and record-version checks still apply. Owner, recorder and submitter are excluded from review. Handover records an exact reviewed source and receiving obligation, without sending communication or replacing an accepted basis. Review and return share one form.

## Bounded adaptations and open questions

Use the shared compact phone header (reference, Back and More), with the form title in the content. Keep the current permission-aware department rail. Use native labelled start/end date-time inputs, the existing Site Activity workflow for follow-up, and explicit pagination. Register More/settings and bulk-selection behaviour remain unspecified; no bulk operation or personalised column persistence is invented. Original image upload retains the existing bounded synthetic store and adds validated static JPEG/WebP alongside PNG; no external storage connector. Observation recording retains the model's date precision instead of fabricating clock time.

Dean's open questions: define More/settings and any bulk actions; decide whether recorded observation time needs greater persisted precision and a governed unit catalogue; confirm photo limits for field use. Full-size History redesign and Conversations remain outside scope. See the [page contract](../design/development/pages/scope-cs-08.md) and [execution evidence](../testing/evidence/site-surveys-native/README.md) for exact frames, controls, visual deviations and check results. No automated check grants business acceptance or owner visual review.
