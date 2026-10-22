# Capability catalogue

Stable entry: `route:/admin/access/capabilities`. Scope: AD-01. Owner: Dean Fiedler. Status: Draft; owner visual review pending.

## Purpose and page type

Read-only capability inspection using current Workspace admin.access.read authority with the working company cleared. Register / worklist and Record detail from r20. Search exact keys or their plain-English descriptions and filter domain. Keep capabilities with zero grants visible. Distinguish current from recorded counts and explicitly say that these are grants, not unique people. The catalogue contains the server contract, not proposed role bundles.

## Desktop

Accepted design: the [Users and access design decision](../../../decisions/users-and-access-figma-design.md) of 19 October 2026 draws the catalogue as a grid of key, current, recorded, label, domain, scheduled, expired, scopes in use, whether the capability can be requested and a note, sorted by current grants, with Find a capability and a Domain filter. Counts are grants, not people. Capture 05 in [design r01](../../../reference/ui/access-review/users-and-access-design-r01/README.md).

Reuse the application shell, PageHeader, Field/SelectField, Button, ReadState, Status and Stamp. At 1440 × 960 and 1024 × 768 use the existing record-grid/cards; wrap long keys. Keep company ERP keys and site numbers next to names. Retain a visible route back to the catalogue or people directory. The retained AD-01 design combines capabilities and proposed roles/teams in a work queue with a persistent inspector; separate native routes/cards are a proposed adaptation, not an accepted replacement.

## Mobile

Accepted design: not drawn on phone.

At 390 × 844 and 320 CSS px stack cards and labelled fields. No permission matrix or page-wide horizontal overflow. Preserve every scope/date fact, empty state and navigation control. Long capability keys wrap, key-first company text remains readable and shared focus/target styles apply. Check keyboard order, 200% zoom and device behaviour separately.

## States and recovery

Loading hides prior records. Read failure offers Retry; permission loss or selected working company hides prior details. Empty filters are distinct from unavailable data and from an unassigned capability. Hosted names/provider identifiers remain masked; email.connect is clearly hosted-demo-only. Current grants do not imply authentication, record access, assignments or domain approval. Refresh rechecks current authority. No write command exists.

## Sources and handovers

Existing [working AD-01 HTML](../../access-review/access-review.html), capabilities view; original [issued r01](../../../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01.html). [Native decision](../../../decisions/access-review-native.md). Incoming: canonical capability keys and real workspace grant rows. Outgoing: person inspection with selected capability/company/site, followed by an explicit fresh eligibility check. No role/team membership is inferred.

## Evidence and open review

Accepted Figma design: [Users and access design r01 captures](../../../reference/ui/access-review/users-and-access-design-r01/README.md) (thirteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/users-and-access-figma-design.md). The Capability grants holder view is not drawn (Q5). Building it is not decided; the native page remains the built page.

[Execution ledger](../../../testing/evidence/access-capabilities/README.md) records 16 database checks, 15 native browser checks and twelve source-bound native/reference captures at 1440/390/320 px, with explicit observed adaptations. Accepted native mockup images are missing. Owner visual review, physical-device, zoom and screen-reader acceptance remain pending. No review fingerprint is assigned by implementation and no deployment is claimed.


## Local review API boundary

The [attestation contract](../../../decisions/access-review-attestations.md) introduces `admin.access.review.attest` (137 current capability keys) and immutable local single-grant Keep records. The broad retained `admin.access.review` remains proposed campaign authority; it is not inferred from a lead label. No native attestation form or new page/layout is delivered. Existing roster counts/person links are still read-only. Shared component implementations, fixtures and consumer bindings are unchanged. Native review images are missing; existing historical captures and pending owner review remain separate. API/upgrade evidence: [execution ledger](../../../testing/evidence/access-review-attestations/README.md).

## PJ-06 work review contract

The canonical capability union now has 157 keys, including `project.specialist.work.review` labelled “Review exact specialist work evidence”. This is the minimal existing-client catalogue label required to expose the new backend duty accurately. It is default denied, with no seed grant; brief receiving and Supply receiving do not confer it. No page layout, component or visual acceptance changes. Existing pending design review remains pending. [Contract](../../../contracts/project-specialist-work-evidence.md).

## Conversations T1b capabilities

The canonical capability union now has 159 keys, including `conversation.read` ("Read conversation threads on deals and projects") and `conversation.post` ("Start and post in conversation threads"), in a new Conversations family. They are proposed names from PPO-CONV-T1-SCOPE; seed 108 maps them to every local synthetic profile that already holds `crm.opportunity.read` or `project.read`, in the same scope, and hosted testers receive neither. This is the minimal existing-client catalogue label and count change required to expose the backend duty accurately. No page layout, component or visual acceptance changes; the catalogue and workspace counts read 159. See the [contract](../../../contracts/conversations-t1b.md).

## D-025 S2 customer message duties

The canonical capability union now has 161 keys, including `customer_message.send` ("Confirm and send prepared customer messages as the named sender") and `customer_message.switch` ("Switch a customer message class on or off") in a new Customer messages family. These are the minimal existing-client catalogue labels required to expose the new backend duties accurately. Both are default denied, with no seed grant. No page layout, component or visual acceptance changes. Existing pending design review remains pending. [Decision](../../../decisions/customer-communications-core-s2.md) and [contract](../../../contracts/customer-communications.md).

## Conversations T2b assistant duty

The canonical capability union now has 162 keys, including `conversation.agent.ask` ("Ask Carl, the AI assistant, in conversation threads"). Seed 110 copies each active local synthetic profile's live `conversation.post` grant, in the same scope and validity. Hosted testers receive no ask duty. Carl also requires the local, off-by-default assistant switch. This change supplies the catalogue label and contract count; the T2c answer UI remains separate. Existing visual review status is unchanged. [Scope](../../../decisions/conversations-t2-scope.md) and [design](../../../decisions/conversations-t2b-design.md).
