"use client";
import { useState, type ReactNode } from "react";
import { Button } from "./ui/button";
import { Icon, Tag, Row, Dot, ChangeMarker } from "./estimation-wizard-ui";
import { WizardDialog } from "./estimation-wizard-dialog";
import { usePhoneHeader } from "../shell/phone-header";
import { useIdentity } from "./business-session";
import { ErrorNotice, Field, ValidationFields, type Failure } from "./business-ui";
import { useCrmResource, type useCrmCommand } from "./crm-state";
import { answerText } from "./discovery-fields";
import type { previewDiscoveryCreate } from "../estimating/discovery-workspaces";
import type { existingCreationWorkspace } from "../estimating/discovery-creation-reads";
import type { DiscoveryInput } from "../estimating/discovery";
import { configurationCounts, type DiscoveryFinding } from "../estimating/configuration-definition";
import { discoveryDefinition } from "../estimating/discovery-definition";

export type CreationPreview = Awaited<ReturnType<typeof previewDiscoveryCreate>>;
type Command = ReturnType<typeof useCrmCommand>;
export const displayDate = (value: string | Date) => new Date(value).toLocaleDateString("en-AU", {
  timeZone: "Australia/Brisbane", day: "numeric", month: "short", year: "numeric",
});

export function CreationLayout({ title, subtitle, status, tabs, children, footer, summary }: {
  title: string; subtitle: string; status: string; tabs?: ReactNode; children: ReactNode;
  footer: (openSummary: () => void) => ReactNode; summary: ReactNode;
}) {
  const identity = useIdentity(), [shown, setShown] = useState(true), [sheet, setSheet] = useState(false);
  const openSummary = () => {
    if (window.matchMedia("(min-width: 1200px)").matches) setShown(v => !v);
    else setSheet(true);
  };
  usePhoneHeader({ title, record: { position: title, more: [{ label: "Workspace summary", onSelect: () => setSheet(true) }] } });
  const summaryContent = (close: () => void) => <aside className="es02-summary" aria-label="Workspace summary">
    <div className="create-summary-head"><h2>Workspace summary</h2><Button variant="quiet" aria-label="Hide workspace summary" onClick={close}><Icon name="close" /></Button></div>
    {summary}
  </aside>;
  return <div id="ppo-estimate-wizard" className="es02-create-workspace" data-module-layout="full-bleed" aria-label="Create discovery workspace">
    <div className="es02-layout"><div className="es02-main">
      <header className="es02-context"><div className="es02-context-identity">
        <div className="es02-context-title"><h1>{title}</h1><Tag>Synthetic preview</Tag></div>
        <div className="es02-context-meta"><span>{subtitle}</span><span className="es02-owner"><Icon name="user" />{identity.display_name} (you)</span><span className="es02-context-state"><Dot />{status}</span></div>
      </div><div className="es02-context-controls"><Button onClick={openSummary}><Icon name="summary" />Summary</Button></div></header>
      <div className="create-phone-status"><p>{subtitle}</p><div><Tag>Synthetic preview</Tag><span><Dot />{status}</span></div></div>
      {tabs}
      <div className="es02-scroll" tabIndex={-1}>{children}</div>
      <footer className="es02-bottom">{footer(openSummary)}</footer>
    </div>{shown && <div className="create-side-summary">{summaryContent(() => setShown(false))}</div>}</div>
    {sheet && <WizardDialog title="Workspace summary" close={() => setSheet(false)} className="create-summary-dialog">
      {summaryContent(() => setSheet(false))}
    </WizardDialog>}
  </div>;
}

