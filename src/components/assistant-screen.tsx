"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { assistantTurn, customerSummary, searchCustomers, recentProposals, ProposalView } from '../assistant/service';
import { ASSISTANT_LABEL } from '../assistant/simulated';
import { api, ErrorNotice, Field, SelectField, Stamp, PageHeader, ValidationFields, useResource, isDenied, type Failure } from './business-ui';
import { CrmPicker } from './crm-screens';
import './assistant.css';

type Customers = Awaited<ReturnType<typeof searchCustomers>>;
type Customer = Customers['items'][number];
type Summary = Awaited<ReturnType<typeof customerSummary>>;
type Turn = Awaited<ReturnType<typeof assistantTurn>>;
type Draft = {
  company_id:string; organisation_id:string; site_id:string; primary_person_id:string;
  site_unknown_reason:string; contact_unknown_reason:string; title:string; need_summary:string;
  source_channel:string; source_basis:string; owner_id:string; activity_owner:string;
  action_kind:string; action_summary:string; due_choice:string; due_at:string;
};
const blank = ():Draft => ({company_id:'',organisation_id:'',site_id:'',primary_person_id:'',site_unknown_reason:'',contact_unknown_reason:'',title:'',need_summary:'',source_channel:'',source_basis:'',owner_id:'',activity_owner:'',action_kind:'CustomerContact',action_summary:'',due_choice:'',due_at:''});
const choices=(values:string[])=>values.map(id=>({id,display_name:id.replace(/([a-z])([A-Z])/g,'$1 $2')}));
function remember(id:string) { window.history.replaceState(null,'',id?`/assistant?proposal=${encodeURIComponent(id)}`:'/assistant'); }
function restore(v:ProposalView):Draft {
  const c=v.command!;
  return {...blank(),company_id:c.company_id,organisation_id:c.organisation_id,site_id:c.site_id??'',primary_person_id:c.primary_person_id??'',site_unknown_reason:c.site_unknown_reason??'',contact_unknown_reason:c.contact_unknown_reason??'',title:c.title,need_summary:c.need_summary,source_channel:c.source_channel,source_basis:c.source_basis,owner_id:c.owner_id,activity_owner:c.initial_action.owner_id,action_kind:c.initial_action.kind,action_summary:c.initial_action.summary,due_choice:c.initial_action.due_needed?'unknown':'known',due_at:c.initial_action.due_at??''};
}
function values(d:Draft) {
  return {company_id:d.company_id,organisation_id:d.organisation_id,site_id:d.site_id||null,primary_person_id:d.primary_person_id||null,site_unknown_reason:d.site_id?null:d.site_unknown_reason,contact_unknown_reason:d.primary_person_id?null:d.contact_unknown_reason,title:d.title,need_summary:d.need_summary,source_channel:d.source_channel,source_basis:d.source_basis,owner_id:d.owner_id,initial_action:{owner_id:d.activity_owner,kind:d.action_kind,summary:d.action_summary,due_needed:d.due_choice==='unknown',due_at:d.due_choice==='known'?d.due_at:null}};
}
export function AssistantScreen({initialProposal=''}:{initialProposal?:string}) {
  const mode=useResource<{mode:'off'|'simulated'}>('assistant/status');
  const recent=useResource<Awaited<ReturnType<typeof recentProposals>>>('assistant/proposals');
  const [message,setMessage]=useState(''),[request,setRequest]=useState('');
  const [turn,setTurn]=useState<Turn|null>(null),[customers,setCustomers]=useState<Customers|null>(null);
  const [customer,setCustomer]=useState<Customer|null>(null),[summary,setSummary]=useState<Summary|null>(null);
  const [draft,setDraft]=useState<Draft>(blank),[editing,setEditing]=useState(false);
  const [proposal,setProposal]=useState<ProposalView|null>(null),[supersedes,setSupersedes]=useState<string|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState<unknown>(null),[status,setStatus]=useState('');
  const [preparing,setPreparing]=useState(false);
  const alive=useRef(true),locked=useRef(false);
  const pending=useRef<{id:string;supersedes:string|null;values:ReturnType<typeof values>}|null>(null);
  const reviewHeading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{
    let live=true;
    if(initialProposal) void api<ProposalView>(`assistant/proposals/${encodeURIComponent(initialProposal)}`).then(v=>{if(live)setProposal(v);},e=>{if(live)setError(e);});
    return()=>{live=false;};
  },[initialProposal]);
  useEffect(()=>{if(proposal)reviewHeading.current?.focus();},[proposal]);
  async function run(work:()=>Promise<void>) {
    if(locked.current)return;
    locked.current=true;setBusy(true);setError(null);setStatus('Working…');
    try{await work();}catch(e){if(alive.current){setError(e);setStatus('The result needs attention.');if(isDenied(e)){setTurn(null);setCustomers(null);setCustomer(null);setSummary(null);setDraft(blank());setEditing(false);setProposal(null);setRequest('');setMessage('');recent.reload();}}}
    finally{locked.current=false;if(alive.current)setBusy(false);}
  }
  const unresolved=proposal?.state==='Submitting';
  const occupied=!!proposal||editing||preparing;
  const enabled=mode.data?.mode==='simulated';
  const field=(key:keyof Draft,value:string)=>setDraft(d=>({...d,[key]:value}));
  async function send(text:string) {
    await run(async()=>{
      const result=await api<Turn>('assistant/turn',{message:text,organisation_id:customer?.id??null});
      if(!alive.current)return;
      setRequest(text);setMessage('');setTurn(result);setSummary('summary' in result?result.summary:null);setCustomers('customers' in result?result.customers:null);
      if(result.kind==='create'){
        setEditing(true);setDraft({...blank(),...(customer?{company_id:customer.company_id,organisation_id:customer.id}:{}),...result.draft,action_summary:result.draft.action_summary??''});
      }
      setStatus('Simulation complete. No business record was created.');
    });
  }
  async function selectCustomer(c:Customer) {
    setCustomer(c);setSummary(null);setDraft(d=>({...d,company_id:c.company_id,organisation_id:c.id,site_id:'',primary_person_id:'',owner_id:'',activity_owner:'',site_unknown_reason:'',contact_unknown_reason:''}));
    await run(async()=>{const result=await api<Summary>(`assistant/customers/${c.id}/summary`);if(alive.current){setSummary(result);setStatus('Customer CRM context loaded.');}});
  }
  async function prepare() {
    await run(async()=>{
      pending.current??={id:crypto.randomUUID(),supersedes,values:values(draft)};
      remember(pending.current.id);setPreparing(true);
      try{
        const result=await api<ProposalView>('assistant/proposals',pending.current);
        if(!alive.current)return;
        pending.current=null;setPreparing(false);setEditing(false);setProposal(result);setDraft(blank());setRequest('');recent.reload();setStatus('Review prepared. Nothing has been created.');
      }catch(e){if(alive.current && (e as Failure).status && (e as Failure).status!>=400 && (e as Failure).status!<500){pending.current=null;setPreparing(false);}throw e;}
    });
  }
  async function load(id:string) {
    await run(async()=>{const v=await api<ProposalView>(`assistant/proposals/${id}`);if(alive.current){setProposal(v);setEditing(false);setDraft(blank());setSummary(null);setRequest('');remember(id);recent.reload();setStatus(v.receipt?'Save confirmed by the server.':'Original proposal loaded.');}});
  }
  async function confirm() {
    if(!proposal)return;
    const original=proposal;
    await run(async()=>{
      setProposal({...original,state:'Submitting'});
      const v=await api<ProposalView>(`assistant/proposals/${original.id}/confirm`,{expected_version:original.version,command_hash:original.command_hash});
      if(alive.current){setProposal(v);recent.reload();setStatus('Opportunity and initial follow-up saved.');}
    });
  }
  function startOver() {
    setProposal(null);setEditing(false);setDraft(blank());setSupersedes(null);setTurn(null);setSummary(null);setRequest('');setCustomers(null);setCustomer(null);setMessage('');setError(null);remember('');setStatus('Ready for another request.');
  }
  return <div className="assistant-screen">
    <PageHeader eyebrow="PPO Assistant · AI1 preview" title="A little help with your next step" description="Find a customer, catch up on CRM context, or prepare a new opportunity." action={<Link className="button secondary" href="/crm/opportunities">Open CRM Sales</Link>} />
    <div className="assistant-mode"><strong><span className="assistant-dot" />{ASSISTANT_LABEL}</strong><span>Local rules · No AI provider connected · Text only</span></div>
    <ErrorNotice error={mode.error}/>
    {mode.loading&&<p role="status">Loading assistant availability…</p>}
    {mode.data?.mode==='off'&&<div className="assistant-card"><h2>Assistant is switched off</h2><p>Use the ordinary CRM screens to work. You can still check an earlier save below and recover an original submission.</p><Link href="/crm/opportunities/new">Add an opportunity using the form</Link></div>}
    <div className="assistant-grid">
      <section className="assistant-card assistant-conversation" aria-labelledby="assistant-ask">
        <p className="eyebrow">01 / Ask</p><h2 id="assistant-ask">What would you like to do?</h2>
        <p>This is a bounded simulation. It recognises the example requests below; it does not reason like a real AI assistant.</p>
        <div className="assistant-prompts">
          {['Find customer SYN','Show my opportunities with next action needed','Add a deal for SYN to review irrigation controls'].map(text=><button key={text} className="secondary" disabled={!enabled||busy||occupied} onClick={()=>void send(text)}>{text}<span aria-hidden="true">↗</span></button>)}
        </div>
        <form onSubmit={e=>{e.preventDefault();void send(message);}}>
          <fieldset disabled={!enabled||busy||occupied}>
            <Field name="assistant-message" label="Your request" value={message} onChange={setMessage} multiline maxLength={4000} required hint="For a new deal, try: Add a deal for [customer] to [requirement]. Optional lines: Title:, Requirement:, Source:, Source details:, Follow-up:."/>
            <button type="submit">Send request</button>
          </fieldset>
        </form>
        {occupied&&<p className="read-meta">Finish or clear the current review before starting another request.</p>}
        {request&&<div className="assistant-request"><strong>Your request</strong><p>{request}</p></div>}
        {turn&&<div className="assistant-reply"><strong>Simulated assistant</strong><p>{turn.explanation}</p></div>}
        <p className="assistant-status" role="status" aria-live="polite">{busy?'Working…':status}</p>
        <ErrorNotice error={error}/>
        {!unresolved&&!preparing&&occupied&&<button className="secondary" disabled={busy} onClick={startOver}>Clear this view</button>}
        <p className="read-meta">Requests and summaries stay in this view only. Prepared reviews expire after 15 minutes; submitted originals remain recoverable.</p>
      </section>
      <div className="assistant-workspace">
        {customers&&!proposal&&<section className="assistant-card" aria-labelledby="assistant-customers">
          <p className="eyebrow">02 / Choose the record</p><h2 id="assistant-customers">Matching customers</h2>
          <p>Search: “{turn?.query||'all permitted customers'}” · Up to 20 per page. Choose the intended record; similar names are not merged.</p>
          {!customers.items.length&&<p className="empty-state">No permitted matches on this page. Clear the view and refine the customer name.</p>}
          <ul className="assistant-records">{customers.items.map(c=><li key={c.id}><div><Link href={c.href}>{c.display_name}</Link><small>{c.display_number}</small></div><button className="secondary" aria-pressed={customer?.id===c.id} disabled={busy||preparing} onClick={()=>void selectCustomer(c)}>{customer?.id===c.id?'Selected':'Select customer'}</button></li>)}</ul>
          {customers.next_cursor&&<button className="secondary" disabled={busy||preparing} onClick={()=>void run(async()=>{const v=await api<Customers>(`assistant/customers?${new URLSearchParams({q:turn?.query??'',cursor:customers.next_cursor!})}`);if(alive.current)setCustomers(v);})}>Next customer page</button>}
        </section>}
        {summary&&!proposal&&<SummaryCard value={summary} busy={busy} next={(kind)=>void run(async()=>{const q=new URLSearchParams();q.set(kind,summary[kind]!);const next=await api<Summary>(`assistant/customers/${summary.organisation.id}/summary?${q}`);if(alive.current)setSummary(next);})}/>}
        {turn&&'opportunities' in turn&&!proposal&&<section className="assistant-card"><h2>Opportunity worklist</h2><p>Owner: {turn.mine?'my opportunities':'all permitted owners'} · Next action: {turn.next_action??'any'} · First 20 results.</p><ul className="assistant-records">{turn.opportunities.items.map(o=><li key={o.id}><Link href={`/crm/opportunities/${o.id}`}>{o.title} · {o.display_number}</Link></li>)}</ul>{!turn.opportunities.items.length&&<p>No permitted matches in this filtered result.</p>}<Link href="/crm/opportunities">Open the full CRM worklist</Link><p className="read-meta">Choose the same filters there to continue this search.</p></section>}
        {editing&&<section className="assistant-card"><p className="eyebrow">03 / Complete the details</p><h2>Prepare an opportunity</h2><p>{customer?`Customer: ${customer.display_name} · ${customer.display_number}`:'Select an existing customer above.'} Nothing is saved to CRM until you confirm the review.</p>
          <form onSubmit={e=>{e.preventDefault();void prepare();}}><ValidationFields error={error}><fieldset disabled={busy||preparing}>
            <div className="assistant-fields">
              <Field name="title" label="Opportunity title" value={draft.title} onChange={v=>field('title',v)} required/>
              <Field name="need_summary" label="Customer requirement" value={draft.need_summary} onChange={v=>field('need_summary',v)} multiline maxLength={2000} required/>
              <SelectField name="source_channel" label="Source" value={draft.source_channel} onChange={v=>field('source_channel',v)} options={choices(['Phone','Email','Meeting','Referral','Other'])} required/>
              <Field name="source_basis" label="Source details" value={draft.source_basis} onChange={v=>field('source_basis',v)} multiline maxLength={1000} required/>
              <CrmPicker label="Site" name="site_id" kind="Site" value={draft.site_id} onChange={v=>setDraft(d=>({...d,site_id:v,primary_person_id:'',owner_id:'',activity_owner:''}))} context={{company_id:draft.company_id,organisation_id:draft.organisation_id}}/>
              {!draft.site_id&&<Field name="site_unknown_reason" label="Why is the site unknown?" value={draft.site_unknown_reason} onChange={v=>field('site_unknown_reason',v)} maxLength={1000} required/>}
              <CrmPicker label="Primary contact" name="primary_person_id" kind="Person" value={draft.primary_person_id} onChange={v=>field('primary_person_id',v)} context={{company_id:draft.company_id,organisation_id:draft.organisation_id,site_id:draft.site_id}}/>
              {!draft.primary_person_id&&<Field name="contact_unknown_reason" label="Why is the contact unknown?" value={draft.contact_unknown_reason} onChange={v=>field('contact_unknown_reason',v)} maxLength={1000} required/>}
              <CrmPicker label="Opportunity owner" name="owner_id" kind="Owner" value={draft.owner_id} onChange={v=>field('owner_id',v)} context={{company_id:draft.company_id,organisation_id:draft.organisation_id,site_id:draft.site_id,primary_person_id:draft.primary_person_id}}/>
            </div>
            <h3>Initial follow-up</h3>
            <CrmPicker label="Follow-up owner" name="initial_action.owner_id" kind="ActionOwner" value={draft.activity_owner} onChange={v=>field('activity_owner',v)} context={{company_id:draft.company_id,organisation_id:draft.organisation_id,site_id:draft.site_id,primary_person_id:draft.primary_person_id}}/>
            <SelectField name="initial_action.kind" label="Follow-up kind" value={draft.action_kind} onChange={v=>field('action_kind',v)} options={choices(['CustomerContact','RelationshipReview'])} required/>
            <Field name="initial_action.summary" label="Follow-up details" value={draft.action_summary} onChange={v=>field('action_summary',v)} multiline maxLength={2000} required/>
            <SelectField name="initial_action.due_needed" label="Follow-up due date" value={draft.due_choice} onChange={v=>field('due_choice',v)} options={[{id:'unknown',display_name:'Date not known — mark due date needed'},{id:'known',display_name:'I can provide an exact date and time'}]} required/>
            {draft.due_choice==='known'&&<Field name="initial_action.due_at" label="Due date and time with UTC offset" value={draft.due_at} onChange={v=>field('due_at',v)} required hint="Example: 2026-09-15T09:00:00+10:00 (Brisbane). Relative dates are not inferred."/>}
            <button type="submit" disabled={!draft.organisation_id||!draft.owner_id||!draft.activity_owner}>Prepare review</button>
          </fieldset></ValidationFields></form>
          {preparing&&<div role="status"><p>The prepared review is unconfirmed. Retry the same details to retrieve it.</p><button disabled={busy} onClick={()=>void prepare()}>Check prepared review</button></div>}
        </section>}
        {proposal&&<section className="assistant-card assistant-review" aria-labelledby="assistant-review-title"><p className="eyebrow">04 / Review and confirm</p><h2 id="assistant-review-title" tabIndex={-1} ref={reviewHeading}>{proposal.receipt?'Opportunity saved':proposal.state==='Submitting'?'Check the original save':'Review opportunity'}</h2>
          {proposal.receipt?<><p role="status">The server confirmed this opportunity and its initial follow-up.</p><Link className="button" href={`/crm/opportunities/${proposal.receipt.record_id}`}>Open saved opportunity</Link><p>Accepted <Stamp value={proposal.receipt.accepted_at}/> (Australia/Brisbane)</p><details><summary>Save reference</summary><code>{proposal.receipt.receipt_id}</code></details></>:<>
            <p>Status: {proposal.state} · Review expires <Stamp value={proposal.expires_at}/> (Australia/Brisbane)</p>
            {proposal.command&&proposal.selections&&<ReviewDetails value={proposal}/>}
            {proposal.state==='Ready'&&enabled&&<><p>Creates one opportunity at Enquiry / Open in the CRM discovery pipeline and one linked Internal follow-up. This does not create a quote, price, order or email.</p><button disabled={busy} onClick={()=>void confirm()}>Confirm and create opportunity</button></>}
            {(proposal.state==='Ready'||proposal.state==='Expired')&&enabled&&<button className="secondary" disabled={busy} onClick={()=>{if(!proposal.command)return;setDraft(restore(proposal));setSupersedes(proposal.id);setEditing(true);setProposal(null);setStatus('Edit the details, then prepare a fresh review.');}}>Edit and review again</button>}
            {proposal.state==='Submitting'&&<><p>An earlier submission may already have succeeded. Check its status, or retry the unchanged original. Both use the same saved operation identity.</p><button disabled={busy} onClick={()=>void confirm()}>Retry original submission</button></>}
            <button className="secondary" disabled={busy} onClick={()=>void load(proposal.id)}>Check save status</button>
          </>}
        </section>}
        {!customers&&!summary&&!editing&&!proposal&&!(turn&&'opportunities' in turn)&&<section className="assistant-card assistant-welcome"><div className="assistant-welcome-icon" aria-hidden="true">↗</div><h2>From a request to a reviewed action</h2><p>Start with an example or describe an opportunity. Select the right customer, review the CRM context, then check every detail before creating it.</p><div className="assistant-steps"><span>Find the customer</span><span>Review the context</span><span>Confirm the action</span></div></section>}
      </div>
    </div>
    <section className="assistant-card assistant-recent"><div className="assistant-section-heading"><div><p className="eyebrow">Continue safely</p><h2>Recent reviews and saved outcomes</h2></div><button className="secondary" disabled={busy} onClick={recent.reload}>Refresh saved reviews</button></div><p>{recent.data?.coverage??'Only proposals belonging to your current identity are available here.'}</p><ErrorNotice error={recent.error}/>{recent.loading&&<p role="status">Loading saved reviews…</p>}<ul className="assistant-records">{recent.data?.items.map(v=><li key={v.id}><div><strong>{v.title}</strong><small>{v.state}</small></div><button className="secondary" disabled={busy||preparing||!!unresolved||editing} onClick={()=>void load(v.id)}>Open review</button></li>)}</ul>{recent.data&&!recent.data.items.length&&<p>No saved reviews are available for this identity.</p>}</section>
  </div>;
}
function ReviewDetails({value}:{value:ProposalView}) {
  const c=value.command!,s=value.selections!;
  const pairs=[['Company',s.company],['Customer',s.organisation],['Title',c.title],['Requirement',c.need_summary],['Source',c.source_channel],['Source details',c.source_basis],['Site',s.site??`Unknown: ${c.site_unknown_reason}`],['Contact',s.contact??`Unknown: ${c.contact_unknown_reason}`],['Opportunity owner',s.owner],['Follow-up owner',s.activity_owner],['Follow-up kind',c.initial_action.kind],['Follow-up details',c.initial_action.summary],['Follow-up due',c.initial_action.due_needed?'Due date needed':c.initial_action.due_at]];
  return <dl className="assistant-review-details">{pairs.map(([label,text])=><div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl>;
}
function SummaryCard({value,busy,next}:{value:Summary;busy:boolean;next:(kind:'opportunity_cursor'|'activity_cursor')=>void}) {
  return <section className="assistant-card" aria-labelledby="assistant-summary"><p className="eyebrow">Recorded facts · Sources included</p><h2 id="assistant-summary">Customer CRM summary</h2><p><strong>{value.organisation.display_name}</strong> · {value.organisation.display_number}</p><p className="read-meta">Read <Stamp value={value.observed_at}/> (Australia/Brisbane)</p><ul className="assistant-facts">{value.facts.map(f=><li key={f.source_id}><Link href={f.href}>{f.title}</Link><p>{f.text}</p><small>{f.kind} · Version {f.version} · Updated <Stamp value={f.source_at}/></small></li>)}</ul><p className="read-meta">{value.coverage}</p><div className="assistant-actions">{value.opportunity_cursor&&<button className="secondary" disabled={busy} onClick={()=>next('opportunity_cursor')}>Next opportunities</button>}{value.activity_cursor&&<button className="secondary" disabled={busy} onClick={()=>next('activity_cursor')}>Next activities</button>}</div><div className="assistant-suggestion"><strong>Suggested next step</strong><p>Check the source records and confirm any missing context with the customer. This suggestion is not a recorded customer fact.</p></div></section>;
}
