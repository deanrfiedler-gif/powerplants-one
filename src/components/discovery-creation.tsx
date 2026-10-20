"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ErrorNotice, Field, SelectField, ValidationFields, type Failure } from "./business-ui";
import { denied, useCrmCommand, useCrmResource } from "./crm-state";
import { useIdentity } from "./business-session";
import { Button, ButtonLink } from "./ui/button";
import { RecordTabs } from "./record-ui";
import { Icon, StateTag, Tag, Dot } from "./estimation-wizard-ui";
import { WizardDialog } from "./estimation-wizard-dialog";
import { AreasEditor, FamilyOverview, SystemsEditor, ResponsibilitiesEditor, type Focus } from "./configuration-editor";
import { DiscoveryFields, AnswerFields, activeInput, answerText, preserveAnswerOrder, type FormOptions } from "./discovery-fields";
import { SalesBriefContent } from "./sales-estimating-link";
import { CreationLayout, CreationSummary, CreationReviewDialog, ExistingWorkspace, displayDate, type CreationPreview } from "./discovery-creation-parts";
import { creationSteps, creationIssues, creationBriefLabel, initialCreationDraft, questionStep, type CreationContext, type CreationStep, type CreationIssue } from "./discovery-creation-model";
import { equipmentCatalogueDefinition } from "../estimating/equipment-catalogue";
import type { DiscoveryInput, Answer } from "../estimating/discovery";
import type { Configuration, DiscoveryFinding } from "../estimating/configuration-definition";
import type { discoveryCreationChoices } from "../estimating/discovery-creation-reads";
import type { readHandover } from "../sales/handover-service";
import "./discovery.css";
import "./estimation-wizard.css";
import "./estimation-wizard-figma.css";
import "./discovery-creation.css";

type Choices = Awaited<ReturnType<typeof discoveryCreationChoices>>;
const validId = (value: string | null) => !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

// Initial entry loads once. The editor revalidates current choices independently,
// without a parent refresh discarding its pending original command.
function useCreationStart<T>(path: string | null) {
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{ path: string | null; data: T | null; error: unknown }>({ path: null, data: null, error: null });
  useEffect(() => {
    let live = true;
    if (path) void api<T>(path).then(
      data => { if (live) setState({ path, data, error: null }); },
      error => { if (live) setState({ path, data: null, error }); },
    );
    return () => { live = false; };
  }, [path, retry]);
  return { data: state.path === path ? state.data : null, error: state.path === path ? state.error : null, reload: () => setRetry(n => n + 1) };
}

export function NewDiscoveryWorkspace() {
  const params = useSearchParams(), requested = params.get("sales_handover"), requestedOpportunity = params.get("opportunity");
  const handover = useCreationStart<Awaited<ReturnType<typeof readHandover>>>(validId(requested) ? `sales/handovers/${requested}` : null);
  const [started, setStarted] = useState<string | null>(null);
  if (requested) {
    const row = handover.data?.record;
    const invalid = !validId(requested) || !!row && (row.kind !== "Estimating" || !!requestedOpportunity && requestedOpportunity !== row.opportunity_id);
    if (invalid || handover.error) return <CreationLoadState error={handover.error ?? { message: "This Sales handover does not match the requested opportunity." }} retry={handover.reload} />;
    if (!row) return <CreationLoadState retry={handover.reload} />;
    return <CreationLoader opportunityId={row.opportunity_id} salesHandover={requested} />;
  }
  return started ? <CreationLoader key={started} opportunityId={started} salesHandover={null} onChoose={() => setStarted(null)} />
    : <ChooseOpportunity initial={validId(requestedOpportunity) ? requestedOpportunity! : ""} onContinue={setStarted} />;
}

function CreationLoadState({ error, retry }: { error?: unknown; retry: () => void }) {
  return <CreationLayout title="New discovery workspace" subtitle="First discovery" status={error ? "Nothing saved" : "Loading…"}
    summary={<CreationSummary />} footer={() => <ButtonLink href="/estimating/discovery">Open Discovery register</ButtonLink>}>
    <ErrorNotice error={error} />{error ? <Button onClick={retry}>Try loading again</Button> : <p role="status">Loading permitted discovery context…</p>}
  </CreationLayout>;
}

