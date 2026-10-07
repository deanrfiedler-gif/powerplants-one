# Lead customer resolution and accountable ownership

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 7 October 2026. Review: implementation decision under the authorised Leads/Deals programme; business and owner acceptance pending. Trace: CRM-01–CRM-03, CRM-08; AT-01, AT-02 and AT-25; manual Leads scope retained.

An enquiry can be captured before its customer, contact and site are known. The original capture remains historical evidence. Resolution therefore adds an immutable, typed companion to a new Lead event rather than rewriting captured context or Activity links. An explicit correction supersedes the earlier resolution; every earlier selection and reason remains retained. The current resolution is separately labelled and preselects conversion. Conversion must use that current selection and requires the existing qualification and next-action checks. Activity context remains the captured context until conversion, where LC-11 provides owned follow-through for different sites.

Customer, person, affiliation, Site and dated Site party creation reuse the existing native forms/commands. Search permitted records first. Each creation has its own original receipt and an explicit return to the Lead; a later linking failure does not undo or conceal a successfully created shared record. Contact creation and its dated customer affiliation are separate visible steps. No ERP account, duplicate merge, customer authority or invented date is implied.

A current active Lead owner with `crm.lead.edit` may explicitly transfer their own Lead to another eligible owner after comparing every linked Activity version and confirming the recipient can see the captured and resolved context and all source targets. This uses the existing Lead editing duty, not read access; the distinct Deal transfer capability is unchanged. It does not reassign Activities. The SQL guard permits only the owner and one version to change, with exact immutable transfer evidence. Converted Leads remain terminal.

Accepted-original recovery is actor-bound to the original receipt, accepted audit event and exact Lead event. A former owner can recover that original while their current capability and all-target visibility remain valid; they cannot issue a new mutation. Missing/changed sources and revoked permissions fail closed. Existing payload hashes and historical records are preserved.

Migration 0073 adds two immutable companion tables and broadens only the Lead event-kind CHECK and guarded owner transition. It changes no capability, seed, grant, user, business identity type or output. The reviewed hosted upgrade applies these empty tables and guards through the existing transaction and generic runtime table grants; it does not backfill or reinterpret old leads or receipts. Populated-upgrade and original recovery proof are required before delivery. No new technology is selected.
