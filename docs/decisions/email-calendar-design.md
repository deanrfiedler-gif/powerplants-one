# Email & Calendar design direction

**Revision:** r01 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler · **State:** User-authorised design and synthetic prototype; live policy/implementation proposed.

Dean requested Outlook email/calendar integration similar to his Pipedrive screenshot, then explicitly authorised the next bounded design and synthetic prototype. This covers desktop/mobile screens, record linking, privacy settings and preparation of a first Microsoft pilot. Repository publication is within the normal requested project workflow; company mailbox access, sending, consent changes and deployment are outside this increment.

The [design](../blueprints/email-calendar-integration.md) extends CRM-03/PAR-06 under PPO-009. Preserve the shared seven-domain platform and provider ownership: one Email area, authorised email tabs on relevant records, a combined source-labelled agenda and explicit internal follow-up. Link and share remain separate operations. Selected-message sharing does not grant access to the rest of a thread, future replies, additional targets or unselected attachments.

Microsoft Graph v1.0 is the proposed future provider adapter within ADR-0003/BP-02's retained stack. This design chooses no runtime library/version or new infrastructure. Alternatives considered: mailto/Outlook deep links support a narrow handoff but not synchronisation; an Outlook add-in is a possible later filing entry point; a managed sync broker would introduce supplier cost/data handling without a demonstrated need. Graph directly supplies the required Microsoft resource access, subject to actual tenant proof. Revisit for non-Exchange Online mailboxes or shared-mailbox requirements.

Use the supplied brand and maintained r08 desktop presentation, and the accepted mobile design mapping inspected in open PR #61. This separate documentation preview does not modify that PR or claim its publication. P11 on inspected main and P12 preparation retain their existing boundaries.

The [pilot](../delivery/email-calendar-microsoft-pilot.md) proposes one company-approved test mailbox, delegated read permissions, bounded history/window and owner-only live visibility. Its detailed sharing/free-busy model is exercised synthetically first. Current user authority enables design publication, not closure of D-025/D-020/D-012, full AT-25 or a corporate retention policy. Actual results and limitations are in the [handover](../delivery/email-calendar-handover.md).
