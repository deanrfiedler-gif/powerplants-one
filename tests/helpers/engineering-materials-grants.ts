import assert from "node:assert/strict";

// Seed 29 (EN-06) is the first seed since 0020 to add permission grants, seed 30 (EN-07) is the second and seed 31
// (EN-08) the third, so an upgrade proof that snapshots ppo.permission_grants from a version where the coordinators
// already hold the Projects and Engineering capabilities (18 or later) expects exactly these three sets and nothing
// else. They mirror db/seed-engineering-materials.sql, db/seed-engineering-changes.sql and
// db/seed-commissioning-as-built.sql.
type Grant = Record<string, unknown>;

const coordinator = "30000000-0000-4000-8000-000000000001", secondCompany = "30000000-0000-4000-8000-000000000008";
const companyA = "20000000-0000-4000-8000-000000000001";
const profiles = { author: "30000000-0000-4000-8000-000000000016", engineer: "30000000-0000-4000-8000-000000000017", reviewer: "30000000-0000-4000-8000-000000000018",
  release: "30000000-0000-4000-8000-000000000019", supply: "30000000-0000-4000-8000-000000000020", viewer: "30000000-0000-4000-8000-000000000021" };
const reads = ["shared.read", "shared.internal.read", "project.read", "engineering.read"];
const duties: [string, string][] = [[profiles.reviewer, "engineering.material.review"], [profiles.release, "engineering.material.release"], [profiles.supply, "engineering.material.receive"]];

function seed29Grants(original: Grant[], at: Date): Grant[] {
  const time = (v: unknown) => new Date(v as string | Date).getTime();
  const live = (g: Grant) => time(g.valid_from) <= at.getTime() && (g.valid_to === null || time(g.valid_to) > at.getTime());
  const own = original.filter(g => g.user_id === coordinator && g.company_id === companyA && g.scope_type === "Company" && live(g));
  return [
    ...own.filter(g => reads.includes(String(g.capability))).flatMap(g => Object.values(profiles).map(user_id => ({ ...g, user_id }))),
    ...own.filter(g => g.capability === "engineering.edit").flatMap(g => [profiles.author, profiles.engineer].map(user_id => ({ ...g, user_id }))),
    ...own.filter(g => g.capability === "engineering.read").flatMap(g => duties.map(([user_id, capability]) => ({ ...g, user_id, capability }))),
    ...original.filter(g => [coordinator, secondCompany].includes(String(g.user_id)) && g.capability === "engineering.edit" && live(g))
      .map(g => ({ ...g, capability: "engineering.material.source" })),
  ];
}

// Seed 30 (EN-07): three more fictional profiles read Company A through copies of the coordinator's own scope, nobody
// gains engineering.edit, and review, technical decision, closure, receiving and verification are one capability each,
// held only where the seed names the person. The coordinator receives for Projects, so one grant is their own.
const changeProfiles = { releaseOwner: "30000000-0000-4000-8000-000000000022", service: "30000000-0000-4000-8000-000000000023", verifier: "30000000-0000-4000-8000-000000000024" };
const changeDuties: [string, string][] = [[profiles.reviewer, "engineering.change.review"], [profiles.release, "engineering.change.decide"], [profiles.release, "engineering.change.close"],
  [profiles.supply, "engineering.change.receive"], [changeProfiles.releaseOwner, "engineering.change.receive"], [changeProfiles.service, "engineering.change.receive"],
  [changeProfiles.verifier, "engineering.change.receive"], [changeProfiles.verifier, "engineering.change.verify"], [coordinator, "engineering.change.receive"]];
function seed30Grants(original: Grant[], at: Date): Grant[] {
  const time = (v: unknown) => new Date(v as string | Date).getTime();
  const live = (g: Grant) => time(g.valid_from) <= at.getTime() && (g.valid_to === null || time(g.valid_to) > at.getTime());
  const own = original.filter(g => g.user_id === coordinator && g.company_id === companyA && g.scope_type === "Company" && live(g));
  return [
    ...own.filter(g => reads.includes(String(g.capability))).flatMap(g => Object.values(changeProfiles).map(user_id => ({ ...g, user_id }))),
    ...own.filter(g => g.capability === "engineering.read").flatMap(g => changeDuties.map(([user_id, capability]) => ({ ...g, user_id, capability }))),
  ];
}

// Seed 31 (EN-08): one more fictional profile, the Equipment receiver, reads Company A through copies of the
// coordinator's own scope; nobody gains engineering.edit; capture, evidence review, issue and receiving are one
// capability each, held only where the seed names the person, and the coordinator's own is for the Projects destination.
// The two preparers, the reviewer and the performer also gain the My Work action pair, because an owned follow-up is
// one activity and seeds 29 and 30 gave none of them activity.read or activity.edit. All three inserts copy the
// coordinator's engineering.read row (the reads copy their own), so every added row carries that scope and validity.
const commissioningProfiles = { equipment: "30000000-0000-4000-8000-000000000025" };
const commissioningDuties: [string, string][] = [[changeProfiles.verifier, "engineering.commissioning.capture"], [profiles.reviewer, "engineering.commissioning.review"],
  [profiles.release, "engineering.commissioning.issue"], [changeProfiles.service, "engineering.commissioning.receive"],
  [commissioningProfiles.equipment, "engineering.commissioning.receive"], [coordinator, "engineering.commissioning.receive"]];