export function CreationSummary({ title, reference, draft, preview, findings = [], onQuestion, onFinding }: {
  title?: string; reference?: string; draft?: DiscoveryInput; preview?: CreationPreview | null;
  findings?: DiscoveryFinding[]; onQuestion?: (id: string) => void; onFinding?: (finding: DiscoveryFinding) => void;
}) {
  const config = draft?.configuration, counts = config && configurationCounts(config, findings);
  const open = preview?.compiled.open_items ?? [];
  return <>
    <span className="es02-summary-eyebrow">{draft ? "Viewing" : "Selected opportunity"}</span>
    <strong className="es02-summary-viewing">{draft ? "New workspace" : title || "No opportunity selected"}</strong>
    <span className="es02-summary-eyebrow">{draft ? "Option A — Base scope · becomes the selected basis" : reference || "Choose an opportunity to begin"}</span>
    {(draft || title) && <div className="es02-summary-tags"><Tag tone="warning">Not saved</Tag>{draft && <Tag>Working preview</Tag>}</div>}
    <dl className="es02-rows"><Row label="Discovery readiness"><Tag tone={preview?.compiled.scope_readiness === "Complete" ? "success" : preview ? "warning" : "neutral"}>{preview?.compiled.scope_readiness ?? (draft ? "Not checked" : "Not recorded")}</Tag></Row>
      <Row label="Growing areas">{counts?.growing_areas ?? "—"}</Row><Row label="Systems">{counts?.systems ?? "—"}</Row><Row label="Systems to confirm">{preview ? counts?.to_confirm ?? 0 : draft ? "Not checked" : "—"}</Row></dl>
    <hr /><span className="es02-summary-eyebrow">Saved estimate · none</span><strong className="es02-money">Not estimated</strong>
    <p className="es02-subtle">Costing starts after a Complete revision is saved.</p><dl className="es02-rows"><Row label="Cost basis">Not costed</Row></dl>
    <div className="create-callout"><Icon name="info" /><p>{draft ? "Nothing is saved until you create the workspace. Leaving this page discards these entries." : "Continue opens the first discovery for Option A. Nothing is saved until you create the workspace."}</p></div>
    {draft && <><hr /><h3>To confirm <span className="es02-count">{preview ? open.length : "—"}</span></h3>
      {!preview ? <p className="es02-subtle">Review the proposal to check its owned follow-ups.</p> : open.length ? <div className="es02-summary-findings">{open.map((item, i) => <button type="button" className="es02-summary-finding" key={`${item.key}:${i}`} onClick={() => onQuestion?.(item.key)}><Dot /><span><strong>{discoveryDefinition.questions.find(q => q.id === item.key)?.label ?? item.key.replace(/([a-z])([A-Z])/g, "$1 $2")}</strong><small>{item.follow_up.reason}</small></span><Icon name="chevron-right" /></button>)}</div> : <p className="es02-subtle">No owned follow-ups in this proposal.</p>}
      {findings.filter(f => f.category === "Readiness").map(f => <button type="button" key={f.key} className="es02-summary-finding" onClick={() => onFinding?.(f)}><Dot /><span>{f.message}</span><Icon name="chevron-right" /></button>)}
    </>}
    <hr /><dl className="es02-rows"><Row label="Estimating effort">{draft?.effort.value ?? "—"}</Row><Row label="Delivery routing">Not configured</Row></dl>
    <small className="es02-summary-foot">Counts use the whole working scope, not the current table filter.</small>
  </>;
}

export function ExistingWorkspace({ opportunityId }: { opportunityId: string }) {
  const existing = useCrmResource<Awaited<ReturnType<typeof existingCreationWorkspace>>>(`estimating/workspaces/create-existing?opportunity_id=${opportunityId}`, true);
  return <><p>Nothing was created by this request. Your entries are not copied into the existing workspace.</p>
    {existing.loading && <p role="status">Checking the permitted workspace…</p>}<ErrorNotice error={existing.error} />
    {existing.data && <><p>{existing.data.creator} created the workspace on {displayDate(existing.data.created_at)}.</p>
      <a className="ppo-button ppo-button--primary" href={`/estimating/discovery/${existing.data.id}`}><Icon name="external" />Open existing workspace</a></>}
    {!!existing.error && <Button onClick={existing.reload}>Check existing workspace again</Button>}
  </>;
}

