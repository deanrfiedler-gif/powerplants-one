import { randomUUID } from "node:crypto";
import { CRM, crmBase } from "./crm";
import type { CostLine } from "../../src/estimating/math";
export const manualLines=():CostLine[]=>[
  {id:randomUUID(),description:"SYN Controller assembly",category:"Product",quantity:"2",unit:"each",unit_cost:"120",unit_sell:"175",source:"SYN private supplier cost note — internal only",effective_date:"2026-09-01"},
  {id:randomUUID(),description:"SYN Installation labour",category:"Labour",quantity:"4",unit:"hour",unit_cost:"50",unit_sell:"80",source:"SYN internal labour assumption",effective_date:"2026-09-01"},
  {id:randomUUID(),description:"SYN Freight",category:"Freight",quantity:"1",unit:"shipment",unit_cost:"40",unit_sell:"50",source:"SYN internal freight allowance",effective_date:"2026-09-01"},
];
export const estimateInput=(opportunity_id:string)=>({...crmBase(),id:randomUUID(),opportunity_id,owner_id:CRM.owner,title:"SYN Controls estimate",scope:{included:"Supply controls and installation described below.",excluded:"Civil works and live ERP transactions are excluded.",assumptions:"Fictional manual prices for private review; site scope to be confirmed."},lines:manualLines(),policy:"SYN-EST-ARITHMETIC-01"});
export const quoteCommand=(version:{id:string;lines:CostLine[]},expected_version=1,expected_quote_version=0)=>({...crmBase(),id:randomUUID(),estimate_version_id:version.id,expected_version,expected_quote_version,choices:version.lines.map(l=>({line_id:l.id,included:true,print:l.category!=="Labour"}))});
