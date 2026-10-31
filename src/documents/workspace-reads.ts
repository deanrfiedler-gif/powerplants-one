import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { hasPermission, requireCapability, type QueryClient } from "../platform/permissions";
import { AppError } from "../platform/errors";
import { page } from "../shared/reads";
import { choice, object, uuid, invalid } from "../shared/validation";
import { workingCompanyFor } from "../platform/working-company";
import { scopeAuthority, type Proposal, type Revision } from "./drafts/context";
import { families } from "./drafts/validation";
import { publicationContext } from "./publication/service";

// Names are a presentation of already-authorised native scopes and attribution,
// never a separate directory or a grant of command authority.
export async function scopePresentation(c: QueryClient, p: Principal, scope: { company_id: string; site_id: string }) {
  const row = (await c.query(`SELECT co.name AS company_name,s.display_name AS site_name,s.timezone
    FROM ppo.sites s JOIN ppo.companies co ON (co.workspace_id,co.id)=(s.workspace_id,s.company_id)
    WHERE s.workspace_id=$1 AND s.company_id=$2 AND s.id=$3`, [p.workspace_id,scope.company_id,scope.site_id])).rows[0];
  return row ?? { company_name: null, site_name: null, timezone: null };
}
export async function proposalPresentation(c: QueryClient, p: Principal, d: Proposal, r: Revision) {
  const publication = (await c.query(`SELECT id AS publication_id,template_id,runtime_version FROM ppo.template_publications
    WHERE workspace_id=$1 AND proposal_id=$2 AND revision_id=$3`, [p.workspace_id,d.id,r.id])).rows[0];
  const contributor = !!(await c.query("SELECT 1 FROM ppo.template_proposal_revisions WHERE workspace_id=$1 AND proposal_id=$2 AND created_by=$3", [p.workspace_id,d.id,p.actor_id])).rowCount;
  const can = (cap: Parameters<typeof hasPermission>[2]) => hasPermission(c,p,cap,d.company_id,d.site_id);
  const current = r.id === d.current_revision_id;
  const actor = (await c.query("SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2", [p.workspace_id,r.created_by])).rows[0];
  return {
    ...await scopePresentation(c,p,d), actor_name: actor?.display_name ?? null,
    publication_id: publication?.publication_id ?? null,
    template_id: publication?.template_id ?? null,
    runtime_version: publication?.runtime_version ?? null,
    permissions: {
      is_contributor: contributor,
      can_revise: current && await can("template.propose"),
      can_review: current && !contributor && await can("template.review"),
      can_publish: current && !contributor && d.family === "OUT-09" && await can("template.publish") && await can("pack.check"),
    },
  };
}
function paging(p: Principal, q: Record<string,string>, target: string) {
  if (q.limit !== undefined && (!/^[1-9][0-9]*$/.test(q.limit) || Number(q.limit)>50)) invalid("limit","Use 1–50 rows.");
  return page({limit:q.limit,cursor:q.cursor},{catalogue:"DK-06-workspace",actor:p.actor_id,workspace:p.workspace_id,company:workingCompanyFor(p.actor_id),target});
}
const hidden = (e: unknown) => e instanceof AppError && [403,404].includes(e.status);
export async function readTemplateScopes(p: Principal,q: Record<string,string>) {
  object(q,["family","limit","cursor"]);
  const family=choice(q.family,"family",families), pg=paging(p,q,`scopes:${family}`);
  return transaction(async c=>{
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE",[p.workspace_id]);
    await requireCapability(c,p,"template.read");
    const items: {id:string;company_id:string;site_id:string;company_name:string|null;site_name:string|null;timezone:string|null;can_propose:boolean;can_assign:boolean}[]=[];
    let after=pg.after;
    while(items.length<=pg.limit) {
      const rows=(await c.query("SELECT id,company_id FROM ppo.sites WHERE workspace_id=$1 AND ($2::uuid IS NULL OR id>$2) ORDER BY id LIMIT 100",[p.workspace_id,after])).rows;
      for(const row of rows) {
        after=row.id;
        const scope={family,company_id:row.company_id,site_id:row.id};
        try { await scopeAuthority(c,p,scope); } catch(e) { if(hidden(e)) continue; throw e; }
        items.push({id:row.id,...scope,...await scopePresentation(c,p,scope),
          can_propose:await hasPermission(c,p,"template.propose",scope.company_id,scope.site_id),
          can_assign:family==="OUT-09" && await hasPermission(c,p,"template.assign",scope.company_id,scope.site_id) && await hasPermission(c,p,"pack.check",scope.company_id,scope.site_id)});
        if(items.length>pg.limit) break;
      }
      if(rows.length<100) break;
    }
    const selected=items.slice(0,pg.limit);
    for(const row of selected) await scopeAuthority(c,p,{...row,family});
    return {synthetic:true,items:selected,next_cursor:items.length>pg.limit?pg.cursor(selected.at(-1)!.id):null,completeness:items.length>pg.limit?"Partial":"Complete",scope:"CurrentPermittedTemplateSites"};
  });
}
export async function listPublications(p: Principal,q: Record<string,string>) {
  object(q,["company_id","site_id","limit","cursor"]);
  const scope={family:"OUT-09" as const,company_id:uuid(q.company_id,"company_id"),site_id:uuid(q.site_id,"site_id")};
  const pg=paging(p,q,`publications:${scope.company_id}:${scope.site_id}`);
  return transaction(async c=>{
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE",[p.workspace_id]);
    await scopeAuthority(c,p,scope);
    const items: {id:string;template_id:string;runtime_version:number;definition_hash:string;title:string;revision_id:string;proposal_id:string}[]=[];
    let after=pg.after;
    while(items.length<=pg.limit) {
      const rows=(await c.query(`SELECT pub.id FROM ppo.template_publications pub JOIN ppo.template_proposals d
        ON (d.workspace_id,d.id)=(pub.workspace_id,pub.proposal_id)
        WHERE pub.workspace_id=$1 AND d.company_id=$2 AND d.site_id=$3 AND ($4::uuid IS NULL OR pub.id>$4) ORDER BY pub.id LIMIT 100`,[p.workspace_id,scope.company_id,scope.site_id,after])).rows;
      for(const row of rows) {
        after=row.id;
        try {
          const pub=await publicationContext(c,p,row.id);
          items.push({id:pub.id,template_id:pub.template_id,runtime_version:pub.runtime_version,definition_hash:pub.definition_hash,title:pub.proposal_snapshot?.body?.title ?? `Job pack version ${pub.runtime_version}`,revision_id:pub.revision_id,proposal_id:pub.proposal_id});
        } catch(e) { if(!hidden(e)) throw e; }
        if(items.length>pg.limit) break;
      }
      if(rows.length<100) break;
    }
    const selected=items.slice(0,pg.limit);
    for(const row of selected) await publicationContext(c,p,row.id);
    await scopeAuthority(c,p,scope);
    return {synthetic:true,items:selected,next_cursor:items.length>pg.limit?pg.cursor(selected.at(-1)!.id):null,completeness:items.length>pg.limit?"Partial":"Complete",scope:"CurrentPermittedPublications"};
  });
}
