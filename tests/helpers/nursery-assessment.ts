import { nurseryFixture, nurseryCommand } from "./nursery-automation";
import { crmBase } from "./crm";
import { assessmentCase } from "./nursery-assessment-case";
import {
  readNursery,
  saveNursery,
} from "../../src/estimating/nursery-automation/service";
import { readAssessment } from "../../src/estimating/nursery-automation/assessment-service";
export async function assessmentFixture() {
  const f = await nurseryFixture(),
    c = assessmentCase();
  await saveNursery(f.p, f.id, {
    ...nurseryCommand(f.detail),
    proposal: c.source,
  });
  const d = await readAssessment(f.p, f.id);
  return { ...f, ...c, detail: d, nursery: await readNursery(f.p, f.id) };
}
export const assessmentCommand = (
  d: Awaited<ReturnType<typeof readAssessment>>,
) => ({
  ...crmBase(),
  reason: "SYN assessment evidence",
  option_id: d.option.id,
  nursery_revision_id: d.current_source!.id,
  nursery_hash: d.current_source!.content_hash,
  expected_workspace_version: d.workspace.version,
  expected_revision_id: d.current_revision_id,
  rule_edition: d.current_rule_edition,
  proposal: structuredClone(d.proposal!),
});