function ChooseOpportunity({ initial, onContinue }: { initial: string; onContinue: (id: string) => void }) {
  const choices = useCrmResource<Choices>("estimating/workspaces/create-choices", true), [selected, setSelected] = useState(initial), [search, setSearch] = useState("");
  const items = choices.data?.items ?? [], current = items.find(o => o.id === selected), query = search.trim().toLocaleLowerCase("en-AU");
  const shown = items.filter(o => [o.title, o.display_number, o.customer, o.site].join(" ").toLocaleLowerCase("en-AU").includes(query));
  return <CreationLayout title="New discovery workspace" subtitle="One workspace per opportunity" status={choices.loading ? "Loading…" : "Not started · nothing saved"}
    summary={<CreationSummary title={current?.title} reference={current?.display_number} />}
    footer={() => <><span className="es02-bottom-state">{current ? `${current.title} selected · nothing saved yet` : items.length || choices.loading ? "Choose an opportunity to continue" : "Nothing to create"}</span>
      <ButtonLink href="/estimating/discovery" className="create-cancel">Cancel</ButtonLink>
      <Button variant="primary" disabled={!current || choices.loading || !!choices.error} onClick={() => current && onContinue(current.id)}><Icon name="arrow-right" />Continue to discovery</Button></>}>
    <section className="create-choose" aria-labelledby="create-choose-title"><h2 id="create-choose-title">Choose the opportunity</h2>
      <p>Only opportunities you can estimate that have no estimate and no workspace yet are listed, newest first.</p>
      <label className="create-search"><Icon name="search" /><span className="sr-only">Search opportunity, number or customer</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunity or customer" disabled={choices.loading} /></label>
      <ErrorNotice error={choices.error} />{!!choices.error && <Button onClick={choices.reload}>Try loading again</Button>}
      {choices.loading && <><p role="status">Loading permitted opportunities…</p><div className="create-skeletons" aria-hidden="true">{[0, 1, 2, 3].map(i => <div key={i}><span /><span /></div>)}</div></>}
      {!choices.loading && !choices.error && (items.length ? <>
        <fieldset className="create-choices"><legend className="sr-only">Eligible opportunity</legend>{shown.map(o => <label key={o.id} className="create-choice" data-selected={selected === o.id}>
          <input type="radio" name="opportunity" value={o.id} checked={selected === o.id} onChange={() => setSelected(o.id)} />
          <span><strong>{o.title}</strong><small>{o.display_number} · {o.customer}{o.site && <span className="create-choice-site"> · {o.site}</span>} · {creationBriefLabel(o.brief)}</small></span>
        </label>)}</fieldset>
        {!shown.length && <p role="status">No opportunities match this search. <Button variant="quiet" onClick={() => setSearch("")}>Clear search</Button></p>}
        <p className="create-count" role="status">{shown.length} shown · {items.length} eligible in the latest {choices.data?.limit} candidates. Missing one? It may already have an estimate or workspace, or be outside your estimating access.</p>
      </> : <div className="create-empty"><h3>No eligible opportunities</h3><p>Continue an existing workspace from the Discovery register, or start a new opportunity in CRM Sales. Only opportunities within your estimating access are listed.</p><div><ButtonLink href="/estimating/discovery">Open Discovery register</ButtonLink><ButtonLink href="/sales/opportunities">Open CRM Sales</ButtonLink></div></div>)}
    </section>
  </CreationLayout>;
}

