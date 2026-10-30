import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { hasPermission, requireCapability, scopeSql } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { companyContext, scopedOwner } from "../shared/authority";
import { visible } from "../shared/reads";
import { choice, object, optionalId, label } from "../shared/validation";
import { documentContext, targetContext } from "./context";
import { nativeSource } from "./sources";
import { targetKinds } from "./types";

// All table names are constants. Selection is revalidated by the existing command.
const tables = {Company:"companies",Organisation:"organisations",Site:"sites",Owner:"users",Asset:"assets",
  Project:"projects",WorkOrder:"work_orders",EngineeringPackage:"engineering_packages",JobPackIssue:"pack_issues",ReportIssue:"report_issues"} as const;
export async function libraryOptions(p:Principal,query:Record<string,string> = {}) {
  object(query,["kind","company_id","organisation_id","site_id","document_id","q","after"]);
  const kind=choice(query.kind,"kind",Object.keys(tables) as Array<keyof typeof tables>);
  const company=optionalId(query.company_id,"company_id"),organisation=optionalId(query.organisation_id,"organisation_id"),
    site=optionalId(query.site_id,"site_id"),document=optionalId(query.document_id,"document_id");
  const q=query.q === undefined ? "" : label(query.q,"q",200).toLocaleLowerCase();
  let scan=optionalId(query.after,"after");
  return transaction(async c=>{
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE",[p.workspace_id]);
    await requireCapability(c,p,"document.read");
    const d=document ? (await documentContext(c,p,document)).d : null;
    const items:Array<{id:string;display_name:string;company_id?:string}>=[];
    for (;;) {
      const rows=(await c.query(`SELECT * FROM ppo.${tables[kind]} WHERE workspace_id=$1 AND ($2::uuid IS NULL OR id>$2) ORDER BY id LIMIT 100`,[p.workspace_id,scan])).rows;
      if(!rows.length) return {items,next_after:null,coverage:"PermittedChoices"};
      for(const row of rows) {
        scan=row.id;
        try {
          let title=String(row.display_name ?? row.display_number ?? row.name ?? row.description ?? row.title ?? row.id);
          if(d && (targetKinds as readonly string[]).includes(kind)) {
            await targetContext(c,p,kind as typeof targetKinds[number],row.id,d);
          } else if(kind === "Company" || kind === "Organisation") {
            const companyId=kind === "Company" ? row.id : row.company_id;
            if(company && companyId !== company) continue;
            if(kind === "Organisation") await visible(c,p,"Organisation",row.id);
            // Include a company only when a document/shared read is usable at company or site scope.
            const reachable=(await c.query(`SELECT 1 FROM ppo.companies co LEFT JOIN ppo.sites s ON s.workspace_id=co.workspace_id AND s.company_id=co.id
              WHERE co.workspace_id=$1 AND co.id=$3 AND ${scopeSql("co.id","s.id","document.read")} AND ${scopeSql("co.id","s.id","shared.read")} LIMIT 1`,[p.workspace_id,p.actor_id,companyId])).rowCount;
            if(!reachable) continue;
          } else if(kind === "Site") {
            await visible(c,p,"Site",row.id);
            await companyContext(c,p,row.company_id,row.id,"document.read");
            if(company && row.company_id !== company) continue;
            if(organisation && !(await c.query("SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND site_id=$2 AND organisation_id=$3 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",[p.workspace_id,row.id,organisation])).rowCount) continue;
          } else if(kind === "Owner") {
            if(!company) throw unavailable();
            await companyContext(c,p,company,site,"document.read");
            await scopedOwner(c,p,row.id,company,site ?? undefined,"document.register");
          } else if(kind === "JobPackIssue" || kind === "ReportIssue") {
            if(!company || !organisation) throw unavailable();
            const source=await nativeSource(c,p,kind,row.id);
            if(source.company_id !== company || source.organisation_id !== organisation || source.site_id !== site) continue;
            await companyContext(c,p,company,site,"document.register");
            const parent=kind === "JobPackIssue" ? "packs" : "service_reports",parentId=kind === "JobPackIssue" ? row.pack_id : row.report_id;
            const native=(await c.query(`SELECT display_number FROM ppo.${parent} WHERE workspace_id=$1 AND id=$2`,[p.workspace_id,parentId])).rows[0];
            title=`${native?.display_number ?? kind} · exact issue ${row.id} · ${source.current ? "Current source" : "Historical source"}`;
          } else { throw unavailable(); }
          if(q && !title.toLocaleLowerCase().includes(q)) continue;
          if(items.length===25) return {items,next_after:items.at(-1)!.id,coverage:"PermittedChoices"};
          items.push({id:row.id,display_name:title,...(row.company_id ? {company_id:row.company_id} : {})});
        } catch(e) { if(!(e instanceof AppError && [403,404].includes(e.status))) throw e; }
      }
    }
  });
}

