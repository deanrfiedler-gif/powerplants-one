import { dueFields } from "../activities/activities";
import { choice, common, commonKeys, label, narrative, object, optionalId, optionalNarrative, uuid, version, invalid } from "../shared/validation";
export const SALES_KINDS = ["CustomerContact","RelationshipReview"] as const;
export function parseAction(value: unknown) {
  const r=object(value,["id","owner_id","kind","summary","due_at","due_needed"]);
  return {id:uuid(r.id,"activity_id"),owner_id:uuid(r.owner_id,"activity_owner_id"),kind:choice(r.kind,"kind",SALES_KINDS),summary:narrative(r.summary,"activity_summary",2000),...dueFields(r)};
}
export function parseCreate(value: unknown) {
  const r=object(value,[...commonKeys,"id","company_id","organisation_id","site_id","primary_person_id","site_unknown_reason","contact_unknown_reason","title","need_summary","source_channel","source_basis","owner_id","pipeline_definition_id","initial_action"]);
  const site_id=optionalId(r.site_id,"site_id"),primary_person_id=optionalId(r.primary_person_id,"primary_person_id"),site_unknown_reason=optionalNarrative(r.site_unknown_reason,"site_unknown_reason",1000),contact_unknown_reason=optionalNarrative(r.contact_unknown_reason,"contact_unknown_reason",1000);
  if ((site_id===null)!==(site_unknown_reason!==null)) invalid("site_unknown_reason","Explain an unknown site, or select a site and clear its unknown reason.");
  if ((primary_person_id===null)!==(contact_unknown_reason!==null)) invalid("contact_unknown_reason","Explain an unknown contact, or select a contact and clear its unknown reason.");
  return {...common(r),id:uuid(r.id,"id"),company_id:uuid(r.company_id,"company_id"),organisation_id:uuid(r.organisation_id,"organisation_id"),site_id,primary_person_id,site_unknown_reason,contact_unknown_reason,title:label(r.title,"title",200),need_summary:narrative(r.need_summary,"need_summary",2000),source_channel:choice(r.source_channel,"source_channel",["Phone","Email","Meeting","Referral","Other"] as const),source_basis:narrative(r.source_basis,"source_basis",1000),owner_id:uuid(r.owner_id,"owner_id"),pipeline_definition_id:uuid(r.pipeline_definition_id,"pipeline_definition_id"),initial_action:parseAction(r.initial_action)};
}
export function parseQualification(id: string,value: unknown) {
  const r=object(value,[...commonKeys,"expected_version","pipeline_definition_id","need_summary","qualification_note","identification_activity_id"]);
  return {...common(r),id:uuid(id,"id"),expected_version:version(r.expected_version),pipeline_definition_id:uuid(r.pipeline_definition_id,"pipeline_definition_id"),need_summary:narrative(r.need_summary,"need_summary",2000),qualification_note:narrative(r.qualification_note,"qualification_note",2000),identification_activity_id:optionalId(r.identification_activity_id,"identification_activity_id")};
}
export function parsePlan(id: string,value: unknown) {
  const r=object(value,[...commonKeys,"expected_version","activity_id","new_action"]);
  const activity_id=optionalId(r.activity_id,"activity_id");
  if ((activity_id!==null)===(r.new_action!=null)) invalid("activity_id","Choose an existing active action or provide one new action.");
  return {...common(r),id:uuid(id,"id"),expected_version:version(r.expected_version),activity_id,new_action:r.new_action==null?null:parseAction(r.new_action)};
}
