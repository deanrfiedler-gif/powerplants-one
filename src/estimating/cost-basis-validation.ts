import { common, commonKeys, object, uuid, version, invalid, label } from "../shared/validation";
import { canonical } from "../platform/operations";
import { parseLines, policy, scope } from "./validation";
export function costingProposal(value: unknown) {
  const r=object(value,["option_id","revision_id"]);
  return {option_id:uuid(r.option_id,"option_id"),revision_id:uuid(r.revision_id,"revision_id")};
}
export function costingInput(id:string,value:unknown) {
  if(Buffer.byteLength(canonical(value)??"","utf8")>65536)invalid("payload","Keep the reviewed costing request within 64 KiB.");
  const r=object(value,[...commonKeys,"estimate_id","option_id","revision_id","expected_workspace_version","expected_estimate_version","context_hash","title","scope","lines","policy"]);
  if(!Number.isSafeInteger(r.expected_estimate_version)||Number(r.expected_estimate_version)<0)invalid("expected_estimate_version","Use the current saved cost version, or zero before first costing.");
  if(typeof r.context_hash!=="string"||!/^[a-f0-9]{64}$/.test(r.context_hash))invalid("context_hash","Review the current scope context before saving.");
  return {...common(r),id:uuid(id,"workspace_id"),...costingProposal({option_id:r.option_id,revision_id:r.revision_id}),
    estimate_id:uuid(r.estimate_id,"estimate_id"),expected_workspace_version:version(r.expected_workspace_version),expected_estimate_version:Number(r.expected_estimate_version),context_hash:r.context_hash,
    title:label(r.title,"title",200),scope:scope(r.scope),lines:parseLines(r.lines,2),policy:policy(r.policy)};
}
