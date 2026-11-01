---
title: Scope IDs given to unscoped UI pages
date: 2026-11-01
---

Dean adopted a mapping for the pages the Figma audit found without a scope. The [decision record](../decisions/ui-scope-id-mapping.md) adds four identities to the design register (`scope:CR-06`, `scope:FI-01/time-review`, `scope:CX-02/settings` and `scope:ES-05/customer-page`) and links the Fertigation routes to `scope:ES-02` and the login and home routes to `system:shell`. Site assurance waits for Dean's answer to its Q1.

Each new identity has a draft design page and guide. This is register identity only: no route, application code, migration, permission or acceptance changes, and the three proposed addresses are not routes. The UI build sequence check passes with the new entries, the user guide contents list them, and one unit test now names `scope:CR-06` as the owner-added top-level identity.

<!-- decision-index -->
[Scope IDs for unscoped UI pages](../decisions/ui-scope-id-mapping.md) (PPO-UI-SCOPE-ID-MAPPING-DEC) maps unscoped pages to new or existing register identities.