export function CreationReviewDialog({ preview, command, title, opportunityId, reason, setReason, save, close, sentAt }: {
  preview: CreationPreview; command: Command; title: string; opportunityId: string; reason: string;
  setReason: (value: string) => void; save: (questions: string[], facts: CreationPreview["configuration_confirmations"]) => void;
  close: () => void; sentAt: Date | null;
}) {
  const [questions, setQuestions] = useState<string[]>([]), [facts, setFacts] = useState<string[]>([]);
  const error = command.error as Failure | null, frozen = command.busy || command.uncertain;
  const duplicate = error?.code === "RelationshipConflict", permission = !command.uncertain && [401, 403, 404].includes(error?.status ?? 0);
  const recovery = command.uncertain;
  const dialogTitle = recovery ? "Creation outcome not confirmed" : duplicate ? "This opportunity already has a workspace" : permission ? "You can no longer create this workspace" : "Create discovery workspace";
  const input = preview.compiled.input, open = preview.compiled.open_items;
  const ready = !frozen && !duplicate && !permission && !!reason.trim() && questions.length === preview.required_confirmation_ids.length && facts.length === preview.configuration_confirmations.length;
  const toggle = (values: string[], id: string, checked: boolean) => checked ? [...values, id] : values.filter(v => v !== id);
  return <WizardDialog title={dialogTitle} subtitle={`${title} · Option A — Base scope · discovery r01`} close={close} dismissible={!command.busy} className="create-review-dialog"
    footer={<><span>{command.busy ? "Keep this page open while it is created." : recovery ? "Check the original request before another action." : duplicate || permission ? "Nothing was created by this request." : "The server assigns the number and time."}</span>
      <Button disabled={command.busy} onClick={close}>{recovery || duplicate || permission ? "Close" : "Cancel"}</Button>
      {recovery ? <Button variant="primary" disabled={command.busy} onClick={() => void command.reconcile()}>Confirm original save outcome</Button> : !duplicate && !permission && <Button variant="primary" disabled={!ready} type="submit" form="create-discovery-review"><Icon name="plus" />{command.busy ? "Creating…" : "Create discovery workspace"}</Button>}
    </>}>
    {recovery ? <><div className="create-callout create-warning"><Icon name="warning" /><p>We could not confirm whether the workspace was created. Your entries and original request are kept on this page; nothing is shown as saved. Checking the original request never creates a second workspace.</p></div>
      {sentAt && <p className="es02-subtle">Request sent {sentAt.toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })}.</p>}<ErrorNotice error={error} /></>
    : duplicate ? <ExistingWorkspace opportunityId={opportunityId} />
    : permission ? <div className="create-callout create-warning"><Icon name="warning" /><p>Current access no longer permits creation. Nothing was created by this request. Your entries stay on this page until you leave it.</p></div>
    : <><ErrorNotice error={error} /><div className="create-callout"><Icon name="info" /><p>{preview.compiled.scope_readiness === "Incomplete" ? "Incomplete discovery can be saved with its owned follow-ups. It stays Incomplete until the required items are resolved." : "The reviewed discovery will be saved as Complete."} Delivery routing stays Not configured.</p></div>
      <fieldset disabled={frozen} aria-busy={command.busy} className="create-review-fields"><h3>What will be saved</h3><ul className="es02-changes">
        <li><span>Opportunity · {title}</span><ChangeMarker change="Added" /></li>
        <li><span>Estimating owner · {preview.creation?.owner.display_name ?? "Creator"}</span><ChangeMarker change="Added" /></li>
        <li><span>{preview.creation?.brief?.selection ? `Accepted Sales brief r${preview.creation.brief.revision} · exact acceptance linked with this creation` : "No accepted Sales brief to link"}</span><ChangeMarker change="Added" /></li>
        <li><span>Work · {input.scope.systems.map(s => s.tag.replace(/([a-z])([A-Z])/g, "$1 $2")).join(", ")}</span><ChangeMarker change="Added" /></li>
        <li><span>Areas · {input.configuration?.areas.map(a => a.label).join(", ") || "None recorded"}</span><ChangeMarker change="Added" /></li>
        {input.answers.filter(a => ["Q01", "Q02", "Q03"].includes(a.question_id)).map(a => <li key={a.question_id}><span>{a.question_id} · {a.state}</span><ChangeMarker change="Added" /></li>)}
        {input.configuration?.systems.map(s => <li key={s.id}><span>{s.name} · {s.family}</span><ChangeMarker change="Added" /></li>)}
      </ul><h3>Owned follow-ups · {open.length}</h3>{open.length ? <ul className="es02-changes">{open.map((item, i) => <li key={`${item.key}:${i}`}><span>{discoveryDefinition.questions.find(q => q.id === item.key)?.label ?? item.key} · {item.follow_up.reason}</span><Tag tone="warning">{item.blocks_scope ? "Keeps Incomplete" : "Follow-up"}</Tag></li>)}</ul> : <p>No owned follow-ups in this proposal.</p>}
      <form id="create-discovery-review" onSubmit={event => { event.preventDefault(); if (ready) save(questions, preview.configuration_confirmations.filter(f => facts.includes(f.fact_id))); }}>
        <ValidationFields error={error}><Field label="Discovery change reason" name="reason" value={reason} onChange={setReason} required multiline maxLength={1000} hint="Shown with discovery r01 in history." /></ValidationFields>
        <fieldset className="es02-confirm"><legend>Confirm reviewed values</legend>
          {!preview.required_confirmation_ids.length && !preview.configuration_confirmations.length && <p>No answer is marked Confirmed, so there is nothing to acknowledge. Sales statements stay Answered until you confirm them.</p>}
          {preview.required_confirmation_ids.map(id => { const a = input.answers.find(a => a.question_id === id)!; return <label key={id}><input type="checkbox" checked={questions.includes(id)} onChange={e => setQuestions(toggle(questions, id, e.target.checked))} /><span>I confirm {id} · {answerText(a.value)} · {a.source}</span></label>; })}
          {preview.configuration_confirmations.map(f => { const c = input.configuration!; const area = c.areas.find(a => a.id === f.fact_id), fact = c.facts.find(a => a.id === f.fact_id), work = c.responsibilities.find(a => a.id === f.fact_id); return <label key={f.fact_id}><input type="checkbox" checked={facts.includes(f.fact_id)} onChange={e => setFacts(toggle(facts, f.fact_id, e.target.checked))} /><span>I confirm {area ? `${area.label} · ${area.source}` : work ? `${work.work} · ${work.party} · ${work.source}` : fact ? `${c.systems.find(s => s.id === fact.system_id)?.name} · ${fact.field} · ${fact.value} ${fact.unit} · ${fact.source}` : "this exact configuration item"}.</span></label>; })}
        </fieldset>
      </form></fieldset>
    </>}
  </WizardDialog>;
}
