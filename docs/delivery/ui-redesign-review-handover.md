# Shared UI redesign review

**Revision:** r01 · **Prepared:** 7 September 2026 · **Owner:** Dean Fiedler · **State:** Proposed design for review; no application implementation or operational transition.

## Requested outcome

Dean requested a substantially closer Pipedrive-style interface across PPO, supplied nine Pipedrive screenshots and nine current PPO screenshots, and then authorised the next concrete deliverable: a clickable comparison with redesigned navigation, populated CRM Board/List and a Service Planner using fictional records.

The [repository review source](../blueprints/crm-ui-redesign-review.html) opens from a checkout and uses the existing repository font/logo paths. The self-contained personal review copy is supplied separately in the conversation. Its Current screenshot / Proposed control switches between the supplied PPO capture and the interactive design for each screen. The repository edition identifies omitted source screenshots explicitly. Review notes explain the scope and comparison limits. This is a local design artifact; no hosting is enabled.

## Proposed design

- Compact navy navigation for the seven domains, with an intact supplied logo and clear labels. CRM and Service navigation work; the remaining entries are visibly outside this preview.
- A shared header holds page identity, contextual search, fictional actor and a concise environment label.
- Board/List share search, owner/action filters, sorting, counts and canonical record detail. Unknown amounts and due dates remain explicit; Activity ownership remains distinct from opportunity ownership.
- The sample contains 18 fictional opportunities across the six reference stages from the earlier design direction. Values are fictional AUD excluding GST. These are unweighted illustrative totals, not revenue or quotation calculations.
- Service Planner contains ten fictional appointments for 7-11 September 2026, resource filtering, Day/Week, date navigation and appointment details. Confirmed, Proposed and Change requested remain distinct. Selecting an appointment performs no scheduling command.
- Temporary creation includes validation and preserves entered values. Everything resets on reload; no server, external request or browser storage is used.

## Boundaries and continuity

Inspected main: `ebbcac5c9e210e7742bb619da3c8518592d19f31`. AGENTS, README, STATUS, shared UI r03 and the existing CRM design/brand handovers were read. This proposal does not supersede the accepted application style contract until reviewed. It adds no domain authority, migration, production integration, live data extraction, permissions change or new implementation increment. All 78 parent requirements and P01-P12 order remain unchanged.

The current application retains Enquiry -> Qualified and Open outcome. The six-stage reference and fictional money fields are visual design examples only. Closing does not imply Won, customer acceptance or an ERP order. The local new-record form is not a proposed production command contract.

The uploaded CRM screenshots show zero visible records for SYN Coordinator. The planner screenshot uses a different week from the proposed sample. Thus comparison is visual and not a like-for-like record, access or performance assessment. The Finance error was observed only in a supplied screenshot and is not diagnosed or changed here.

The personal review copy embeds the supplied logo and three PPO screenshots unchanged. Automatic approval review rejected uploading that embedded package to GitHub because it contains private screenshot and branding bytes. The materially safer repository edition contains no embedded image or font bytes and no source screenshots; it references the already-present logo/font assets. Both editions use identical interaction script and layout CSS; only the font source and image/data payloads differ. Operational Pipedrive screenshots, customer records and the full brand PDF are excluded. The Roboto OFL notice is retained.

## Verification

Local assembly verifies the original logo and font hashes, embeds the three current PPO screenshots and validates JavaScript syntax. Local browser installation timed out; no local rendered UI pass is claimed from those checks.

The added standalone browser check runs through the existing pinned CRM design workflow and preserves its prior checks. It verifies Board/List equivalence, filters/search, detail ownership, keyboard close/focus return, temporary form validation/reset, screenshot comparison, planner date/resource/day/week behaviour, no external requests and desktop/phone fit. It retains original captures and source/hash evidence under `verification-evidence/crm-design/ui-redesign-review/`. Initial run 34103691239 passed all 51 standalone checks on source head 4a6d2a0b490420a383af788bd21d44b431d80301, with eleven captures. Visual inspection then found squeezed/overlapping phone planner controls despite the outer-overflow checks. These were corrected with explicit grid placement, readable resource selection, compact mobile sorting and additional control-overlap checks. Final run results and image inspection are recorded in draft PR #58.

This is UI design verification, not application regression acceptance, account parity or production readiness. Existing repository workflows remain authoritative for their own results.

## Next bounded step

Review the shared layout and information density in this artifact. Once the visual direction is accepted, prepare a focused application change for the shared navigation/header and current CRM Board/List, preserving existing server permissions, commands and workflow scope. Planner and the remaining modules can adopt the same components in bounded follow-ons. Live Pipedrive assessment/import remains a separate task.
