// Real domain fixture; bounded to the task's disposable synthetic database.
import { mkdir, writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { closeDatabase } from "../src/platform/database";
import { financeDraft } from "../tests/helpers/finance";
if (localConfig().database_name!=="ppo_synthetic_test") throw Error("NAV fixtures require ppo_synthetic_test");
try {
  const f=await financeDraft();
  const source=f.q.report.revisions[0].snapshot.work;
  await mkdir("verification-evidence/navigation",{recursive:true});
  await writeFile("verification-evidence/navigation/finance-fixture.json",JSON.stringify({report:f.q.report.id,handoff:f.id,work:source.id,profile:"finance",combined_report_finance_persona:false},null,2));
}finally{await closeDatabase();}
