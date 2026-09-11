# Powerplants One CRM feature report
Pipedrive reference and recommended application scope
Powerplants Australia | Revision r02 | 9 September 2026

Powerplants One should provide a dependable daily workspace for customer relationships, manually entered leads, owned opportunities and follow-up activities. The immediate value is knowing who the customer is, what they need, who is responsible, what has happened and what should happen next.

This revision turns the Pipedrive feature review into a practical reference for PPO design. It retains the relevant product capabilities and expands the recommended behaviour for a horticultural equipment and project business. The priority is a coherent sales journey with useful customer history, consistent desktop and mobile views, and clear handovers to the other PPO modules.

## Scope of this revision
As requested, lead capture and prospecting, proposals and electronic signatures, marketing, and subscription limits are deferred. Their detailed feature sections, add-on comparisons and plan-capacity tables have been removed. Manual lead entry, qualification, individual customer communication and relationship follow-up remain within scope.

CRM can retain a link to an estimate and its status. Generating customer proposals and collecting electronic signatures are outside this revision’s CRM scope. This report does not redefine the separate Estimating and Quoting workstream.

## Main recommendation
Develop the essential customer, lead, opportunity, activity and access behaviour first. Add communication integrations and management reporting around that foundation. Introduce selected automation and AI after the underlying work can be completed reliably by a user.

The expanded recommendations are design proposals, except where this report identifies an existing user direction. Implementation status needs a separate check against the current PPO application.

## Evidence and interpretation
The Pipedrive descriptions draw on the official sources cited beside them and the research completed for revision r01. The principal customer, lead, activity and visibility guides were checked again for this revision. PPO recommendations are explicitly distinguished from those descriptions. Vendor pricing and subscription packaging are intentionally outside scope.

---
# Contents
1  Scope and recommended priorities
2  Customer records and shared context
3  Manual leads and qualification
4  Opportunities and pipeline management
5  Desktop views and daily usability
6  Activities ownership and handovers
7  Customer history and communication
8  Products values and estimating links
9  Reporting and forecasting
10  Mobile CRM and calling
11  Data quality migration and integrations
12  Permissions security and change history
13  Automation and repeatable follow up
14  AI assistance and meeting information
15  Handover to Projects and Service
16  Delivery sequence and acceptance examples

## How to use the report
Each feature section explains the relevant Pipedrive pattern, recommends its application in PPO and identifies an outcome to demonstrate. The recommendations focus on observable behaviour so that a designer, developer and business user can assess the same result.

“Essential” identifies the capability needed for a usable CRM foundation. “Next” identifies a useful extension once the foundation works. “Later” identifies an optional improvement with additional dependencies. These are priorities for the feature set; they do not imply that already delivered PPO work must be restarted.

Pipedrive uses “deal”. This report generally uses “opportunity” for the equivalent PPO sales record. Keep the application’s approved naming consistent across screens, reports and links to other modules.

---
# 1 Scope and recommended priorities
## Start with the complete daily journey
A salesperson should be able to find a customer, record an enquiry, qualify it, maintain an opportunity, complete an activity and leave the next action visible. Another permitted colleague should be able to understand the history and take over responsibility without reconstructing events from separate messages.

The feature priorities below are recommended for the current PPO scope. They deliberately give customer identity, ownership and usability the same importance as pipeline appearance.

| Priority | Capability group | Practical outcome |
| --- | --- | --- |
| Essential | Customers and manual leads | Enquiries have identifiable customer context and an owner |
| Essential | Opportunities and pipeline | Progress and sales outcomes are recorded consistently |
| Essential | Activities and handovers | Every next action has clear responsibility |
| Essential | Desktop mobile and access | Permitted users can complete the same core journey |
| Next | Email and calendar integration | Customer communication and appointments remain connected |
| Next | Reporting and module links | Managers see reliable measures and delivery handovers |
| Later | Automation scores and AI | Selected repeated work becomes easier to complete |

## What is deferred
Website forms, chatbots, live website chat, prospect databases, visitor identification and external contact enrichment are outside the present scope. So are proposal generation, signature collection, bulk marketing campaigns, marketing subscription management and vendor subscription comparisons.

Ordinary CRM classification remains useful: customer type, region, product interest and relationship owner help salespeople organise work. These fields do not require a marketing module.

## Keep the foundation proportionate
Begin with one sales pipeline unless distinct business processes justify more. Use a small set of useful fields and a few well-defined worklists. Add configuration when repeated operating needs demonstrate its value. A general workflow builder, arbitrary dashboard designer and advanced scoring engine can wait.

## Outcome to demonstrate
Using synthetic data, complete one enquiry-to-opportunity journey, including an ownership handover and a scheduled follow-up. Confirm that the record remains consistent after navigation and reload on both desktop and mobile.

