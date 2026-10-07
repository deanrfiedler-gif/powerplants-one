// Source/discovery map only. This does not execute or accept a browser journey.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { destinations, departmentRails, pageForPath, railDestinationForLocation, type WorkspaceId } from "../src/shell/navigation";
const register=JSON.parse(await readFile("docs/design/development/register.json","utf8"));
const routes=register.entries.filter((e:{key:string;path:string|null})=>e.key.startsWith("route:")&&e.path);
const id="10000000-0000-4000-8000-000000000001";
const rows=routes.map((e:{key:string;path:string;source_paths:string[]})=>{
  const sample=e.path.replace(/\[[^\]]+\]/g,id),page=pageForPath(sample),workspace=page?.workspace;
  const parent=workspace?railDestinationForLocation(sample,new URLSearchParams(),workspace):undefined;
  const record=e.path.includes("[");
  const discovery=e.path==="/"?"Home / logo / fixed post-login start":e.path==="/login"?"Authentication boundary":e.path.startsWith("/offline")?"Local field originals/recovery only":record?"Owning register / module view / contextual source action":workspace?`${workspace}: ${parent??page?.id??"module"} rail or module view; More > Workspace`:"Shared/personal More or exact contextual source";
  return {key:e.key,pattern:e.path,canonical_pattern:e.path,workspace:workspace??"Shared/personal/support",parent_destination:parent??page?.id??null,breadcrumb_fallback:page?.label??"Boundary / unavailable",discovery,availability:page?.readiness??"Boundary",capabilities:{all:page?.requiresAll??[],any:page?.requiresAny??page?.requires??[]},source:e.source_paths,server_authorization:"Owning scoped reader/command; discovery is not authority"};
});
const aliases=["/crm/leads","/crm/leads/[id]","/crm/opportunities","/crm/opportunities/[id]","/crm/opportunities/new"].map(pattern=>({pattern,canonical_pattern:pattern.replace("/crm/","/sales/"),contract:"Existing redirect preserves its supported query state; no Equipment/Activity alias added"}));
const result={source_commit:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),evidence_kind:"Static current source map; browser results separate",routes:rows,compatibility_aliases:aliases,destinations:destinations.map(d=>({...d,rail_consumers:Object.entries(departmentRails).filter(([,ids])=>ids.includes(d.id)).map(([workspace])=>workspace as WorkspaceId)}))};
await mkdir("docs/testing/evidence/navigation",{recursive:true});
await writeFile("docs/testing/evidence/navigation/route-discovery-map.json",JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({canonical_routes:rows.length,aliases:aliases.length,destinations:destinations.length,available_hrefs:destinations.filter(d=>d.href).length,unavailable:destinations.filter(d=>d.readiness==="unavailable").length}));
