import { dispatchReadiness } from "../documents/packs";
import type { Principal } from '../platform/identity';
import { type Capability,type QueryClient,requireCapability,hasPermission } from '../platform/permissions';
import { unavailable,AppError } from '../platform/errors';
import { visibleAppointment } from '../scheduling/planner';
import { scopeDetail } from '../service/work-orders';
import { visible } from '../shared/reads';
import { uuid } from '../shared/validation';
export async function fieldContext(c:QueryClient,p:Principal,id:string,cap:Capability='field.read.own'){
 await requireCapability(c,p,cap);const {a,w}=await visibleAppointment(c,p,id,cap);
 if(!(await hasPermission(c,p,'field.read.own',a.company_id,a.site_id)))throw unavailable();
 const assignment=(await c.query('SELECT x.id,x.assignment_version,x.resource_id,x.crew_role,r.name FROM ppo.assignments x JOIN ppo.resources r ON (r.workspace_id,r.id)=(x.workspace_id,x.resource_id) WHERE x.workspace_id=$1 AND x.appointment_id=$2 AND x.active AND x.assignment_version=$3 AND r.user_id=$4 AND r.active',[p.workspace_id,a.id,a.assignment_version,p.actor_id])).rows[0];if(!assignment)throw unavailable();
 const r=await scopeDetail(c,p,w,a.scope_revision_id);return {a,w,r,assignment};
}
export async function attendanceContext(c:QueryClient,p:Principal,appointment:string,attendanceId:string,cap:Capability='field.capture.own'){
 const ctx=await fieldContext(c,p,appointment,cap);const attendance=(await c.query('SELECT * FROM ppo.field_attendances WHERE workspace_id=$1 AND appointment_id=$2 AND actor_id=$3 AND id=$4',[p.workspace_id,appointment,p.actor_id,uuid(attendanceId,'attendance_id')])).rows[0];if(!attendance)throw unavailable();return {...ctx,attendance};
}
export async function entryContext(c:QueryClient,p:Principal,id:string,cap:Capability='field.read.own'){
 await requireCapability(c,p,cap);const entry=(await c.query('SELECT * FROM ppo.field_entries WHERE workspace_id=$1 AND id=$2',[p.workspace_id,uuid(id,'entry_id')])).rows[0];if(!entry)throw unavailable();const ctx=await fieldContext(c,p,entry.appointment_id,cap);if(cap==='field.correct.own'&&entry.actor_id!==p.actor_id)throw unavailable();return {...ctx,entry};
}
export async function attachmentContext(c:QueryClient,p:Principal,id:string,mutate=false){
 const cap=mutate?'field.attachment.own':'field.read.own';await requireCapability(c,p,cap);const attachment=(await c.query("SELECT * FROM ppo.field_attachments WHERE workspace_id=$1 AND id=$2 AND access_class='RestrictedService'",[p.workspace_id,uuid(id,'attachment_id')])).rows[0];if(!attachment)throw unavailable();const ctx=await fieldContext(c,p,attachment.appointment_id,cap);if(mutate&&attachment.actor_id!==p.actor_id)throw unavailable();return {...ctx,attachment};
}
export async function currentCaptureState(c:QueryClient,p:Principal,ctx:Awaited<ReturnType<typeof attendanceContext>>){
 const pack=(await c.query('SELECT * FROM ppo.packs WHERE workspace_id=$1 AND appointment_id=$2',[p.workspace_id,ctx.a.id])).rows[0];const readiness=await dispatchReadiness(c,p,ctx.a.id,true);return readiness.component_ready&&ctx.a.status==='InProgress'&&!ctx.a.dispatch_hold&&pack?.status==='Issued'&&!pack.needs_review&&pack.current_issue_id===ctx.attendance.issue_id&&ctx.w.scope_revision_id===ctx.attendance.scope_revision_id&&ctx.w.authorised_scope_revision_id===ctx.attendance.scope_revision_id?'Current':'ReviewRequired';
}
export async function attribution(c:QueryClient,p:Principal,ctx:Awaited<ReturnType<typeof attendanceContext>>,item:string|null,asset:string|null,required:boolean){
 if(required&&!item)throw new AppError(422,'AttributionRequired','Choose the original authorised task for this evidence.');
 if(item&&!(await c.query('SELECT 1 FROM ppo.scope_items WHERE workspace_id=$1 AND scope_revision_id=$2 AND id=$3',[p.workspace_id,ctx.attendance.scope_revision_id,item])).rowCount)throw unavailable();
 if(asset){await visible(c,p,'Asset',asset);if(!item||!(await c.query('SELECT 1 FROM ppo.scope_assets WHERE workspace_id=$1 AND scope_item_id=$2 AND asset_id=$3',[p.workspace_id,item,asset])).rowCount)throw unavailable();}
 if(item&&required){const assets=(await c.query('SELECT asset_id FROM ppo.scope_assets WHERE workspace_id=$1 AND scope_item_id=$2',[p.workspace_id,item])).rows;if(assets.length&&!asset)throw new AppError(422,'AttributionRequired','Choose the affected asset from this task. Its identity status remains unchanged.');}
}
