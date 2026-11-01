---
document_id: PPO-UI-SCOPE-ID-MAPPING-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Dean adopted the mapping on 1 November 2026; register identity only, with no route, code, migration, permission or acceptance change
source_commit: 89283a16027fa90fa988d31a47a4f53dd3d1e0b1
versioning: git
---

# Scope IDs for unscoped UI pages

## Decision

The Figma design file audit of 1 November 2026 found pages with no scope of their own. Claude proposed a mapping, and Dean said: "Adopt the mapping".

Most pages fit an existing scope, and five new identities are added. No existing scope ID, route key or parent requirement ID changes.

## New identities

| Page | Key | Registered address |
| --- | --- | --- |
| Leads and Lead record page | `scope:CR-06` | `/sales/leads`, which exists, with `/sales/leads/[id]` |
| Time & labour review | `scope:FI-01/time-review` | `/service/time`, proposed in the FI-01 design; no route exists |
| Workshop settings | `scope:CX-02/settings` | `/admin/settings/workshop`, proposed on that Figma page; no route exists |
| Customer quotation page | `scope:ES-05/customer-page` | `/quote/[token]`, the [indicative path](quote-view-tracking.md); no route exists |
| Site assurance | `scope:PJ-09/site-assurance` | `/projects/assurance`, proposed on that Figma page; no route exists |

`scope:CR-06` is the only new top-level identity. The other four follow the `scope:CX-02/kitting` form for a page within a scope.

A registered address is not a route. The four proposed addresses stay proposals until a build decision confirms them.

## Site assurance

Claude recommended keeping Site assurance as its own page rather than folding it into Inspections (Q1 on that Figma page), and Dean said: "Yes, keep it". The page stays a proposal awaiting his acceptance, and its other questions stay open. Claude has no evidence yet that Powerplants formally runs inspection and test plans this way, so that needs checking when the page is reviewed.

## Linked to existing identities

| Page | Identity | Effect |
| --- | --- | --- |
| Priva Fertigation routes | `scope:ES-02` | The three `/estimating/fertigation` routes and the scope now link to each other |
| Finance exceptions | `scope:FN-01`, `scope:FN-02` | No register change; this record names the mapping |
| Calling | `scope:CS-01`, `scope:CS-02`, `scope:CR-01` | No register change. The [calling design](calling-figma-design.md) adds no scope ID in stage 1; review this if stage 2 adds its own screens |

## Shared patterns

These set rules across pages, so they map to existing system entries and gain no scope ID.

| Page | Identity | Effect |
| --- | --- | --- |
| Create forms | `system:theme` | No register change |
| Phone register patterns | `system:shell` | No register change |
| System pages | `system:shell`, `route:/login`, `route:/` | `system:shell` now links to both routes |

## Figma

Git stays the authority. [ADR-0055](ADR-0055-figma-file-structure.md) keeps page names stable because repository records quote them, so these pages keep their names. The Scope identity field on the Leads, Lead record, Time & labour review, Workshop settings, Quotation page & customer views and Site assurance pages was updated on 1 November 2026, along with the File index rows for the accepted pages. Named versions saved earlier do not include these label changes.

## What this does not change

- Design acceptance, review status and the proposal status of any page.
- Any application route, code, migration, capability, grant or deployment.
- The issued register snapshots in `docs/reference/`.
