// Bounded synthetic navigation fixture; never resets, migrates or changes grants.
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { createSession } from "../src/platform/identity";
import { closeDatabase } from "../src/platform/database";
import { createOpportunity } from "../src/crm/opportunities";
import { createEstimate, prepareQuote, saveEstimate } from "../src/estimating/service";
import { readEstimate } from "../src/estimating/reads";
import { crmCreate, crmBase } from "../tests/helpers/crm";
import { estimateInput, quoteCommand } from "../tests/helpers/estimating";
if (localConfig().database_name !== "ppo_synthetic_test") throw Error("NAV fixtures require ppo_synthetic_test");
try {
  const p = (await createSession("coordinator")).principal, batch = `SYN NAV Window ${randomUUID()}`;
  let older: { estimate: string; quote: string; title: string } | undefined;
  for (let i=0;i<101;i++) {
    const deal = {...crmCreate(), title:`${batch} deal ${i}`}; await createOpportunity(p,deal);
    const input = {...estimateInput(deal.id),title:`${batch} estimate ${i}`}; await createEstimate(p,input);
    if(i===0) {
      const saved=await readEstimate(p,input.id), q=quoteCommand(saved.saved);
      await prepareQuote(p,input.id,q); older={estimate:input.id,quote:q.id,title:input.title};
    }
  }
  const deal={...crmCreate(),title:"SYN NAV shareable Deal sections"};await createOpportunity(p,deal);
  const input=estimateInput(deal.id);await createEstimate(p,input);
  const original=(await readEstimate(p,input.id)).saved;
  await saveEstimate(p,input.id,{...crmBase(),expected_version:1,title:"SYN NAV successor estimate",scope:input.scope,lines:input.lines,policy:input.policy});
  await mkdir("verification-evidence/navigation",{recursive:true});
  await writeFile("verification-evidence/navigation/commercial-fixture.json",JSON.stringify({batch,older,deal:deal.id,estimate:input.id,original_version:original.id},null,2));
} finally { await closeDatabase(); }
