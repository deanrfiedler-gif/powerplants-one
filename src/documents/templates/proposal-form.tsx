"use client";
import { useState } from "react";
import { useCrmCommand,useCrmResource } from "../../components/crm-state";
import { ErrorNotice,Field,SelectField,ValidationFields } from "../../components/business-ui";
import { Button } from "../../components/ui/button";
import { WorklistPanel } from "../../components/crm-worklist-tools";
import { Note,Paging,ReadFeedback,useTemplatePages } from "./common";
import { familyNames,type Family,type Template,type ProposalData,type Scope,type Body,type Binding } from "./types";

export function ProposalForm({family,base,proposal,onClose,onSaved}:{family:Family;base?:Template;proposal?:ProposalData;onClose:()=>void;onSaved:(id:string)=>void}) {
  const [newId]=useState(()=>crypto.randomUUID());
  const [company,setCompany]=useState(proposal?.proposal.company_id??""),[site,setSite]=useState(proposal?.proposal.site_id??"");
  const [selectedBase,setBase]=useState(base??null);
  const [body,setBody]=useState<Body>(proposal?.revision.body??{schema_version:1,title:"",audience:"Internal",fields:[{key:"",label:"",binding:"",required:false}]});
  const [reason,setReason]=useState("");
  const command=useCrmCommand(()=>onSaved(proposal?.proposal.id??newId),"Unsaved",undefined,true,[],{retainUnconfirmed:true});
  const scopes=useTemplatePages<Scope>(proposal?null:`document-template-drafts/scopes?family=${family}`);
  const definitions=useTemplatePages<Template>(proposal||base?null:`document-templates?family=${family}`);
  const bindings=useCrmResource<{items:Binding[]}>(site?`document-template-drafts/bindings?family=${family}&company_id=${company}&site_id=${site}`:null,true);
  const permitted=scopes.data?.items.filter(x=>x.can_propose)??[];
  const companies=[...new Map(permitted.map(x=>[x.company_id,x.company_name])).entries()];
  const canClose=()=>{if(command.busy||command.uncertain)return;if(!command.hasUnsavedChanges||window.confirm("Discard unsaved proposal changes?")){command.discard();onClose();}};
  const change=(next:Body)=>{command.dirty();setBody(next);};
  const field=(index:number,patch:Partial<Body["fields"][number]>)=>change({...body,fields:body.fields.map((x,i)=>i===index?{...x,...patch}:x)});
  const move=(index:number,delta:number)=>{const fields=[...body.fields];[fields[index],fields[index+delta]]=[fields[index+delta],fields[index]];change({...body,fields});};
  const scopeReady=proposal?proposal.permissions.can_revise:permitted.some(x=>x.site_id===site&&x.company_id===company);
  const save=()=>{
    if(!scopeReady||!bindings.data||bindings.error||bindings.loading)return;
    if(proposal)void command.send(`document-template-drafts/${proposal.proposal.id}/revisions`,{expected_version:proposal.proposal.version,observed_revision_id:proposal.revision.id,revision_id:crypto.randomUUID(),body,reason});
    else if(selectedBase)void command.send("document-template-drafts",{id:newId,revision_id:crypto.randomUUID(),company_id:company,site_id:site,family,base_template_id:selectedBase.id,base_content_hash:selectedBase.content_hash,body,reason});
  };
  return <WorklistPanel title={proposal?`Revise · ${proposal.revision.body.title}`:`New proposal · ${familyNames[family]}`} drawer onClose={canClose}>
    <form className="tm-form" onSubmit={e=>{e.preventDefault();save();}}><ValidationFields error={command.error}>
      <Note>{proposal?`Creates revision r${proposal.revision.revision+1} from command version ${proposal.proposal.version}. The base and earlier reviews stay unchanged. A new revision returns the proposal to Draft.`:"Creates review evidence from an exact retained base for one company and site. It changes no supported definition or site use."}</Note>
      <ErrorNotice error={command.error}/>
      <fieldset disabled={command.busy||command.uncertain}>
      {!proposal?<><ReadFeedback {...scopes}/><div className="tm-pair"><SelectField name="company_id" label="Company" required value={company} options={companies.map(([id,name])=>({id,display_name:name??id}))} onChange={value=>{command.dirty();setCompany(value);setSite("");change({...body,fields:[{key:"",label:"",binding:"",required:false}]});}}/><SelectField name="site_id" label="Site" required value={site} options={permitted.filter(x=>x.company_id===company).map(x=>({id:x.site_id,display_name:x.site_name??x.site_id}))} onChange={value=>{command.dirty();setSite(value);change({...body,fields:[{key:"",label:"",binding:"",required:false}]});}}/></div><Paging read={scopes} scope="permitted sites"/>
      {base?<p>Base: {base.name} · version {base.version} · {base.id}</p>:<><ReadFeedback {...definitions}/><SelectField name="base_template_id" label="Base template" required value={selectedBase?.id??""} options={(definitions.data?.items??[]).filter(x=>x.definition_integrity).map(x=>({id:x.id,display_name:`${x.name} · version ${x.version} · ${x.id}`}))} onChange={id=>{command.dirty();setBase(definitions.data?.items.find(x=>x.id===id)??null);}}/><Paging read={definitions} scope="retained definitions"/></>}
      </>:<p>Review scope: {proposal.company_name??company} · {proposal.site_name??site}. Base version {proposal.revision.base.version}, {proposal.revision.base.id}.</p>}
      <Field name="title" label="Title" value={body.title} onChange={title=>change({...body,title})} required maxLength={200}/>
      {family==="OUT-10"?<SelectField name="audience" label="Audience" required value={body.audience} onChange={audience=>change({...body,audience:audience as Body["audience"]})} options={[{id:"Internal",display_name:"Internal"},{id:"Customer",display_name:"Customer"}]}/>:<p>Audience: Internal</p>}
      <ReadFeedback {...bindings}/><h3>Fields · 1–40 in order</h3>
      {body.fields.map((f,i)=><div className="tm-field-row" key={i}><span className="tm-field-index">{i+1}</span><Field name={`field-${i}-key`} validationField={`fields.${i}.key`} label={`Field ${i+1} key`} value={f.key} onChange={key=>field(i,{key})} required maxLength={64}/><Field name={`field-${i}-label`} validationField={`fields.${i}.label`} label={`Field ${i+1} label`} value={f.label} onChange={label=>field(i,{label})} required maxLength={120}/><SelectField name={`field-${i}-binding`} label={`Field ${i+1} source`} required value={f.binding} options={(bindings.data?.items??[]).map(x=>({id:x.binding,display_name:x.binding}))} onChange={binding=>field(i,{binding})}/><label className="tm-checkbox"><input type="checkbox" checked={f.required} onChange={e=>field(i,{required:e.target.checked})}/>Required (proposed)</label><div className="tm-field-actions"><Button aria-label={`Move field ${i+1} up`} disabled={i===0} onClick={()=>move(i,-1)}>Up</Button><Button aria-label={`Move field ${i+1} down`} disabled={i===body.fields.length-1} onClick={()=>move(i,1)}>Down</Button><Button aria-label={`Remove field ${i+1}`} disabled={body.fields.length===1} onClick={()=>change({...body,fields:body.fields.filter((_,j)=>j!==i)})}>Remove</Button></div></div>)}
      <Button disabled={body.fields.length>=40} onClick={()=>change({...body,fields:[...body.fields,{key:"",label:"",binding:"",required:false}]})}>Add field</Button>
      <p className="tm-muted">Only existing sources permitted at this site are offered. Requiredness is proposed; no value is fetched or rendered here.</p>
      <Field name="reason" label="Reason" value={reason} onChange={v=>{command.dirty();setReason(v);}} required maxLength={1000}/>
      </fieldset><p role="status">{command.status}</p>
      {command.uncertain&&<Note warning>Keep this dialog open. Confirm the original action before editing or starting another intent. <Button busy={command.busy} onClick={()=>void command.reconcile()}>Confirm original action</Button></Note>}
      <footer className="tm-form-actions"><Button disabled={command.busy||command.uncertain} onClick={canClose}>Cancel</Button><Button type="submit" variant="primary" busy={command.busy} disabled={command.uncertain||!scopeReady||!bindings.data||!!bindings.error||bindings.loading||(!proposal&&!selectedBase)}>{proposal?"Save revision":"Create proposal"}</Button></footer>
    </ValidationFields></form>
  </WorklistPanel>;
}