function CreationLoader({ opportunityId, salesHandover, onChoose }: { opportunityId: string; salesHandover: string | null; onChoose?: () => void }) {
  const options = useCreationStart<FormOptions>(`estimating/workspaces/form-options?opportunity_id=${opportunityId}&configuration_definition=${equipmentCatalogueDefinition}`);
  const context = useCreationStart<CreationContext>(`estimating/workspaces/create-options?opportunity_id=${opportunityId}`);
  const error = options.error ?? context.error;
  if (denied(error)) return <CreationLoadState error={error} retry={() => { options.reload(); context.reload(); }} />;
  if (!options.data || !context.data) return <CreationLoadState error={error} retry={() => { options.reload(); context.reload(); }} />;
  if (salesHandover && (context.data.brief?.handover_id !== salesHandover || !context.data.brief.selection))
    return <CreationLoadState error={{ message: "Review and accept the current Sales brief before starting from this handover." }} retry={context.reload} />;
  return <CreationEditor key={opportunityId} opportunityId={opportunityId} salesHandover={salesHandover} initialOptions={options.data} initialContext={context.data} onChoose={onChoose} />;
}

function CreationEditor({ opportunityId, salesHandover, initialOptions, initialContext, onChoose }: {
  opportunityId: string; salesHandover: string | null; initialOptions: FormOptions; initialContext: CreationContext; onChoose?: () => void;
}) {
  const router = useRouter(), identity = useIdentity();
  const [draft, setDraft] = useState(() => initialCreationDraft(initialOptions, initialContext.brief)), [owner, setOwner] = useState(initialContext.owner_id);
  const [brief, setBrief] = useState(initialContext.brief), [step, setStep] = useState<CreationStep>("Requirements"), [tab, setTab] = useState("Discovery");
  const [preview, setPreview] = useState<CreationPreview | null>(null), [previewError, setPreviewError] = useState<unknown>(null), [previewBusy, setPreviewBusy] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false), [reason, setReason] = useState(""), [attempted, setAttempted] = useState(false), [sentAt, setSentAt] = useState<Date | null>(null);
  const [question, setQuestion] = useState<string | null>(null), [scopeOpen, setScopeOpen] = useState(false), [briefReview, setBriefReview] = useState(false), [evidence, setEvidence] = useState<{ id?: string } | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null), [add, setAdd] = useState<{ family: string; nonce: number } | null>(null);
  const command = useCrmCommand(receipt => router.push(salesHandover ? `/sales/handoffs/estimating/${salesHandover}?created_workspace=${receipt.record_id}` : `/estimating/discovery/${receipt.record_id}?step=Requirements`), "Unsaved", undefined, true, [], { retainUnconfirmed: true });
  const scopeQuery = `opportunity_id=${opportunityId}&scope_mode=${draft.scope.mode}${draft.scope.site_id ? `&site_id=${draft.scope.site_id}` : ""}`;
  const options = useCrmResource<FormOptions>(`estimating/workspaces/form-options?${scopeQuery}&configuration_definition=${equipmentCatalogueDefinition}&selected_facility_ids=${draft.scope.facility_ids.join(",")}&selected_equipment_ids=${draft.scope.equipment_ids.join(",")}`, true);
  const context = useCrmResource<CreationContext>(`estimating/workspaces/create-options?${scopeQuery}`, true);
  const available = options.data ?? initialOptions, current = context.data ?? initialContext, title = initialOptions.opportunity.title;
  const issues = creationIssues(draft, available, owner), readError = options.error ?? context.error;
  const briefChanged = !!current.brief?.source_changed || JSON.stringify(current.brief?.selection ?? null) !== JSON.stringify(brief?.selection ?? null);
  const blocked = command.busy || command.uncertain || previewBusy, canRead = !!options.data && !!context.data && !readError;
  const findings = preview?.compiled.findings ?? [], config = draft.configuration!;
  const validation = attempted && issues.length ? { message: "Review these details before creating the workspace.", field_errors: issues.map(({ field, message }) => ({ field, message })) } : previewError;
  const latestPreviewRequest = useRef(0);
  function dirty() { latestPreviewRequest.current++; setPreview(null); setPreviewError(null); command.clearError(); command.dirty(); }
  function update(value: DiscoveryInput) { if (!blocked) { dirty(); setDraft(value); } }
  function updateConfig(configuration: Configuration) { update({ ...draft, configuration }); }
  function go(next: CreationStep) { setTab("Discovery"); setStep(next); }
  function locate(id: string) {
    if (initialOptions.definition.questions.some(q => q.id === id)) { go(questionStep(id)); setQuestion(id); }
    else if (id.startsWith("Configuration")) go("Configuration");
    else { go("Requirements"); setScopeOpen(true); }
  }
  function goIssue(issue: CreationIssue) {
    go(issue.step);
    if (issue.question) setQuestion(issue.question);
    else if (issue.field !== "scope.systems" && issue.field !== "creation.owner_id") setScopeOpen(true);
    window.setTimeout(() => document.getElementById(issue.field)?.focus(), 50);
  }
  function goFinding(finding: DiscoveryFinding) {
    go(finding.step === "Requirements" ? "Requirements" : finding.step === "Configuration" ? "Configuration" : "Scope & delivery");
    setFocus({ entity_id: finding.entity_id, field: finding.field ?? "", nonce: Date.now() });
  }
  const proposal = { opportunity_id: opportunityId, discovery: activeInput(draft, available), creation: { owner_id: owner, sales_brief: brief?.selection ?? null } };
  async function review() {
    setAttempted(true); setPreviewError(null); command.clearError();
    if (issues.length) { goIssue(issues[0]); return; }
    if (!canRead || briefChanged || blocked) return;
    const request = ++latestPreviewRequest.current;
    setPreviewBusy(true);
    try {
      const result = await api<CreationPreview>("estimating/workspaces/preview", proposal);
      if (request === latestPreviewRequest.current) { setPreview(result); setReviewOpen(true); }
    } catch (error) { setPreviewError(error); }
    finally { setPreviewBusy(false); }
  }
  async function save(questions: string[], facts: CreationPreview["configuration_confirmations"]) {
    if (!preview || blocked || briefChanged) return;
    setSentAt(new Date());
    await command.send("estimating/workspaces", { ...proposal, id: crypto.randomUUID(), option_id: crypto.randomUUID(), revision_id: crypto.randomUUID(),
      context_hash: preview.context_hash, expected_opportunity_version: preview.expected_opportunity_version,
      confirmed_question_ids: questions, configuration_confirmations: facts, reason });
  }
  const currentQuestion = question && available.definition.questions.find(q => q.id === question);
  const answer = currentQuestion && draft.answers.find(a => a.question_id === currentQuestion.id);
  const editorProps = { value: config, onChange: updateConfig, options: available, findings, onEvidence: (id?: string) => setEvidence({ id }), readOnly: blocked || !canRead, evaluated: !!preview, focus };
  const selectedSite = available.sites.find(s => s.id === draft.scope.site_id);
  const viewedOption = (id: string) => <div className="create-viewed-option"><label htmlFor={id}>Viewed alternative</label><select id={id} aria-label="Viewed alternative" value="A" onChange={() => {}}><option value="A">Option A — Base scope · new</option></select></div>;
  return <CreationLayout title={title} subtitle={`${current.opportunity.customer}${selectedSite ? ` · ${selectedSite.display_name}` : ""}`} status={command.uncertain ? "Creation outcome not confirmed" : "New workspace · not saved"}
    tabs={<div className="es02-view-row"><RecordTabs id="create-workspace" label="Workspace views" value={tab} onChange={setTab} tabs={[{ id: "Discovery", label: "Discovery" }, { id: "Alternatives", label: <>Alternatives <span className="es02-count">0</span></> }, { id: "Revisions", label: <>Revisions <span className="es02-count">0</span></> }]} /><div className="create-desktop-option">{viewedOption("create-option-desktop")}</div></div>}
    summary={<CreationSummary draft={draft} preview={preview} findings={findings} onQuestion={locate} onFinding={goFinding} />}
    footer={openSummary => <><span className="es02-bottom-state"><Dot />{command.uncertain ? "Creation outcome not confirmed" : attempted && issues.length ? `${issues.length} details need attention · nothing saved` : "New workspace · Option A not saved"}</span>
      <Button className="create-phone-summary" onClick={openSummary}><Icon name="summary" />Summary</Button>
      <Button variant="primary" disabled={command.busy || previewBusy || (!command.uncertain && (!canRead || briefChanged))} onClick={() => command.uncertain ? setReviewOpen(true) : void review()}><Icon name="plus" /><span className="create-desktop-label">{command.uncertain ? "Confirm original save outcome" : "Create discovery workspace"}</span><span className="create-phone-label">{command.uncertain ? "Confirm outcome" : "Create workspace"}</span></Button>
      {step !== "Review" && <Button className="create-continue" disabled={blocked} onClick={() => go(creationSteps[creationSteps.indexOf(step) + 1])}>Continue<Icon name="arrow-right" /></Button>}</>}>
    <ErrorNotice error={readError} />{!!readError && <Button onClick={() => { options.reload(); context.reload(); }}>Reload permitted choices</Button>}
    {!canRead && !readError && <p role="status">Checking current scope and owner choices…</p>}
    {attempted && issues.length > 0 && <div className="create-callout create-warning" role="alert"><Icon name="warning" /><p>{issues.length} details need attention before you can create. {issues[0].message}</p><Button variant="quiet" onClick={() => goIssue(issues[0])}>Go to first</Button></div>}
    <ErrorNotice error={previewError} />
    {(brief || current.brief) && <><div className={`create-sales-banner${briefChanged ? " create-warning" : ""}`} role={briefChanged ? "alert" : undefined}><Icon name={briefChanged ? "warning" : "info"} /><p>{briefChanged ? "The Sales brief needs renewed review. Your discovery entries are retained." : brief?.selection ? `From the accepted Sales brief ${current.opportunity.display_number} r${brief.revision}. The exact acceptance is linked when you create. Sales statements do not confirm discovery answers.` : `Sales brief ${current.brief?.state.toLowerCase()}. No accepted brief will be linked.`}</p><Link href={`/sales/handoffs/estimating/${(brief ?? current.brief)!.handover_id}`}><span className="create-desktop-label">Return to Sales handover</span><span className="create-phone-label">Handover</span></Link></div>
      <details className="create-sales-disclosure"><summary>Reported Sales problem and scope</summary><SalesBriefContent content={(brief ?? current.brief)!.content} /></details>
      {briefChanged && <Button disabled={blocked} onClick={() => setBriefReview(true)}>Review current Sales brief</Button>}
    </>}
    <div className="create-phone-option">{viewedOption("create-option-phone")}</div>
    {tab !== "Discovery" ? <section role="tabpanel" id={`create-workspace-panel-${tab}`} aria-labelledby={`create-workspace-tab-${tab}`} className="create-empty-view"><h2>{tab}</h2><p>{tab === "Alternatives" ? "Option A is the first scope. Create the workspace before adding alternatives." : "No revision has been saved. Creation will retain the first discovery revision."}</p><Button onClick={() => setTab("Discovery")}>Return to discovery</Button></section>
    : <div role="tabpanel" id="create-workspace-panel-Discovery" aria-labelledby="create-workspace-tab-Discovery">
      <nav className="es02-steps" aria-label="Discovery steps">{creationSteps.map((s, i) => <button key={s} type="button" className="es02-step" aria-current={step === s ? "step" : undefined} onClick={() => go(s)}><strong>{i + 1}. {s}</strong><small>{step === s ? <><Dot />In progress</> : s === "Pricing" ? "After a Complete save" : s === "Review" ? "Review and create" : attempted && issues.some(issue => issue.step === s) ? "Needs attention" : "Not started"}</small></button>)}</nav>
      <div className="create-step-select"><small>Step {creationSteps.indexOf(step) + 1} of 5 · In progress</small><div><Button aria-label="Previous discovery step" disabled={step === "Requirements"} onClick={() => go(creationSteps[creationSteps.indexOf(step) - 1])}><Icon name="arrow-left" /></Button><select aria-label="Discovery step" value={step} onChange={e => go(e.target.value as CreationStep)}>{creationSteps.map(s => <option key={s}>{s}</option>)}</select><Button aria-label="Next discovery step" disabled={step === "Review"} onClick={() => go(creationSteps[creationSteps.indexOf(step) + 1])}><Icon name="arrow-right" /></Button></div></div>
      <fieldset disabled={blocked || !canRead} className="create-editable"><ValidationFields error={validation}>
        {step === "Requirements" && <>
          <section className="es02-section"><div className="es02-section-head"><div><h2>Opportunity & site</h2><p>Resolved from canonical records. Discovery choices do not change those records.</p></div></div>
            <div className="create-context-grid"><div className="create-record-field"><span>Opportunity</span><Link href={`/sales/opportunities/${opportunityId}`}>{title}<Icon name="external" /></Link><small>{current.opportunity.display_number}{brief?.selection && ` · Sales brief r${brief.revision}${brief.accepted_at ? ` · accepted ${displayDate(brief.accepted_at)}` : ""}`}</small></div>
              <div className="create-record-field create-customer"><span>Customer</span><Link href={`/customers/${current.opportunity.organisation_id}`}>{current.opportunity.customer}<Icon name="external" /></Link></div>
              <div className="create-record-field"><span>Site</span><button type="button" onClick={() => setScopeOpen(true)}>{selectedSite?.display_name ?? (draft.scope.mode === "NoSiteRequired" ? "No Site required" : "Site not yet known")}<Icon name="chevron-down" /></button><small>One site per saved revision</small></div>
              <SelectField label="Estimating owner" name="creation.owner_id" value={owner} options={current.estimators} onChange={id => { dirty(); setOwner(id); }} required />
              <div><SelectField label="Estimating effort" name="effort.value" value={draft.effort.value} options={["Full", "Express", "Unknown"].map(id => ({ id, display_name: id }))} onChange={value => update({ ...draft, effort: { value: value as DiscoveryInput["effort"]["value"], source: value === "Unknown" ? null : `${identity.display_name} · estimator declaration`, follow_up: value === "Unknown" ? { owner_id: available.owner.id, reason: "" } : null } })} /><small className="es02-subtle">Set by {identity.display_name} · not saved</small></div>
              <div className="create-record-field create-routing"><span>Delivery routing</span><div>Not configured</div><small>Stays Not configured until a routing rule set is adopted.</small></div>
            </div>
            {current.more_estimators && <p>Showing eligible estimators from the first 100 active users. Further estimator search is not configured.</p>}
            <Button variant="quiet" onClick={() => setScopeOpen(true)}>Review site scope and effort details</Button>
          </section>
          <section className="es02-section create-brief"><div className="es02-section-head"><div><h2>Brief</h2><p>Answers keep their state and source. Each unresolved required answer needs an owned follow-up.</p></div></div>
            <fieldset className="create-work-tags" id="scope.systems" tabIndex={-1}><legend>Work in this scope</legend>{(["ProductSupply", "DefinedLabour", "Freight"] as const).map(tag => <label key={tag}><input type="checkbox" checked={draft.scope.systems.some(s => s.tag === tag)} onChange={event => update({ ...draft, scope: { ...draft.scope, systems: event.target.checked ? [...draft.scope.systems, { tag, facility_ids: [] }] : draft.scope.systems.filter(s => s.tag !== tag) } })} />{tag.replace(/([a-z])([A-Z])/g, "$1 $2")}</label>)}<small>These tags decide which questions apply. They are not the equipment families.</small></fieldset>
            <div className="create-answers">{available.definition.questions.filter(q => ["Q01", "Q02", "Q03"].includes(q.id)).map(q => { const a = draft.answers.find(a => a.question_id === q.id)!; const errors = attempted ? issues.filter(issue => issue.question === q.id) : []; return <div key={q.id} className="create-answer" data-question={q.id}><div><label htmlFor={`create-${q.id}`}>{q.label} · {q.id}</label><button type="button" className="create-answer-details" aria-label={`Review ${q.id} state, source and follow-up`} onClick={() => setQuestion(q.id)}><Tag tone={a.state === "Assumed" || a.state === "Empty" ? "warning" : "neutral"}>{a.state === "Empty" || a.state === "Deferred" ? "Follow-up" : a.state}</Tag><Icon name="chevron-down" /></button><small>{a.source ?? `Owner ${available.owners.find(o => o.id === a.follow_up?.owner_id)?.display_name ?? "not chosen"}`}</small></div>
              <textarea id={`create-${q.id}`} className="create-answer-value" value={a.value === null ? "" : answerText(a.value)} maxLength={q.max_length} placeholder={a.follow_up?.reason ? `Not answered yet. Follow-up: ${a.follow_up.reason}` : "Record an answer or review its owned follow-up…"} aria-invalid={!!errors.length} aria-describedby={errors.length ? `error-${q.id}` : undefined} onChange={event => update({ ...draft, answers: preserveAnswerOrder(draft.answers, { ...a, value: event.target.value || null, state: ["Empty", "Deferred"].includes(a.state) ? "Answered" : a.state }, available.definition.questions) })} />
              {errors.length > 0 && <small id={`error-${q.id}`} className="field-error">{errors.map(e => e.message).join(" ")}</small>}
            </div>; })}</div>
          </section>
          <AreasEditor {...editorProps} /><FamilyOverview value={config} variant="full" findings={findings} evaluated={!!preview} onConfigure={() => go("Configuration")} onAdd={family => { go("Configuration"); setAdd({ family, nonce: Date.now() }); }} />
        </>}
        {step === "Configuration" && <div className="es02-configuration"><SystemsEditor {...editorProps} addRequest={add} /><DiscoveryFields value={draft} options={available} onChange={update} step="Configuration" /></div>}
        {step === "Scope & delivery" && <><ResponsibilitiesEditor {...editorProps} /><DiscoveryFields value={draft} options={available} onChange={update} step="Scope & delivery" /><p>Delivery routing is Not configured. These scope declarations do not book work or commit a delivery date.</p></>}
        {step === "Pricing" && <section className="es02-section"><h2>Not estimated</h2><p>Create and save a Complete discovery revision before reviewing a costing basis. No price is calculated from this working copy.</p></section>}
        {step === "Review" && <section className="es02-section"><h2>Review the first discovery</h2><p>Creation saves Option A, discovery r01, the selected estimating owner and the exact accepted Sales brief link together.</p><p>{issues.length ? `${issues.length} details need attention.` : "The minimum details are recorded. Review the current server preview before creating."}</p><ul>{issues.map((issue, i) => <li key={`${issue.field}:${i}`}><Button variant="quiet" onClick={() => goIssue(issue)}>{issue.field} · {issue.message}</Button></li>)}</ul><Button onClick={() => void review()}>Review and create</Button></section>}
      </ValidationFields></fieldset>
      {onChoose && <Button variant="quiet" className="create-change-opportunity" disabled={blocked} onClick={() => { if (!command.hasUnsavedChanges || window.confirm("Discard these unsaved entries and choose another opportunity?")) { command.discard(); onChoose(); } }}>Choose another opportunity</Button>}
    </div>}
    {currentQuestion && answer && <WizardDialog title={`${currentQuestion.label} · ${currentQuestion.id}`} close={() => setQuestion(null)} dismissible={!blocked} footer={<><span>Edits remain in the first discovery until creation.</span><Button onClick={() => setQuestion(null)}>Done</Button></>}>
      <fieldset disabled={blocked}><ValidationFields error={validation}><AnswerFields question={currentQuestion} value={answer} options={available} onChange={(value: Answer) => update({ ...draft, answers: preserveAnswerOrder(draft.answers, value, available.definition.questions) })} /></ValidationFields></fieldset>
    </WizardDialog>}
    {scopeOpen && <WizardDialog title="Site scope and effort" close={() => setScopeOpen(false)} footer={<><span>These choices affect this discovery only.</span><Button onClick={() => setScopeOpen(false)}>Done</Button></>}><fieldset disabled={blocked}><ValidationFields error={validation}><DiscoveryFields value={draft} options={available} onChange={update} step="Requirements" part="scope" /></ValidationFields></fieldset></WizardDialog>}
    {briefReview && <WizardDialog title="Review current Sales brief" close={() => setBriefReview(false)} footer={<><Button onClick={() => setBriefReview(false)}>Cancel</Button><Button variant="primary" disabled={!!current.brief?.source_changed || blocked || !canRead} onClick={() => { dirty(); setBrief(current.brief); setBriefReview(false); }}>Use this reviewed Sales context</Button></>}><p>Your discovery answers are retained. This changes only which current accepted brief is linked when you create.</p>{current.brief ? <><StateTag value={current.brief.state} /><SalesBriefContent content={current.brief.content} />{current.brief.source_changed && <p role="alert">Sales sources changed. Renew the Sales review before creation.</p>}</> : <p>No accepted Sales brief is available to link.</p>}</WizardDialog>}
    {evidence && <CreationEvidence value={config} options={available} selected={evidence.id} onChange={updateConfig} close={() => setEvidence(null)} />}
    {reviewOpen && preview && <CreationReviewDialog preview={preview} command={command} title={title} opportunityId={opportunityId} reason={reason} setReason={setReason} save={(q, f) => void save(q, f)} close={() => setReviewOpen(false)} sentAt={sentAt} />}
    {(previewError as Failure)?.code === "RelationshipConflict" && <WizardDialog title="This opportunity already has a workspace" close={() => setPreviewError(null)} footer={<Button onClick={() => setPreviewError(null)}>Close</Button>}><ExistingWorkspace opportunityId={opportunityId} /></WizardDialog>}
  </CreationLayout>;
}

