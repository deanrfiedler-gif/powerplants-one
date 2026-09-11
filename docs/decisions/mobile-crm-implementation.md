# Mobile CRM implementation

**Revision:** r01 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler · **Parent:** PPO-009 / issue #9.

Dean approved the r05.1 mobile direction and explicitly authorised implementation in the working app, one complete CRM journey first, followed by shared presentation across implemented modules. This applies the approved visual language to current persisted contracts. It supersedes r08's card owner emphasis and mobile navigation presentation; desktop r08 remains the layout baseline. Estimating primary actions adopt the shared navy/white treatment, superseding their earlier green fill; green remains an accent.

| Approved interaction | Application mapping | Authority and persistence |
| --- | --- | --- |
| Header, bottom navigation and More | ProductHeader/ProductNavigation; native modal menu; existing local identity control | Existing module routes and synthetic identity; unavailable modules remain Planned |
| Contact-led opportunity cards | crm-worklist, worklist projection | Primary person is already a persisted relationship and part of opportunity visibility; opportunity owner stays in Details, List and filters |
| Searchable organisation/site/contact | CrmPicker/LookupField; crm/options | Debounced, bounded server matches, explicit selection; edits clear dependent IDs. Current grants filter every request |
| Timeline / Details / Commercial | RecordTabs/RecordPanel; OpportunityContent | Drafts remain mounted across tabs. Current version, command receipt and reconciliation behaviour remains authoritative |
| Requirements and scope | Existing need_summary and qualification_note | Uses the current customer-need/qualification command. Estimate inclusions/exclusions remain on the existing estimate contract |
| Complete and plan follow-up | ActivityEditor, existing complete command and next-action command | Completion and new follow-up remain separate saves. Completed history remains intact; uncertain commands retain their existing operation IDs |
| Local due date and time | LocalDateTimeField, scheduling/time | Brisbane civil time converts to the exact UTC instant using the existing timezone helper; existing validation rejects invalid dates |
| Organisation Details overview / Sites hierarchy | customerContext, context-screens | Counts and children derive from permitted linked sites/facilities, never a second copied site store |
| Commercial links | New opportunity commercial read, existing estimating reads | Requires estimating.read plus current CRM and relationship visibility; canonical estimate and exact draft quote revisions |
| Cross-module styling | Shared status/header/form/mobile CSS; estimating PageHeader | Existing Organisation/Sites, Estimating and Service routes receive shared presentation. Projects has no implemented runtime to extend |

## Preserved domain boundaries

The current CRM remains Enquiry → Qualified with Open outcome, immutable opportunity ownership, and owned typed Activities. Money, closing dates, extra stages, new handover commands and facility taxonomy are not added by a visual mapping. Contact, opportunity owner and Activity owner remain distinct. No proposed or draft output is labelled issued, accepted or completed by styling.

Commercial navigation adds only a permission-checked read projection over existing E1 records. There is no database migration, new role/grant, dependency, source integration, deployment or production transaction. Existing MYOB, SharePoint and CAD boundaries remain. The separate P11 and private demo branches are preserved.

Facility type and horticultural conditional fields require the shared Facility contract increment: current persisted Facilities contain name, site and optional parent, not the full approved design's attributes. Projects likewise requires its J1 runtime rather than a decorative destination. These limitations are explicit in the handover.

## Traceability and review

CRM-01/02/03/04/08, PAR-03/04/05/15 and CA-01–07/10/13 inform this presentation increment; these references do not close full AT-25 or the parent requirements. Current server guards and E1 evidence remain the business contract. The [handover](../delivery/mobile-crm-handover.md) records actual verification and the remaining bounded implementation sequence.