const followUpOwners = [profiles.author, profiles.engineer, profiles.reviewer, changeProfiles.verifier];
function seed31Grants(original: Grant[], at: Date): Grant[] {
  const time = (v: unknown) => new Date(v as string | Date).getTime();
  const live = (g: Grant) => time(g.valid_from) <= at.getTime() && (g.valid_to === null || time(g.valid_to) > at.getTime());
  const own = original.filter(g => g.user_id === coordinator && g.company_id === companyA && g.scope_type === "Company" && live(g));
  return [
    ...own.filter(g => reads.includes(String(g.capability))).flatMap(g => Object.values(commissioningProfiles).map(user_id => ({ ...g, user_id }))),
    ...own.filter(g => g.capability === "engineering.read").flatMap(g => [
      ...commissioningDuties.map(([user_id, capability]) => ({ ...g, user_id, capability })),
      ...followUpOwners.flatMap(user_id => ["activity.read", "activity.edit"].map(capability => ({ ...g, user_id, capability }))),
    ]),
  ];
}

// Seed 32: only named acceptance duties and the necessary existing Project/Activity reads.
export function acceptanceSeedGrants(original: Grant[], alreadyAdded: Grant[]): Grant[] {
 const id=(n:number)=>`30000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
 const assignments:[number,string[]][]=[
 [1,['scope','submit','prepare','issue','response.record','close.stage','close.project','reopen','source']],
 [16,['scope','submit','prepare','response.record']],[17,['scope','submit','prepare','response.record']],
 [18,['technical','response.validate','close.stage','close.project','reopen']],[19,['issue']],[23,['receive']],[12,['commercial','source']]];
 const own=original.filter(g=>g.user_id===coordinator&&g.company_id===companyA&&g.scope_type==='Company');
 const project=own.find(g=>g.capability==='project.read')??alreadyAdded.find(g=>g.user_id===coordinator&&g.company_id===companyA&&g.capability==='project.read');
 assert(project,'The earlier Project seed provides the source scope');
 const proposals=[...assignments.flatMap(([n,caps])=>caps.map(capability=>({...project,user_id:id(n),capability:'acceptance.'+capability}))),
 ...[16,17,18,19,23,12].flatMap(n=>['project.read','shared.read','shared.internal.read','activity.read','activity.edit','engineering.read'].map(capability=>{
  const g=own.find(g=>g.capability===capability)??alreadyAdded.find(g=>g.user_id===coordinator&&g.company_id===companyA&&g.capability===capability);assert(g);return {...g,user_id:id(n),capability};}))];
 const key=(g:Grant)=>[g.workspace_id,g.user_id,g.capability,g.scope_type,g.scope_id].join(':');
 const seen=new Set([...original,...alreadyAdded].map(key));
 return proposals.filter(g=>{if(seen.has(key(g)))return false;seen.add(key(g));return true;});
}

/** Every earlier grant survives byte for byte, revoked ones included, and the only additions are those of seeds 29, 30 and 31. */
export function assertOnlyEngineeringSeedGrantsAdded(original: Grant[], upgraded: Grant[], at = new Date()) {
  const ids = new Set(original.map(g => g.id));
  assert.deepEqual(upgraded.filter(g => ids.has(g.id)), original);
  // An exact allowlist: an unrelated new grant must fail, even if its scope matches an old grant.
  const sorted = (gs: Grant[]) => gs.map(g => JSON.stringify(Object.fromEntries(Object.entries(g).filter(([k]) => k !== "id")))).sort();
  const materials = seed29Grants(original, at), changes = seed30Grants(original, at), commissioning = seed31Grants(original, at);
  const earlier = [...materials, ...changes, ...commissioning];
  const customerReview=original.filter(g=>g.user_id===coordinator&&g.company_id===companyA&&g.scope_type==="Company"&&["shared.read","shared.edit","shared.internal.read","activity.read"].includes(String(g.capability))).map(g=>({...g,user_id:"c5010044-0000-4000-8000-000000000001"}));
  assert.equal(customerReview.length,4);
  const technical = original.filter(g=>g.user_id===coordinator&&g.company_id===companyA&&g.scope_type==="Company"&&g.capability==="engineering.read").flatMap(g=>[[profiles.reviewer,"engineering.technical.review"],[profiles.release,"engineering.technical.issue"],[profiles.release,"engineering.technical.distribute"],[coordinator,"engineering.technical.source"]].map(([user_id,capability])=>({...g,user_id,capability})));
  assert.equal(technical.length,4);
  const expected=[...earlier,...acceptanceSeedGrants(original,earlier),...customerReview,...technical];
  assert.equal(materials.length, 31);
  assert.equal(changes.length, 21); // twelve reads for three profiles and nine duty grants
  assert.equal(commissioning.length, 18); // four reads for one profile, six duty grants and eight My Work action grants
  assert.deepEqual(sorted(upgraded.filter(g => !ids.has(g.id))), sorted(expected));
}
