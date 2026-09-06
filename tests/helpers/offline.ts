import type { Principal } from "../../src/platform/identity";
import type { WireOperation, Command, Authority, Original } from "../../src/offline/protocol";
import { digest } from "../../src/offline/server";
import { readFieldJob } from "../../src/field/reads";
export function operation(p:Principal,job:Awaited<ReturnType<typeof readFieldJob>>["items"][number],command:Command,payload:Record<string,unknown>,depends_on:string[]=[],target_id:string|null=null):WireOperation {
 const a=job.attendance;
 const authority:Authority=a?{assignment_id:a.assignment_id,assignment_version:a.assignment_version,schedule_version:a.schedule_version,scope_revision_id:a.scope_revision_id,scope_version:a.scope_version,scope_hash:a.scope_hash,issue_id:a.issue_id,issue_hash:a.issue_hash}:{assignment_id:job.assignment.id,assignment_version:job.assignment_version,schedule_version:job.schedule_version,scope_revision_id:job.scope_revision_id,scope_version:job.scope_version,scope_hash:job.scope.hash,issue_id:job.pack!.current_issue_id,issue_hash:job.pack!.output_hash};
 const value:Original={schema_version:1,operation_id:String(payload.operation_id),actor_id:p.actor_id,workspace_id:p.workspace_id,appointment_id:job.id,command,target_id,authority,depends_on,supersedes_operation_id:null,payload};return {...value,payload_hash:digest(value)};
}
export function rehash(op:WireOperation):WireOperation{const {payload_hash:_hash,...value}=op;return {...value,payload_hash:digest(value)};}
