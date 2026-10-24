---
title: Portal home and access CP-01 design accepted
date: 2026-10-23
---

Dean accepted the Figma design for CP-01, portal home, organisation and site selection and access, the first Customer portal page, after three audit-and-polish passes: "I accept the Portal home & access CP-01 design with your recommendations, including D1–D19 and Q1–Q8. Lock it in." The [design decision](../decisions/portal-home-access-figma-design.md) (PPO-CP01-PORTAL-HOME-FIGMA-DEC) records departures D1–D19 and answers Q1–Q8:
- a portal shell separate from the staff shell, with one organisation and site shown at a time;
- Home cards that load and fail on their own;
- customer status words only from facts;
- safe recovery and access-changed states;
- neutral placeholders for D-022, D-024 and D-012;
- a staff "Propose portal access" amendment on the People record;
- an 80 px one-row phone header.

Q1 and Q2 give the recommended direction for D-022 and D-024 without deciding them. Twenty-eight icon-free captures with hashes are retained in [portal-home-access-design-r01](../reference/ui/customer-portal/portal-home-access-design-r01/README.md), and the design register page for `scope:CP-01` cites them. In Figma the page sits under a new "— Customer portal —" divider, and the capture copies sit on the Captures page from y = 400,000.

Checked:
- No Font Awesome instance or stray vector is left in the capture copies.
- No text colour differs from its bound variable, and no copy carries a prototype link.
- All three prototype flows were played in Figma Present mode.

Not done:
- The named Figma version waits for Dean's yes.
- `/portal` is not built.

No application code, route, migration, permission, grant, identity provider, invitation or parent ID changes.

<!-- decision-index -->
[Portal home and access design](../decisions/portal-home-access-figma-design.md) (PPO-CP01-PORTAL-HOME-FIGMA-DEC) records Dean's 23 October 2026 acceptance of the CP-01 design: a customer portal shell separate from the staff shell, an organisation and site context switched on purpose with nothing mixed across sites, Home cards that each show their own refresh and failure state, safe access recovery and access-changed states, and a staff proposal that grants portal access only through an applied, independently reviewed request. Building it is not decided.