function CreationEvidence({ value, selected, options, onChange, close }: { value: Configuration; selected?: string; options: FormOptions; onChange: (v: Configuration) => void; close: () => void }) {
  const [chosen, setChosen] = useState(selected ?? value.evidence[0]?.id ?? ""), item = value.evidence.find(e => e.id === chosen);
  const sources = item?.source_type === "Site" ? options.sites : item?.source_type === "Facility" ? options.facilities : item?.source_type === "Asset" ? options.equipment : [];
  const update = (patch: Partial<Configuration["evidence"][number]>) => item && onChange({ ...value, evidence: value.evidence.map(e => e.id === item.id ? { ...e, ...patch } : e) });
  return <WizardDialog title="Configuration evidence" close={close} footer={<><span>Evidence remains in this working discovery.</span><Button onClick={close}>Done</Button></>}>
    <SelectField label="Evidence observation" name="creation-evidence" value={chosen} options={value.evidence.map(e => ({ id: e.id, display_name: e.observation || "New observation" }))} onChange={setChosen} />
    <Button onClick={() => { const id = crypto.randomUUID(); onChange({ ...value, evidence: [...value.evidence, { id, lineage: null, source_type: "Manual", source_id: null, source_version: null, observation: "", observed_on: "", note: null }] }); setChosen(id); }}><Icon name="plus" />Add evidence</Button>
    {item && <><SelectField label="Evidence source type" name="evidence.source-type" value={item.source_type} options={["Manual", "Site", "Facility", "Asset"].map(id => ({ id, display_name: id }))} onChange={type => update({ source_type: type as typeof item.source_type, source_id: null, source_version: null })} />
      {item.source_type !== "Manual" && <SelectField label="Permitted evidence source" name="evidence.source-id" value={item.source_id ?? ""} options={sources} onChange={id => { const source = sources.find(s => s.id === id); update({ source_id: source?.id ?? null, source_version: source?.version ?? null }); }} />}
      <Field label="Observation" name="evidence.observation" value={item.observation} multiline maxLength={1000} onChange={observation => update({ observation })} />
      <Field label="Observed business date" name="evidence.date" type="date" value={item.observed_on} onChange={observed_on => update({ observed_on })} />
      <Field label="Evidence note" name="evidence.note" value={item.note ?? ""} multiline maxLength={500} onChange={note => update({ note: note || null })} />
    </>}
  </WizardDialog>;
}
