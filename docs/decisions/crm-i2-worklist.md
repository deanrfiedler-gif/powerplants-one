# CRM I2 — One scoped opportunity worklist

**State:** implementation under verification in issue [#43](https://github.com/deanrfiedler-gif/powerplants-one/issues/43). Parent PPO-009 / [#9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9). This decision uses the maintained stack; it reserves no migration, seed, ADR number or new capability.

## Basis and boundary

The [I1 external publication](https://github.com/deanrfiedler-gif/powerplants-one/issues/39#issuecomment-5557831957) is complete for merged PR #40, main `c3ac9b2ab9c09308f620a5b451a337eb75fe6390`, tree `163e4a9e7dcda9b067a67ed63299afd04d20e0b1`. This increment consumes the immutable I1 definition and its Open outcome. The accepted [UI specification r03](../standards/ui-style-specification.md) and [I2 guidance r02](../delivery/crm-i2-ui-guidance.md) supply visual direction. Their six stages, two sample pipelines and monetary data remain illustrative.

## Query and completeness

`GET /api/v1/crm/opportunities` remains the one worklist route. Both views render its same page without issuing a business command. It retains q/company_id/site_id/owner_id/stage_id/next_action and adds a closed sort choice: Reference (the existing stable UUID order), Title (case-folded C collation, UUID tie breaker), or Newest (creation time descending, UUID tie breaker). No sort expression comes from the client.

The query checks the existing opportunity visibility predicate, including independent organisation/site/person authority. The designated Activity projection uses all-target Activity visibility before exposing its ID, summary, due information or owner. Opportunity and action owners have separate fields. Search remains opportunity title/reference/organisation; it never searches hidden Activity content. No unrestricted records are sent to the browser.

Each first page fixes an as-of creation boundary and due-state time. A process-local HMAC cursor binds actor, workspace, every filter, sort, page size, boundary and keyset position. Its signed digest covers only the permitted matching projected records. Membership, visible Activity or record changes between pages return `409 WorklistChanged` and require a fresh read; newly created records outside the boundary await refresh. Current grants are evaluated on every request. Process restart invalidates cursors with 422. This is an explicitly bounded read window, not durable snapshot storage or a recovery grant.

The aggregate digest is internal. Each stage count is calculated only over the returned page. `window.count_basis=ReturnedPage`, `first_page`, `has_more` and `as_of` identify its meaning. Completeness is Complete only when one first page contains every matching result; terminal pages of a multi-page window remain Partial. Failure and denial return errors without stage counts. There are no commercial totals or account-wide counts.

`GET /api/v1/crm/worklist-options` supplies bounded Company/Site/Owner labels derived only from permitted opportunities. It uses read authority; creation selectors remain a separate existing contract. Filters cannot expand scope. Missing and hidden detail IDs retain I1's unavailable response.

Unique ordering and explicit limit semantics follow the [PostgreSQL 16 pagination guidance](https://www.postgresql.org/docs/16/queries-limit.html). Semantic headings, caption and row identity follow [W3C table guidance](https://www.w3.org/WAI/tutorials/tables/).

## Presentation and retained commands

Board groups the returned records by the two actual stage definitions; it provides continuous columns above 780px and direct retained stage selection at narrower widths. Grid has a semantic table inside a labelled, focusable scroll region with fixed heading and identity. View/search/filter/sort/page state lives in component memory only; accepted records remain server durable. No CRM cache, service worker, IndexedDB or localStorage preference is introduced.

Both views open `/crm/opportunities/{id}`. Creation, qualification, next action and Activity routes retain I1's owner/capability/version/evidence checks, deliberate conflict comparison and original-operation recovery. There is no Board movement command, drag/drop, PATCH, additional stage, reassociation, ownership transfer, bulk action or silent Activity-driven progression.

The shared shell uses the exact navy/green/white brand roles and untouched supplied logo bytes. Navy text replaces dark-green text aliases when green becomes a bright action surface. Existing navigation remains available behind an explicit phone Menu; identity controls have a compact disclosure only on this worklist. Broader styling consumers require the full baseline browser suite and original shared-screen captures. No icon/font package is added.

## Evidence and remaining scope

See the [I2 handover](../delivery/crm-i2-handover.md) for executed evidence and limitations. This document does not claim a passing test or merged delivery. P09's exact accepted suite and all I1 cases remain mandatory. Full AT-25 remains Planned and #9 remains open. Further relationship management and commercial progression need separately bounded work.