---
# 2 Customer records and shared context
## Pipedrive reference
Pipedrive distinguishes people from organisations, links contacts to sales records and keeps relationship context on their detail pages. An organisation can have several people and several opportunities. Labels support classification, while configurable fields capture structured business information. [Contact records](https://support.pipedrive.com/en/article/contacts-people-and-organizations) [Custom fields](https://support.pipedrive.com/en/article/custom-fields)

Its contacts timeline brings together interactions and supports follow-up frequency. Notes, files and colleague mentions add context around the record. [Contacts timeline](https://support.pipedrive.com/en/article/contacts-timeline) [Mentions and comments](https://support.pipedrive.com/en/article/mentions-and-comments-beta)

## Recommended PPO record structure
Use a shared organisation record across CRM, Estimating, Projects and Service. A customer may have several sites and several contacts with different responsibilities. Keep the legal or billing organisation distinguishable from the nursery, greenhouse or other location where work occurs.

| Record | Information to retain | Relationship |
| --- | --- | --- |
| Organisation | Name, customer reference, owner and category | Customer account across PPO |
| Person | Name, role, email, phone and preferences | Associated organisation and relevant sites |
| Site | Site name, address and access context | Physical location for sales and delivery |
| Equipment | System type, identifiers and installed context | Linked site and service history |
| Opportunity | Requirement, owner, progress and next action | Particular sales requirement |

Equipment data should be linked when known. A salesperson must be able to record an early enquiry without first completing an asset register. Equally, a second opportunity for the same customer should reuse the existing customer identity.

## Fields and data quality
Essential fields should support an immediate decision or handover. Candidate fields include relationship owner, region, customer category and relevant product family. Use controlled choices where consistent filtering matters and free text for the customer’s requirement. Allow “unknown” where that is an honest state; prevent it from being mistaken for a confirmed value.

A modest shared field set is preferable initially. Add configurable fields next, with descriptions and clear ownership. Retire a field without silently discarding its historical values. Contact corrections and duplicate resolution should update related views consistently.

## Outcome to demonstrate
Create two opportunities at different sites for one organisation. Confirm that customer history is shared, site context stays distinct and a contact correction appears everywhere that contact is used.

---
# 3 Manual leads and qualification
## Pipedrive reference
Leads Inbox provides a dedicated list for enquiries that are not ready for a sales pipeline. Users can enter leads, link customer context, assign an owner, use labels and filters, add notes and activities, and convert a qualified lead to a deal. Archiving keeps inactive leads outside the working list. Pipedrive retains linked customer, note and file context through conversion. [Leads Inbox](https://support.pipedrive.com/en/article/leads-inbox)

Required fields and configured scores provide further guidance, but their behaviour needs careful interpretation. Pipedrive’s required-field rules have documented bypass routes, while its Scores guide describes deal scoring. [Required fields](https://support.pipedrive.com/en/article/required-fields) [Scores](https://support.pipedrive.com/en/article/scores)

## Recommended manual lead workflow
Retain a separate Leads page for phone enquiries, existing-customer requests, referrals and information entered by the sales team. Suggested minimum information is a short title, identifiable person or organisation, owner, received date and a brief statement of need. Site and product family can be added when known.

Use a compact detail view for the requirement, customer context, notes and next activity. Keep the existing direction for the lead detail presentation. The initial form should collect enough to create a useful record, with further qualification performed in the detail view.

## Qualification appropriate to Powerplants
Record what the customer wants to achieve, the site or operating context, relevant existing equipment, the desired timing and who will make the decision. Capture a budget indication only where known. Technical feasibility or supplier information may need an assigned follow-up before the opportunity progresses.

Start with a clear qualification outcome and explanatory note. Add configurable scoring later only if it improves prioritisation beyond owner, urgency, next action and qualification status. Do not block ordinary early enquiries because detailed engineering information is unavailable.

## Conversion and inactive leads
Conversion should preserve the lead identifier as a historical reference, carry customer context and history forward, and establish the opportunity owner and first stage. Present the treatment of unfinished activities clearly. A second conversion attempt should return the existing opportunity instead of creating a duplicate.

Use a reason and review date for a lead placed on hold. Keep disqualified and archived records findable through appropriate views. Deletion should be limited to authorised correction or retention processes.

## Outcome to demonstrate
Enter a lead, qualify it, schedule a call and convert it. Confirm that the call, notes, customer links and original lead reference remain accessible and conversion cannot create a second opportunity by mistake.

---
# 4 Opportunities and pipeline management
## Pipedrive reference
Pipedrive provides configurable pipelines and stages, deal values, expected close dates, owner assignment and won or lost outcomes. Stage probabilities support forecasting, with a deal-specific probability taking precedence where configured. Lost reasons help analyse unsuccessful sales. [Pipeline configuration](https://support.pipedrive.com/en/article/how-can-i-customize-my-pipeline-stages) [Lost reasons](https://support.pipedrive.com/en/article/lost-reasons)

Its rotting indicator measures inactivity since the last qualifying update. A future activity does not necessarily prevent a deal becoming rotten. Activity completion, notes and some email operations can reset the timer. [Rotting behaviour](https://support.pipedrive.com/en/article/the-rotting-feature)

## Recommended opportunity behaviour
Maintain one canonical opportunity containing the customer requirement, linked organisation and site, owner, stage, value basis, expected close date, qualification history and next activity. Use the same record in Board, Grid, search results and customer history.

Stage names should describe the agreed sales process. Define the evidence needed to enter each stage and keep that definition visible when useful. Dragging a card and changing a stage in the detail view must apply the same rules. If information is missing, explain the requirement and retain the current stage until the change succeeds.

## Separate the action indicators
| Indicator | Meaning in PPO | Useful response |
| --- | --- | --- |
| No next activity | No unfinished future action is recorded | Schedule or explain the next step |
| Overdue activity | An unfinished action has passed its due time | Complete, reschedule or reassign it |
| Stale opportunity | No meaningful progress within the agreed period | Review progress and customer contact |
| Long time in stage | Opportunity has remained in one stage too long | Review the obstacle to progression |

The existing caution icon and bottom colour strip can present these signals compactly. The explanation must identify the actual condition. Define which changes count as meaningful progress so that a cosmetic edit does not conceal inactivity. The familiar “Schedule an activity” action can remain available when appropriate.

## Closure and reopening
Record won or lost date, responsible user and supporting outcome information. Use a short controlled list of lost reasons plus a note. Reopening should preserve the earlier outcome and record why the opportunity became active again. Archiving should change its working-list visibility while preserving historical reporting.

## Outcome to demonstrate
Move an opportunity through supported stages, attempt an incomplete transition, close and reopen it, and confirm that history, indicators and reports remain consistent.

---
# 5 Desktop views and daily usability
## Pipedrive reference
Pipedrive combines a pipeline board with configurable cards, sortable lists, inline editing and bulk changes. Saved filters use combinations of ALL and ANY conditions and can be private or shared. Hovercards and detail views help users move between a summary and the related record. [Deal cards](https://support.pipedrive.com/en/article/deal-card-customization-sorting) [List view](https://support.pipedrive.com/en/article/list-view) [Filtering](https://support.pipedrive.com/en/article/filtering)

## Apply the agreed PPO visual direction
Use the established Pipedrive-inspired PPO layout with the Powerplants palette and Roboto typography. Retain compact, uniform opportunity cards with the opportunity name, organisation, stage, value including cents, close date including year, owner avatar and activity owner.

Owner icons should have accessible labels and explanatory hover text. Use a text description alongside the meaning of the caution indicator; colour alone cannot explain urgency. Keep the selected Board or Grid control visually clear in navy.

## Keep Board and Grid consistent
Board and Grid should display the same permitted opportunities under the same search and filters. Preserve sorting where its meaning is valid for both views. Switching view, opening a detail record and returning should retain the working context, including search, filter and scroll position where practical.

Use one vertical scroll area for the board. At the agreed desktop viewport, aim to show the configured stage columns at normal zoom without making cards unreadable. Smaller windows need a deliberate fallback, such as horizontal board scrolling or Grid; they should not shrink essential information indefinitely.

## Worklists that answer daily questions
Provide a small initial set: My opportunities, My overdue activities, Opportunities without a next activity and Opportunities expected to close soon. Team views should use the same definitions. Add named saved views after the underlying filtering is dependable; avoid separate filter implementations on each screen.

Inline and bulk editing should be restricted to suitable fields. Before a bulk owner or stage change, identify the selected records and resulting action. Report partial failures explicitly and leave unsuccessful records unchanged.

## Interaction quality
Provide visible loading, empty, no-results and save-failure states. Keep entered values when a save fails. Keyboard focus should move predictably into a dialog and return to the initiating control when it closes. A successful save should update the board and detail view without requiring a manual page refresh.

## Outcome to demonstrate
Filter a worklist, switch between Board and Grid, edit an opportunity, return and reload. Confirm the same record set, persistent view state and clear behaviour when a save fails.

---
# 6 Activities ownership and handovers
## Pipedrive reference
Activities connect calls, meetings and other tasks with contacts, leads, deals and projects. Users can schedule work, assign responsibility, record details and mark completion. Calendar synchronisation and meeting scheduling help coordinate appointments. [Activities](https://support.pipedrive.com/en/article/activities) [Calendar sync](https://support.pipedrive.com/en/article/calendar-sync)

Pipedrive also supports rule-based ownership assignment and configurable permissions for owner changes. Those capabilities provide useful reference patterns for team responsibility. [Automatic assignment](https://support.pipedrive.com/en/article/automatic-assignment) [Permission sets](https://support.pipedrive.com/en/article/permission-sets)

## Essential activity information
An activity needs a type, clear subject, responsible user, related record, due date or appointment time, and completion state. Add location and attendees where relevant. Distinguish a timed meeting from an action due on a particular day so that an arbitrary midnight time does not create misleading overdue alerts.

Useful initial types include call, meeting, site visit, technical clarification, supplier follow-up and internal review. Completing an activity should capture the outcome where needed and offer the next action. A cancellation should preserve the reason and remain distinguishable from successful completion.

## Opportunity owner and activity owner
The opportunity owner is accountable for the sale. The activity owner performs a particular action. A salesperson may retain the opportunity while assigning technical clarification to an engineer. Show both roles and avoid silently transferring one when the other changes.

For an opportunity handover, display the new owner and list unfinished activities. Allow authorised reassignment of selected activities or retention with their current owners. Preserve the previous owner, receiving owner, time and reason. Prevent assignment to an ineligible or inactive user and show why the transfer cannot proceed.

## Calendars and notifications
Begin with a reliable internal activity list and calendar. Add Outlook integration with a clear decision about which fields synchronise and in which direction. Show connection health and handle rescheduling and cancellation consistently. CRM appointments should not independently allocate technician capacity that belongs to Service planning.

Notify users of new assignments, changed due dates and overdue work without creating repeated alerts for the same unchanged condition. A useful next step is a concise personal work summary with direct links to the affected records.

## Outcome to demonstrate
Assign technical follow-up to a second user, transfer the opportunity to a third, complete the activity and schedule another. Confirm that responsibility, due dates and history are clear throughout.

---
# 7 Customer history and communication
## Pipedrive reference
Pipedrive links email conversations to customer and sales records through mailbox synchronisation or Smart Bcc. It supports templates, signatures, scheduled sending, tracking and shared inbox workflows. Email visibility and record access determine how colleagues see communication. [Email sync](https://support.pipedrive.com/en/article/email-sync) [Smart Bcc](https://support.pipedrive.com/en/article/smart-email-bcc) [Team Inbox](https://support.pipedrive.com/en/article/team-inbox)

Open and link tracking provide engagement signals, with technical limitations. An opened message is not a confirmed customer decision. [Email tracking](https://support.pipedrive.com/en/article/email-tracking)

## Essential customer history
Bring completed activities, notes, ownership changes, qualification updates and important record changes into a dated history. Allow filtering by event type. Distinguish when something occurred from when it was entered, and display the author or source. Pin useful context without changing its original date.

Store an ordinary note with its author and time. Record later corrections so that a user can understand what changed. Attach documents or retain stable links to the appropriate SharePoint location, with a useful filename, description and access behaviour. A removed attachment should leave understandable history where appropriate.

## Individual customer communication
Retain one-to-one sales correspondence within scope. Begin with manual communication notes and links to the original message when available. Add Outlook email linking next, with user control over the customer and opportunity association. A message relating to two projects at the same organisation must not be silently attached to every opportunity.

Make the distinction between private mailbox content and shared customer correspondence visible before sharing. A shared enquiry mailbox can follow once routing, ownership and access are defined. Provide a clear way to identify who is handling an incoming message.

## Compose and respond
Reusable wording for individual responses can reduce typing. Keep the recipient, subject and linked opportunity visible before sending. If sending is integrated, distinguish draft, queued, sent and failed states. Preserve a failed draft and avoid creating duplicate sends when a user retries.

Email tracking and extensive sending tools are lower priorities than reliable linkage and readable history. Group mail, campaign editors and marketing automation remain deferred.

## Outcome to demonstrate
Record a call, add an attachment, link a customer message and share permitted context with a colleague. Verify that unrelated private correspondence remains inaccessible and corrections are understandable.

---
# 8 Products values and estimating links
## Pipedrive reference
Pipedrive products contain reusable commercial information such as codes, descriptions, units, prices and tax. Products can be linked to deals with deal-specific prices. Price variations and multiple currency prices support differing offers. [Products](https://support.pipedrive.com/en/article/products) [Deal products](https://support.pipedrive.com/en/article/how-can-i-link-products-to-a-deal)

Recurring products and instalments model sales value over time. Formula fields calculate supported numeric or monetary deal values, and missing inputs can leave a calculation unavailable. [Recurring products](https://support.pipedrive.com/en/article/recurring-products) [Formula fields](https://support.pipedrive.com/en/article/custom-fields-formula-fields)

## Recommended essential commercial information
Show the opportunity value, currency, basis and date last reviewed. A preliminary budget, an estimate selling value and an agreed order amount answer different questions. Label the value currently displayed and allow an unknown value without silently turning it into zero.

Use product family or system type for early classification. Where available, link to shared catalogue records using stable product codes. CRM should be able to describe a customer need before the final bill of materials is known.

| Information | Recommended authority | CRM use |
| --- | --- | --- |
| Early opportunity value | Sales assessment | Initial pipeline visibility |
| Estimate cost and selling value | Estimating | Linked commercial context |
| Product identity | Agreed shared catalogue source | Consistent product references |
| Invoices credits and payments | MYOB Acumatica | Clearly dated financial context |

## Link to Estimating without duplicate entry
An opportunity should open its associated estimate and display a concise status, responsible estimator and current reference. If several estimates or revisions exist, make the active one clear while retaining history. Creating an estimate should carry the relevant customer, site and requirement context into Estimating.

An estimate revision must not silently overwrite an intentionally separate sales forecast value. Define whether the user adopts the revised value and record that choice. Detailed costing, margin decisions and engineering configurations belong to the estimating workflow.

## Later commercial extensions
Add product line summaries when they aid qualification or handover. Consider recurring contract values and staged sales forecasts only when the business needs them. Keep formula calculations defined and testable, with an explicit treatment of tax, currency and missing inputs.

## Outcome to demonstrate
Link a synthetic estimate to an opportunity, revise it and confirm that the active reference, value basis and CRM history remain clear. No proposal generation or signature workflow is needed for this proof.

---
# 9 Reporting and forecasting
## Pipedrive reference
Insights combines reports, dashboards and goals with filters and access to underlying records. Pipedrive supports reports on sales performance, conversion, duration, activities and related CRM data. Its forecast view groups opportunity value by expected close date and can apply configured probability. [Insights](https://support.pipedrive.com/en/article/insights-feature) [Report types](https://support.pipedrive.com/pt/article/insights-report-types) [Forecast view](https://support.pipedrive.com/en/article/the-forecast-view-revenue-projection)

## Initial PPO management measures
Start with a fixed dashboard and drill-through lists. Show the period, currency, filters and refresh time.

| Measure | Recommended definition | Useful drill through |
| --- | --- | --- |
| Open pipeline | Count and value of open opportunities | Stage and owner |
| Next actions needed | Open opportunities without an unfinished future activity | Affected opportunities |
| Overdue work | Unfinished activities past their due date or time | Activity owner and due date |
| Stale opportunities | Open opportunities beyond the defined inactivity threshold | Last meaningful progress |
| Won and lost | Outcomes recorded within the selected period | Reason and outcome date |
| Closing forecast | Open value grouped by expected close period | Close date and value basis |

## Forecast interpretation
Show unweighted value and, once probability rules are agreed, weighted value with its probability source. For example, AUD 127,500.50 at 40% produces AUD 51,000.20 of weighted opportunity value. Invoice and cash measures remain separate.

Count opportunities with missing values, probabilities or close dates separately. Combining currencies requires an explicit conversion basis and rate date.

## Conversion and trends
Add lead-to-opportunity conversion, stage duration, loss reasons and trends next. Define the population and time basis. For example, a closed-opportunity win rate is won divided by won plus lost for the chosen closure period. A lead conversion measure should use a stated lead cohort and observation date.

Historical stage and owner information is needed for meaningful trends. Clearly distinguish reporting by current owner from reporting by owner at the time of an event.

## Outcome to demonstrate
Use a small synthetic dataset with known totals, missing values and different outcomes. Confirm that each dashboard count reconciles to its drill-through list and that access restrictions apply to both totals and records.

---
# 10 Mobile CRM and calling
## Pipedrive reference
Pipedrive’s mobile applications provide customer, opportunity and activity access, reminders and calling-related workflows. Nearby views help users find relevant records geographically. Call logging differs by operating system; the iOS guide limits logging prompts to outgoing calls initiated in Pipedrive. [Mobile CRM](https://www.pipedrive.com/en/crm/features/mobile-crm) [Mobile calling](https://support.pipedrive.com/en/article/calling-and-logging-calls-in-the-mobile-app)

These patterns are useful for PPO mobile design. A responsive website needs its own verification of browser, device and integration behaviour.

## Apply the agreed mobile direction
For Leads, retain the compact list and the preferred lead detail presentation. Use the top-left back control in the focused Leads journey. Style the add-lead action in dark navy with a white plus symbol. The creation form should have one predictable scrolling region, with the title and save or cancel actions remaining easy to reach.

For the broader CRM workspace, develop bottom navigation around the most frequent destinations, such as opportunities, activities and contacts. Keep this as a design recommendation until that navigation is agreed. The lead detail back action should restore the previous list position and filters.

## Information density and touch behaviour
Prioritise the customer name, subject, owner, stage or qualification state and next action on small screens. Show detailed fields when a record is opened. Do not rely on hover to explain owner icons or warning states; provide tap or accessible text equivalents.

Use comfortably sized touch controls, clear labels and visible focus. When the keyboard opens, the active field and validation message must remain reachable. Avoid nested page and modal scrolling, hidden save buttons and accidental dismissal of partially completed forms.

## Calls visits and connectivity
Provide click-to-call where supported, followed by a clear manual way to record the outcome and next activity. Do not mark a call completed merely because a telephone link was opened. Site address links can support navigation without requiring a sophisticated nearby-search feature.

The essential mobile CRM should clearly indicate failed saves and preserve user input. Offer offline changes only when their durable storage, retry and conflict handling are implemented. Reuse appropriate shared PPO capabilities where they exist, while checking CRM-specific access and recovery behaviour.

## Outcome to demonstrate
On a representative phone, create and edit a lead with the keyboard open, return to the list, place a call and record follow-up. Repeat a save during a connection failure and confirm that the user can recover without losing entered information.

---
# 11 Data quality migration and integrations
## Pipedrive reference
Pipedrive supports spreadsheet import with mapping and result review, duplicate merging, exports, contact synchronisation, API access and webhooks. Exporting principal records requires attention to related notes, activities and files. Contact synchronisation can propagate changes between systems and create duplicate-management considerations. [Importing data](https://support.pipedrive.com/en/article/importing-data-into-pipedrive-with-spreadsheets) [Merge duplicates](https://support.pipedrive.com/en/article/merge-duplicates) [Exports](https://support.pipedrive.com/en/article/exporting-data-from-pipedrive) [Contact sync](https://support.pipedrive.com/en/article/contact-sync)

## Recommended data responsibilities
Identify the authoritative source for each shared record and field. Keep MYOB Acumatica responsible for accounting transactions. Define how PPO customer references relate to MYOB identifiers and how SharePoint documents are linked. A linked external system should show enough status for a user to understand when its information was last refreshed.

Avoid starting with unrestricted two-way synchronisation. Agree which system may create, update and retire each item. Preserve source identifiers so that repeating an import updates or skips the intended record rather than creating another customer or opportunity.

## Controlled Pipedrive migration
Follow the established progression: read-only sample audit, synthetic mapping examples, then a controlled import when separately authorised. Map organisations, people, leads, opportunities, owners, stages and activity states, including missing or inactive owners. Keep the original source identifier and imported status.

Use an import preview showing proposed creations, updates, possible duplicates and rejected rows. After import, reconcile totals and review a small linked sample from customer through opportunity to activities and notes. Preserve dates and history accurately, including the difference between source event time and import time.

## Duplicate review and recovery
Match using dependable identifiers where possible. Name similarity should flag a review candidate rather than automatically merge distinct companies or sites. Let an authorised user compare records, choose retained values and inspect affected links. Keep a record of the merge and define recovery before permitting destructive consolidation.

## Integration behaviour
An API allows other software to work with supported CRM data, while webhooks notify it of events. [API reference](https://developers.pipedrive.com/docs/api/v1) [Webhooks](https://pipedrive.readme.io/docs/guide-for-webhooks)

For PPO, show failures, retry safely and handle duplicate event delivery. Keep an integration error separate from the customer’s sales stage. A failed calendar update should not make the opportunity appear lost or complete.

## Outcome to demonstrate
Import the same synthetic sample twice without duplication, identify an ambiguous customer match and recover a failed integration update while preserving the CRM record.

---
# 12 Permissions security and change history
## Pipedrive reference
Pipedrive separates visibility groups, which determine accessible records, from permission sets, which determine allowed actions. It also provides authentication and security administration features. The useful design lesson is to treat record access and authority to change a record as separate questions. [Visibility groups](https://support.pipedrive.com/en/article/visibility-groups) [Permission sets](https://support.pipedrive.com/en/article/permission-sets) [Security rules](https://support.pipedrive.com/en/article/security-rules)

## Recommended PPO access model
Use the established PPO identity and role model, with understandable business responsibilities and shared application rules.

| Responsibility | Typical permitted work | Additional authority to define |
| --- | --- | --- |
| Salesperson | Manage permitted leads, opportunities and activities | Ownership transfer and shared views |
| Sales manager | Review team work and coordinate handovers | Bulk changes and team reporting |
| Technical contributor | Complete assigned clarification and review context | Restricted commercial fields |
| Data steward | Correct reference data and resolve duplicates | Imports, merges and retirement |
| Administrator | Manage users and application configuration | Exceptional record access and auditing |

Map these candidate responsibilities onto existing PPO access rules before adding roles.

## Consistent enforcement
Apply access rules to record details, Board and Grid, search, reporting, exports, attachments and integration endpoints. A shared filter must never expose records outside the viewer’s permitted scope. Recheck authority when an action is saved; a user’s access may have changed since the page opened.

Keep private communication and restricted commercial information out of previews, notification text and AI context for users who cannot read the source. Explain denied actions clearly without disclosing restricted details.

## Meaningful change history
Record important changes to ownership, stage, outcome, value basis, customer association and qualification. Show who changed what and when, with a reason where the business process needs one. Preserve completed activity outcomes and handover history. Protect this history through shared application controls.

Use the existing sign-in approach and revoke sessions when access is removed. Define backup and restore responsibilities before operational use.

## Outcome to demonstrate
Use users with different responsibilities. Confirm that a restricted opportunity cannot be opened through a direct link, found in search, inferred from a dashboard total or modified through another entry point.

---
# 13 Automation and repeatable follow up
## Pipedrive reference
Pipedrive automations use event or date triggers, conditions, branches and waiting steps to create or update records, schedule activities and send messages. Ownership and connected-account changes can affect execution. Import-trigger behaviour also differs from ordinary user changes. [Automations](https://support.pipedrive.com/en/article/workflow-automation) [Conditions](https://support.pipedrive.com/en/article/workflow-automation-conditions)

Sequences organise a series of activities, drafts and email steps for selected records. They provide a useful reference for repeatable sales work. [Sequences](https://support.pipedrive.com/pt/article/sequences)

## Begin with a few named actions
The recommended first automations are internal and easy to understand: create an initial follow-up after qualification, notify a receiving owner of a handover, and highlight work that becomes overdue. Make each action optional where the user may already have recorded the next step.

| Trigger | Proposed action | Duplicate or failure treatment |
| --- | --- | --- |
| Lead becomes an opportunity | Offer or create the first activity | Reuse an existing linked next action |
| Ownership changes | Notify the receiving owner | One notification for that transfer |
| Due time passes | Show overdue work in the personal view | Avoid repeated unchanged alerts |
| Opportunity is won | Create a delivery handover request | Link to the existing request on retry |

## Keep automation observable
Display the rule’s purpose, responsible owner and current state. Record whether an action completed, was skipped or failed, with a useful reason. Provide an authorised retry action. Disabling a rule should have an explicit effect on work that is already waiting to run.

A scheduled action should recheck relevant conditions and permissions when it executes. For example, a follow-up should not be created after the opportunity has been closed unless the rule expressly supports that situation.

## Repeatable activities before automatic emails
A task sequence can help with technical qualification or customer follow-up. Begin with activity templates that a salesperson can review and schedule. Keep automatic outbound communication for a later decision, after message ownership, cancellation, duplicate prevention and sending failures are understood.

A general automation builder is a later enhancement. First confirm that the limited rules save useful effort and that the team can explain their behaviour without specialist support.

## Outcome to demonstrate
Run the same triggering event twice, transfer responsibility while an action is waiting, and cause a recoverable failure. Confirm that work is created once and the responsible user can see what happened.

---
# 14 AI assistance and meeting information
## Pipedrive reference
Pipedrive describes AI email drafting, thread summaries, natural-language report creation and a conversational Sales Assistant. Its report-generation guide has a narrower scope than the whole Insights product, and the Sales Assistant guide describes selective beta access. [AI email creation](https://support.pipedrive.com/en/article/ai-email-creation) [Email summaries](https://support.pipedrive.com/en/article/ai-email-summarization) [AI reports](https://support.pipedrive.com/en/article/ai-report-generation) [Sales Assistant](https://support.pipedrive.com/en/article/sales-assistant)

Nova creates meeting briefs, captures meeting information, produces summaries and suggests follow-up actions or CRM updates for review. [Nova](https://support.pipedrive.com/en/article/nova)

## Recommended order for PPO
AI is a later enhancement to the essential CRM. Start with a summary of permitted customer history before a call, followed by suggested follow-up activities from a user-supplied note. These uses have a clear source and a straightforward human review step.

A summary should show the records and dates on which it relies. Distinguish a direct customer statement from a staff interpretation and from an AI suggestion. If the source information is incomplete or contradictory, make that visible instead of inventing a confident account.

## Suggestions before saved changes
An activity suggestion should show the proposed subject, responsible person, due date and source passage. The user should be able to edit or discard it before saving. Avoid creating the same task again when a note is processed twice.

Drafting an individual response can follow once customer context and mailbox behaviour are reliable. Keep proposal generation, electronic signatures and marketing content outside the present scope. AI must not silently change opportunity ownership, stage, probability, value or a customer commitment.

## Meeting information
Begin with manual meeting notes or text supplied by the user. Live recording and transcription introduce additional requirements around participant awareness, access and retention. Consider them only after there is a demonstrated need and an agreed operating approach.

CRM can store a reviewed meeting summary and link to its source. A private conversation must not become available to a wider audience merely because a summary was generated.

## Evaluate usefulness
Test with synthetic examples containing missing dates, conflicting instructions, restricted records and ambiguous responsibilities. Measure whether the summary is accurate and whether suggested actions are useful. A fast response is insufficient if it creates correction work or makes unsupported claims.

## Outcome to demonstrate
Generate a source-linked summary and proposed activity, edit the suggestion and save it. Verify that unapproved suggestions have no operational effect and restricted information is excluded.

---
# 15 Handover to Projects and Service
## Pipedrive reference
Pipedrive Projects links delivery work to deals and customer context. It supports boards, phases, tasks, subtasks, milestones, activities and templates. Projects can start from won deals or be linked separately. This offers a useful example of keeping the sales relationship connected to subsequent work. [Projects](https://support.pipedrive.com/en/article/projects-by-pipedrive)

## Recommended PPO module responsibilities
CRM should retain customer and commercial history while handing responsibility to the appropriate module. Start with a linked request, named responsibility and visible status. Project sales, service requests and estimates need different receiving workflows.

| Module | Information received from CRM | Responsibility after handover |
| --- | --- | --- |
| Estimating | Customer, site, requirement and sales contact | Costing and estimating work |
| Projects | Customer, relevant commercial reference and agreed delivery context | Project tasks, milestones and coordination |
| Service | Customer, site, equipment and requested work | Service intake, work orders and technician planning |
| MYOB Acumatica | Agreed references through the defined integration | Accounting records and transactions |

## Make the transfer explicit
Provide a handover action that previews the customer, site, contact, requirement, attachments or links, key dates and unresolved issues. Identify the receiving module and responsible person or queue. Keep a link back to the opportunity and show the handover’s progress in CRM.

Saving “won” should not imply that a project is already ready for delivery. A receiving team may need to review missing information, procurement dependencies or scheduling requirements. Represent that receiving state separately from the sales outcome.

## Preserve shared context
Changes to a shared contact should remain available across modules. Retain a record of the information supplied at handover where later interpretation depends on it. A later sales note can supplement the delivery context without rewriting the original transfer.

Keep opportunity owner, project manager and activity or work-order assignee distinct. A salesperson may remain the relationship contact after the receiving team takes responsibility for delivery.

## Outcome to demonstrate
Close a synthetic opportunity, create one delivery handover and have the receiving team identify missing information. Confirm that the sales history is retained, the request is not duplicated on retry and each team can see its next responsibility.

---
# 16 Delivery sequence and acceptance examples
## Refine against the current application
Use the report as a capability reference and compare it with the current PPO build before choosing the next implementation. Record whether each behaviour is present, needs refinement or is not yet available. Verify complete user journeys rather than counting screens or buttons.

| Delivery step | Recommended focus | Evidence of completion |
| --- | --- | --- |
| 1 | Customer context and manual leads | Persistent enquiry with owner and history |
| 2 | Qualification and opportunity views | Conversion and consistent Board and Grid |
| 3 | Activities and ownership transfer | Clear responsibility through a handover |
| 4 | Desktop and mobile refinement | The core journey works at representative sizes |
| 5 | Reporting and module links | Reconciled measures and linked delivery work |
| 6 | Communication integrations | Visible linkage, connection state and recovery |
| 7 | Selected automation and AI | Useful reviewed outputs with safe retries |

Access, change history and error recovery apply throughout. Steps may overlap where dependencies are already satisfied. Use this sequence to plan the remaining work.

## Primary synthetic acceptance journey
A salesperson records an enquiry about upgrading a greenhouse control system. They select the existing organisation and site, confirm the contact and assign technical clarification to a colleague. After qualification, they convert the lead to an opportunity with an owner, expected timing and next activity.

The salesperson finds that opportunity in both Board and Grid, links an estimate reference and hands ownership to another eligible salesperson. The receiving owner sees the requirement, prior activity outcome and upcoming action. When the opportunity is won, they create a linked request for the appropriate delivery module. The manager’s dashboard reconciles to those records.

## Additional cases that matter
Check an unknown opportunity value, missing customer information, an inactive proposed owner, a denied stage change, two users editing the same record and a connection failure during save. Include an archived lead, a repeated conversion attempt and an integration retry. Each case should have an understandable result and a clear recovery path.

## Decisions to settle during design
Confirm the minimum lead fields, pipeline stage definitions, inactivity rules, responsibility for shared customer data and the first reporting measures. Preserve the agreed PPO visual direction while testing it against real screen sizes and everyday sales tasks. Defer additional configuration until the simpler behaviour has been demonstrated and a specific need remains.
