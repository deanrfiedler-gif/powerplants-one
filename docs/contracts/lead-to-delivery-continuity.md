# Lead-to-delivery continuity

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: proposed implementation contract; owner acceptance pending.

Authority: the user's 7 October 2026 instruction to proceed with completing the Leads/Deals journey, followed by the explicit repository-writing handover from Maintenance. Parent scope: CRM-01–CRM-08; AT-01, AT-02, AT-03, AT-25, AT-26 and AT-33. Existing manual Leads and CR-01–CR-05 scope IDs remain unchanged. This is a synthetic prototype contribution, not a production integration or customer commitment.

The default commercial journey starts with a manual lead. Direct qualified Deal and direct Service intake remain valid. Shared customer/contact/site records, native Activities, Estimating release/response/conversion, Projects, Service and Maintenance remain their respective authorities. There is no second quote, activity or delivery store.

## Delivery increments

1. Resolve customer context, preserve lead follow-up through conversion, and provide accountable lead ownership/correction.
2. Bind an explicitly accepted Sales estimating brief to its native estimating workspace without overwriting independently captured discovery or cost history.
3. Show exact quotation option/revision, issue, staff-recorded response and conversion facts in Deals; bind new commercial outcomes explicitly while preserving historical narrative outcomes.
4. Receive accepted Won handovers into explicitly created or linked native Project/Service records, with original-operation recovery.
5. Show source-derived progress, accountable next action, stale/returned/restricted states and retained outcomes across the journey.
6. Return reviewed delivery, Service and Maintenance/renewal needs to Sales using existing owned Activities and explicit Leads/Deals links.

Each increment is separately reviewable. None is complete merely because this contract exists. Existing ES-04–ES-07 and Maintenance code is reused; earlier claims that quotation issue/response did not exist were based on a stale local checkout and are superseded by the refreshed source audit.

## LC-11: resolving a site after lead follow-up

The original conversion contract remains unchanged when no source-activity review is supplied, including its payload hash and incompatible-context refusal. An additive review contains the exact ID and version of every original linked Activity, with a disposition of Carry or Retain and a reason for each Retain. Carry retains the Activity identity and adds the Deal link only when company, site and access context are compatible. Retain keeps every original row, owner, due date and source link unchanged; it is allowed only for an Activity whose site differs from the selected Deal site. Restricted or missing Activities block the entire conversion, rather than disappearing from its review.

Any Retain requires a newly created, dated next Activity owned by the lead owner on the destination Deal. Its description explicitly owns review of the retained source obligations; this does not complete or reassign them. The conversion audit retains all compared source facts, dispositions, reasons and the destination review Activity identity. Both the converted Lead and the Deal expose the retained source relationship for follow-through. A changed Activity version or membership invalidates the submitted review. The existing workspace transaction and original-operation receipt make the conversion, Deal creation, links, new Activity, evidence and receipt atomic.

Validation must cover unchanged legacy conversion, a site discovered after follow-up, incompatible source retention, stale and hidden source refusal, a missing owned/dated review action, exact original replay, concurrent duplicate conversion and a late failure rolling back all effects. Desktop/phone flows must expose the comparison and preserve uncertain commands for recovery.

## Evidence boundaries

Issued reference snapshots and historical payloads remain unchanged. No new technology is selected by this contract. Acceptance of a Sales handover, issue of a synthetic quotation, recording a response, recording Won and destination execution are distinct facts. MYOB remains the intended ERP authority; SharePoint and native CAD retain their roles. Owner/device/business acceptance, migration/cutover and deployment remain separate from code and synthetic checks.
