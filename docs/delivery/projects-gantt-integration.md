---
document_id: PPO-012-GANTT-HO
revision: r02
date: 2026-09-10
status: Publication authorised; draft PR and pinned CI pending
owner: Dean Fiedler - prototype owner
---

# Projects Gantt integration handover

The [integration decision](../decisions/projects-gantt-integration.md) freezes the approved r10 source and defines the bounded schedule-first scope. Branch `feature/projects-gantt-r10-integration` starts at shared-shell PR #84 head `6e2951e49f41e2b980da6885357230ef310f8198`. The base is unmerged; do not describe this branch as a deployed app update.

## Publication status

Implementation commit: `c1727cc12443615c93f32225df3086cec89ba64a`. The working tree was clean after committing. The proposed destination is the verified public repository `deanrfiedler-gif/powerplants-one`, branch `feature/projects-gantt-r10-integration`, with a draft PR targeting `feature/desktop-shell-r05-integration` (#84).

Automatic approval review initially rejected the push because integration approval did not explicitly cover exporting application source to that public GitHub destination. No alternate publishing route was attempted. On 10 September, Dean explicitly authorised pushing this integration branch and opening a draft PR in his public Powerplants One repository. That approval resolves the publication hold. Publication and pinned CI results will be recorded on the draft PR; no successful database/HTTP/pinned-browser result, merge or hosted deployment is yet claimed.

## Implemented journey

Open Projects from the existing rail or Quick add. Search/select an existing permitted customer and site, choose an eligible coordinator and create a project. Its internal Schedule page provides Gantt/List views, independently resizable columns, a clipping divider, multi-year horizontal navigation, filtering, grouping and task/milestone details. Create/edit tasks with explicit reasons, existing internal/external owners and manual dates/dependencies. Accepted changes appear in the same saved schedule and immutable history.

Each schedule is a versioned aggregate. A task save updates the project version and task, predecessors, exact event snapshot, audit, operation receipt and outbox in one transaction. Current authority precedes receipt replay. Stale versions preserve the proposal and require explicit refreshed-version review. Unknown transport outcomes retain the original operation and freeze the submitted fields for an unchanged retry. SQL guards enforce scope/identity, evidence, dates, progress, owner relationships and cycle-free same-project predecessors.

The register and global search use current scoped projections. Detail, owners, history, writes and generic receipt lookup independently check current permissions. Read-only projection hides edit controls. Session changes unmount the page through the existing boundary. APIs use the existing loopback/hosted gateway and origin checks and return private/no-store responses.

The first implementation permits 1,000 schedule items per project and 50 predecessors per task. Queries for customer/site/owner selection return up to 50 candidates and an explicit refinement hint; registers/history are paged. Project metadata is fixed after creation in this slice. No task-delete or production import path is exposed.

## Validation record

Local tools: Node 24.20.0 and npm 11.19.0, isolated from the workspace's older defaults. Locked application dependencies were installed without modifying the package manifest/lock.

| Check | Result |
| --- | --- |
| ESLint and TypeScript | Passed on committed integration source |
| Unit suite | 48 passed, including five new schedule/validation cases |
| Next.js build | Passed; existing report-template filesystem tracing warning remains |
| Actual React component bundle | Built using existing app components/CSS and explicit synthetic API fixtures |
| Supplemental Chromium 152 component checks | Five passed: divider/individual-column geometry; separate long-timeline scrolling and per-view persistence; shell/toggle/padding at three desktop sizes and compact List; uncertain accepted-save retry; explicit stale-version review |
| Manual component screenshot inspection | Inspected desktop output; corrected shared form margins, left-aligned task/phase labels and zoomed-out heading density |
| Pinned Chromium 153 / Playwright 1.63.0 | Local download timed out/returned 502; required CI execution pending |
| PostgreSQL 16.15 | Local workspace maps only uid 0 and could not install/start the service; required CI execution pending |
| Real HTTP, database restart and persisted desktop/phone journeys | Added; CI execution pending |
| Foundation / prototype / naming | Passed; all 78 parents and issued source hashes retained |

The earlier standalone HTML browser policy block was not bypassed. The supplemental checks above exercise newly integrated React app components with synthetic API responses; they do not prove PostgreSQL, authentication or hosted behaviour. Chromium 152 is supplemental, not a substitute for the pinned 153 gate.

The dedicated `Projects Gantt assurance` workflow uses PostgreSQL 16.15 and pinned Node/npm/Chromium. It runs static checks, database scope/concurrency/evidence cases, original-operation verification across a PostgreSQL restart and fresh service process, actual React geometry, and real API/desktop/phone journeys. Existing application and CRM assurance remain required gates. Full Projects PA/AT procedures, screen-reader review, real-device acceptance and hosted sign-in/deployment are not claimed by these components.

## Applying after review

Integrate the #73 → #75 → #84 stack before this change, preserving those modules. Use the established application build and additive migration/seed runner on the chosen environment. Migration 0019 (following Leads 0018) and the explicit Project capabilities must be present before using the new routes. For hosted invited testers, use the existing bounded tester reconciliation operation to apply the new Company A capabilities with their existing expiry. This handover does not execute those environment changes.

Current project/task data is retained across migration/seed reruns; existing migrations are checksum protected. There is no destructive rollback script. If rollout is paused, keep the database and use a forward correction; do not drop accepted project history.

## Leads integration correction

The [combined integration decision](../decisions/leads-projects-integration.md) governs the 0018/0019 registry, upgrade compatibility and combined verification. Historical PR #90 validation above remains evidence for that earlier source, not the combined branch.
