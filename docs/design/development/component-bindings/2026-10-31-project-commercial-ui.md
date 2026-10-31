# PJ-05 shared component consumers

Owner: Dean Fiedler. Scope PJ-05. The [accepted source](../../../decisions/project-commercial-figma-design.md) is separate from application visual acceptance. These hosts retain shared component rules; fixtures use synthetic data only. See [execution and comparison evidence](../../../testing/evidence/project-commercial/README.md).

## buttons

Button and ButtonLink retain shared focus, busy and disabled rules. Register Refresh and creation, row Preview and record commands call native reads or commands. A Submitted proposal authored by the current reviewer renders a disabled decision action and an explanatory banner. Alignment: inspect the desktop and phone captures; application acceptance remains pending.

## register-table

RegisterTable groups only a complete permitted list, with fixed Select and Settings columns and shared title links. Selection supports one-record preview, not bulk commands. Phone rows carry the same states and amounts. A partial source read suppresses complete counts and never exposes hidden record IDs. Alignment: inspect the desktop and phone captures; application acceptance remains pending.

## fields

Shared fields retain accessible labels and validation associations. Variation unknown/not-priced toggles preserve null separately from explicit zero or credit. Notice occurrence uses site-time input and native future-date refusal; reason and note remain distinct stored fields. Alignment: inspect the desktop and phone captures; application acceptance remains pending.

## lookup

LookupField supplies the project picker and native owner, handover, quotation and document choices. Search is bounded to 100 authorised choices with a more-results hint. The three exact basis IDs are resolved together before Create; choices confer no command authority. Alignment: inspect the desktop and phone captures; application acceptance remains pending.

## validation

ValidationFields renders native field and command refusals. Fixture examples include an invalid exact source, a stale expected version and future notice evidence. Definitive refusals allow correction; uncertain outcomes lock the original command for receipt recovery. Alignment: inspect the desktop and phone captures; application acceptance remains pending.

## tabs

RecordTabs and RecordPanel provide keyboard navigation. Desktop shows Overview, Activities and History, with Sources on Basis; phone adds Details. Hidden desktop Details is omitted from the tab model so arrow keys cannot focus an invisible tab. Alignment: inspect the desktop and phone captures; application acceptance remains pending.

## menu

The SecondaryMenuFrame menu switches one-project views. Phone uses the shared shell menu and a labelled view selector below the compact values card. No cross-project queue or Project record Commercial tab is introduced while #698 is unmerged. Alignment: inspect the desktop and phone captures; application acceptance remains pending.

## dialog

WorklistPanel provides the centred decision and undrawn action dialogs, shared focus containment and dismissal. Phone decisions use a bottom sheet. Exact version and duty checks remain native. Blocked satisfaction names the linked open Activities; no speculative control-value preview is shown. Alignment: inspect the desktop and phone captures; application acceptance remains pending.

## drawer

Create variation, record notice and propose basis use the shared drawer. Forms include native evidence, reason and note and preserve pending command bytes before sending. Preview opens a read-only summary with an Open record action. Alignment: inspect the desktop and phone captures; application acceptance remains pending.

## read-state

ReadState distinguishes loading, unavailable, retained stale and partial reads. Failed refresh retains prior same-project facts with actions disabled; revoked authority clears them. Control values require both finance duties and show Unavailable instead of zero. Alignment: inspect the desktop and phone captures; application acceptance remains pending.

## status

RegisterChip maps native states and disputes. Notice Corrected is a permission-checked chain projection, not a new stored state. Overdue is display-only in site time. A correction whose successor cannot be read shows unavailable status. Alignment: inspect the desktop and phone captures; application acceptance remains pending.

## application-shell

The Projects navigation item opens /projects/commercial. SecondaryMenuFrame receives data-ppo-workspace="shared" through attributes. The record uses the shared full-bleed record root. Module integration entries declare both consumers without adding shared CSS page-ID lists. Alignment: inspect the desktop and phone captures; application acceptance remains pending.

## shared-record

SharedRecord composes four native record kinds with facts, sources, tabbed content and permitted actions. Facts move into Details on phone. Previous/next require a complete same-kind list. Overview keeps valuation alternatives separate; History shows stored actor names, reasons and notes. Alignment: inspect the desktop and phone captures; application acceptance remains pending.
