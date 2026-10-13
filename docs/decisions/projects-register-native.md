# Projects register from the Figma design

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: implementation requested 13 October 2026; application review and deployment remain separate.

Dean supplied the Projects page in the private PPO - Design Figma file and requested its implementation in the live application, including backend improvements where needed. The supplied Wrike Feature Audit (11 October 2026) is reference evidence, not an instruction to adopt all Wrike capabilities. Its preference for typed records on shared services agrees with the existing PPO architecture. The native project, schedule, Sales handover and closeout authorities remain intact.

## Scope and source

The stable entry is `route:/projects`, screen PJ01, PPO-012 / BP-06. Parent requirements PRJ-01, PRJ-02, PRJ-07 and PRJ-08 retain their identities. The r20 type is Register / worklist, supported by a record inspection window. The full project schedule, Programme, creation form and Acceptance & closeout retain their existing routes.

Read on 13 October: Figma page `209:46` (Projects accepted); desktop `209:47`; selection `209:238` with toolbar `209:260` and panel `209:301`; phone `209:457`; phone snapshot `209:617`; record panel `209:118`; notes `209:478`. The page's notes record Dean's earlier acceptance and the intended version name **Projects register — Pipedrive pattern, accepted**. This session does not independently confirm the saved named version. Current high-fidelity contexts and renders were inspected; the initially requested page ID returned no selection, so the actual child frames were read. The large selected frame required separate child reads.

The [measured source contract](../design/projects-register/figma-measurements.json) records geometry and semantics without licensed artwork or the private file link. Public icon-free captures for this page are not yet available in this branch. Original reference documents remain unchanged. The existing Brand logo and Font Awesome Kit names are the exact source assets identified by Figma; no Pro SVG bytes are committed. Unconfigured/offline builds retain the established local fallback glyphs under ADR-0050.

## Implementation decision

Reuse Next.js, React, PostgreSQL, `readRoute`, current project visibility, shared signed pagination, `SecondaryMenuFrame`, `RegisterTable`, `RegisterSortHeader`, Button/ButtonLink, WorklistChoice/WorklistMenu, the shell header slots and existing glyph service. This chooses no new technology, dependency or service. A new read endpoint, `/api/v1/projects/register`, is preferable to changing the older list contract used by Programme and global search. Loading every schedule into the browser would give incomplete counts and unnecessary requests; the new read computes authorised matching rows, counts and options in one database snapshot. No migration or grant is needed.

- Active is the default view. My projects means active projects coordinated by the current actor. Closed and All retain lifecycle distinctions. Needs attention applies to active projects.
- Next milestone is the earliest incomplete milestone by finish date, undated last, stable ID tie-break. Overdue means that date is strictly before the site's local date at the response observation time. No remaining milestone is distinct from an undated milestone.
- At risk counts non-milestone tasks explicitly marked AtRisk. It is not inferred project health. Task totals and phase summaries also exclude milestone markers.
- Target date sorts ascending with unknown dates last; other supported sorts retain deterministic ID ties. Filters/sort/view persist in the address; signed page tokens and selection are transient. Counts cover all authorised matches, while selection/export cover only displayed permitted rows. The rail badge counts all active authorised projects independently of filters.
- Inspection fetches the selected project's saved schedule, restricted Sales handovers and attributed history. Sales access stays independent. Closing or reopening remains in Acceptance & closeout; neither selection nor exports mutate business records.
- Phone rows use press-and-hold selection, with Shift+Space as a keyboard alternative and labelled bottom actions. Scrolling cancels a pending hold. Source notes adopted this interaction but did not draw it.

## Handovers and adaptations

Incoming records are native project creation or independently accepted Won-deal receiving. Outgoing links open the exact project's existing schedule or closeout context. Customer, site, coordinator and target remain fixed after creation in this increment. Existing immutable commands, schedule reasons, dependency warnings, baselines and original-operation recovery remain authoritative.

The desktop table adopts 40 px rows and headers, 44 px pinned end columns and the Figma column widths as a scoped variant of the shared register. The existing generic table retains its own dimensions elsewhere. A 240 px expanded primary rail is scoped to this register. Existing persisted rail preference is honoured; the design's expanded state can be selected through the normal toggle. The Projects phone bar adds Acceptance & closeout and uses accessible icons-only cells as drawn. The secondary menu retains the shared overlay behaviour below 1200 px. The phone record stacks the facts and activity/history with a fixed action footer. Long/unknown values remain readable through the snapshot and accessible names.

The source does not draw errors, loading, denied reads, empty results, long content, earlier history, column choices or mobile selection. These use established app patterns and remain explicit implementation adaptations. Snapshot Escape and previous/next preserve register context. Native creation and schedule forms are retained rather than replaced by an unverified Wrike workflow. No operational integration, customer communication, financial authority or broad Wrike feature parity is implied.

The existing global search alignment, company context, guide and development controls remain available. The register names `Projects / Project register` on desktop and `Projects` on phone, without a second hierarchy-menu trigger beside its own menu button. Those retained application controls are an explicit shell adaptation to the supplied drawing.

## Verification

See the [execution record](../testing/evidence/projects-register/README.md), [page contract](../design/development/pages/route-projects.md) and source-bound tests. Automated functional proof, visual comparison, owner acceptance, CI, merge and deployment are recorded separately. The guide remains Draft; no review fingerprint is promoted merely by editing these files.
