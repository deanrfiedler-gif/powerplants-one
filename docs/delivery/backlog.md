# Initial development backlog

These are bounded discovery and design work packages for Dean's private prototype. GitHub Issues carry live work status once created. The JSON register is the initial creation/traceability snapshot; update its content and this index when scope changes, rather than attempting automatic two-way status synchronisation.

P1 identifies first-release design dependencies. P2 identifies later domain detail or downstream delivery planning; it is not a promise of business urgency or delivery dates. Dependencies are completion dependencies, not a prohibition on useful preliminary discovery.

The foundation maps all 78 parent requirements to one or more work packages. These are planning epics, not 78 implementation commitments. Detailed child issues should be created when the relevant module specification is ready.

| ID | Work package | Priority | Specification | Dependencies | GitHub issue |
|---|---|---|---|---|---|
| PPO-001 | Confirm prototype objectives and first-release boundary | P1 | BP-01 | None | [#1](https://github.com/deanrfiedler-gif/powerplants-one/issues/1) |
| PPO-002 | Establish MYOB and service ownership evidence | P1 | BP-02/BP-07 | PPO-001 | [#2](https://github.com/deanrfiedler-gif/powerplants-one/issues/2) |
| PPO-003 | Specify customer, site, asset and history contracts | P1 | BP-02/BP-07 | PPO-001 | [#3](https://github.com/deanrfiedler-gif/powerplants-one/issues/3) |
| PPO-004 | Prepare BP-02 architecture options and recommendation | P1 | BP-02 | PPO-001, PPO-002, PPO-003, PPO-008 | [#4](https://github.com/deanrfiedler-gif/powerplants-one/issues/4) |
| PPO-005 | Prepare BP-07 planned-service workflow specification | P1 | BP-07 | PPO-001, PPO-002, PPO-003, PPO-006, PPO-007, PPO-008 | [#5](https://github.com/deanrfiedler-gif/powerplants-one/issues/5) |
| PPO-006 | Define the minimum Finance handoff and trusted account view | P1 | BP-09 | PPO-001, PPO-002 | [#6](https://github.com/deanrfiedler-gif/powerplants-one/issues/6) |
| PPO-007 | Specify controlled documents and first-release outputs | P1 | BP-02/BP-07 | PPO-001, PPO-003 | [#7](https://github.com/deanrfiedler-gif/powerplants-one/issues/7) |
| PPO-008 | Baseline permissions, offline scope and operational targets | P1 | BP-02/BP-07 | PPO-001 | [#8](https://github.com/deanrfiedler-gif/powerplants-one/issues/8) |
| PPO-009 | Complete account-specific CRM parity and BP-03 scope | P2 | [BP-03](../blueprints/BP-03-crm.md) | PPO-001 | [#9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9) |
| PPO-010 | Prepare CREMS rule evidence and BP-04 reconstruction scope | P2 | [BP-04](../blueprints/BP-04-estimating-quotation.md) | PPO-001 | [#10](https://github.com/deanrfiedler-gif/powerplants-one/issues/10) |
| PPO-011 | Define BP-05 engineering and technical-release scope | P2 | BP-05 | PPO-001 | [#11](https://github.com/deanrfiedler-gif/powerplants-one/issues/11) |
| PPO-012 | Define BP-06 project controls and Smartsheet transition | P2 | BP-06 | PPO-001, PPO-011 | [#12](https://github.com/deanrfiedler-gif/powerplants-one/issues/12) |
| PPO-013 | Define BP-08 material readiness and supply-chain interfaces | P2 | BP-08 | PPO-002, PPO-006 | [#13](https://github.com/deanrfiedler-gif/powerplants-one/issues/13) |
| PPO-014 | Prepare synthetic pilot scenarios and acceptance coverage | P1 | BP-02/BP-07 | PPO-003, PPO-005, PPO-006, PPO-007, PPO-008 | [#14](https://github.com/deanrfiedler-gif/powerplants-one/issues/14) |
| PPO-015 | Specify service agreements, recurrence and asset lifecycle | P2 | BP-07/BP-03 | PPO-003, PPO-006 | [#15](https://github.com/deanrfiedler-gif/powerplants-one/issues/15) |
| PPO-016 | Define prototype delivery, recovery and future operating handover | P2 | BP-02 | PPO-004, PPO-008, PPO-014 | [#16](https://github.com/deanrfiedler-gif/powerplants-one/issues/16) |

## Recommended working order

Start with PPO-001, then the authority/identity/Finance/document/permission discovery in PPO-002, PPO-003, PPO-006, PPO-007 and PPO-008. Use that evidence to complete PPO-004/PPO-005 and build the synthetic acceptance pack in PPO-014. CRM, estimating, Engineering, Projects and Supply Chain can receive bounded first-pass discovery as source material becomes available.

No issue is assigned to a colleague or given an invented due date. Dean remains prototype owner; departmental roles in the source documents remain proposed reviewers. Closing a discovery issue does not close every referenced parent requirement or record production approval.

See [current status](../STATUS.md), [the first-release brief](first-release.md), [requirements](../requirements/requirements.csv) and [the detailed creation register](initial-backlog.json).

## PP-01 design package

The [requested package](../prototype/README.md) supplies the selected scope, architecture, Service, data/API, Finance/documents and synthetic procedures. See the [design issue disposition](prototype-implementation-plan.md#6-design-issue-disposition), [current status](../STATUS.md) and live issues for actual implementation/publication. P01–P12 are implementation plan IDs, not additional issued GitHub numbers.

## PPO-009 CRM discovery contribution

The [CRM handover](crm-discovery-handover.md) records BP-03, all eighteen parity items, bounded live stage evidence, proposed integration/coexistence/permissions, screens, acceptance and the [I1 starter](crm-first-increment-starter.md). Account identity, full feature/history/licence/permission evidence and owner acceptance remain incomplete; issue #9 stays open. CRM design is parallel to P09 service implementation; it changes no P01–P12 dependency order. I1–I6 are local BP-03 sequence labels only. D-013/D-025/D-026 and AT-25 are not closed by documentation publication.

## PPO-010 estimating discovery contribution

[BP-04 r01](../blueprints/BP-04-estimating-quotation.md) and its [handover](estimating-discovery-handover.md) start authorised source assessment and design. CRE-01–CRE-26 are mapped to evidence/gaps; a synthetic preview, arithmetic examples and future acceptance procedures support review. Issue #10 remains open for configuration/policy validation and accepted examples. [E1–E6](estimating-implementation-plan.md) are proposed local increments, not new issued requirements or implementation authority.

## PPO-012 bounded discovery contribution

[BP-06](../blueprints/BP-06-projects-commercial-delivery.md) and its [handover](projects-discovery-handover.md) record the 7 September source assessment and J1 preparation. Issue #12 remains open; its broad PPO-011 dependency is retained for technical gates. J1 implementation requires a new invocation.



## Customer portal staged work

[Issue #50](https://github.com/deanrfiedler-gif/powerplants-one/issues/50) is the focused customer portal design contribution under D-027 and the existing shared/Service/Projects/document requirements. [Design](../blueprints/customer-portal-design.md), [CP1–CP5 plan](customer-portal-implementation-plan.md), [handover](customer-portal-handover.md). The initial PPO-001–PPO-016 creation snapshot and all 78 parent requirements remain unchanged. Runtime child issues are created only as their stage is ready; no P13 or eighth domain is introduced.
