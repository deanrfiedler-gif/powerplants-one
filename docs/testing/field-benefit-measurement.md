# Field Work benefit measurement

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler / Service measurement owner to confirm. **Benefits unmeasured. Human baseline samples: 0; comparable follow-up samples: 0.** [BP-01 section 22](../blueprints/BP-01-master-blueprint.md#22-business-outcomes-and-measure-dictionary), D-004 and the [owner walkthrough](../delivery/field-integrated-owner-walkthrough.md) govern this instrument. Availability for review supplies no task measurements.

## Cohort and comparison decisions

The proposed preparation exercise uses matched synthetic planned external-visual inspection jobs with two crew acknowledgements, partial first attendance, owned outstanding work, explicit separate-visit preparation and independent synthetic Finance. This is a proposed measurement cohort, not an adopted operational pilot. Dean must identify the comparable baseline method/source, participant roles, inclusion/exclusion rules, task variants/order, measurement window/timezone and success criterion. These values remain null in [measurement records](evidence/field-integrated-acceptance/measurements.json); no threshold is invented.

Use equal information, scope/asset complexity, preloaded history, known data completeness and network conditions in baseline and follow-up. Do not time someone reading an answer sheet as an unassisted search. Use matched alternatives/counterbalanced order if repeating could teach the answer. Retain failures, assistance, pauses and abandoned trials; record the reason, never silently exclude them. Product waits and participant effort must be distinguishable. Stop elapsed task time only at the defined verified outcome; record active effort separately if reliably observed. Without a comparable baseline and follow-up, report raw observations only, not improvement percentages.

| Task | Start → finish boundary | Record alongside duration | Related proposed BP-01 measures |
|---|---|---|---|
| M01 preparation/search | Receive the job question → identify correct customer/Site, relevant earlier failed finding, current scope and outstanding owner | Wrong record selections, help prompts, corrections, participant explanation of current authority | KPI-07; preparation/search effort |
| M02 closed attendance/next step | Open closed original → explain own attendance and reach the appropriate existing receiving record | Misdirected arrival attempts (attempted new Start on closed original), duplicated preparation attempts, confusion/comment | KPI-15; correction effort |
| M03 preparation/pack | Receive agreed separate-work request → proposed/confirmed appointment and exact pack handover ready for required recipients | Preparation repetitions; personal acknowledgement effort; refusal and recovery; do not count queued rendering as Issued | KPI-01/02; denominator/cutoff needs owner definition |
| M04 schedule change | Receive a material date change → controlled move and required contact/pack/acknowledgement obligations identified | Active effort, waiting, corrections and unresolved recipients; no invented message delivery | KPI-04; schedule-change effort |
| M05 completion/report | Begin factual completion → exact submitted/reviewed/issued report at the selected role boundary | Help, returned corrections, active work versus elapsed waiting; record all distinct timestamps | KPI-05; report/correction effort |
| M06 Finance handoff | Reviewed report ready → separately reviewed/processed/reconciled synthetic handoff | Role handovers, no-posting treatment, unknown-outcome lookup, corrections, waiting/age and missing source conditions | KPI-12; handoff effort/age |

Only include M03–M06 if the selected cohort supplies the relevant participant duties; do not extrapolate Dean's owner review to technician or Finance performance. Complete H02/H03 comprehension with the participant's own explanation before providing coaching. Record assistance as it occurs, not as a retrospective “easy” rating.

Each trial records trial/pair/task ID; baseline/follow-up source; participant and actual role; observer; source/build; device/OS/browser/input/assistive technology; viewport/zoom; fixture/entry IDs and data completeness; network; UTC start/end plus timezone; active effort/paused waiting; result; misdirected arrivals; repeat/duplicate preparation attempts; help count/type; corrections; verbatim comprehension/comments; inclusion/exclusion reason and reviewer. Use null for unobserved values, never zero. [CSV recording sheet](evidence/field-integrated-acceptance/measurement-trials.csv) is header-only until a genuine trial occurs.

Automated journey duration, one-minute timer fixture, test-run duration, process restart/checkpoint time and PT-27 core-read p95 are **technical timings**, not human task timings or measured business benefit. No operational volume, hourly rate, financial saving, improvement percentage, first-visit resolution rate or whole-business average is established. A same-work-order visit is not authoritative return lineage for a KPI-06 denominator.
