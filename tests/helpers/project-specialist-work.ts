import { randomUUID } from "node:crypto";
import {
  specialistHandoverFixture,
  handoverAction,
} from "./project-specialist-handover";
import { handoverCommand } from "../../src/engineering/materials/commands";
import { createDocument } from "../../src/library/commands";
import { libraryInput, grantLibrary } from "./library";
export const workAction = (id: string, action = "Accept") => ({
  schema_version: 1,
  operation_id: randomUUID(),
  id,
  action,
  expected_version: 1,
  reason: "SYN bounded work-evidence decision",
  note: "SYN exact scope only; no payment or completion authority",
});
export async function specialistWorkFixture() {
  const f = await specialistHandoverFixture();
  await handoverCommand(f.owner, f.engineering.id, f.prepare);
  await handoverCommand(
    f.owner,
    f.engineering.id,
    handoverAction({
      action: "send",
      handover_id: f.prepare.id,
      expected_version: 1,
    }),
  );
  await handoverCommand(
    f.receiver,
    f.engineering.id,
    handoverAction({
      action: "decide",
      handover_id: f.prepare.id,
      expected_version: 2,
      result: "Accepted",
    }),
  );
  await grantLibrary(f.reviewer, [
    "document.read",
    "project.specialist.work.review",
  ]);
  const document = libraryInput(f.owner.actor_id);
  document.title = "SYN specialist interface work evidence";
  await createDocument(f.owner, document);
  const submit = {
    ...workAction(randomUUID(), "Submit"),
    expected_version: 0,
    handover_id: f.prepare.id,
    document_id: document.id,
    revision_id: document.revision_id,
    reviewer_id: f.reviewer.actor_id,
    scope: "SYN interface schedule checked for section A",
    limitations: "Section B and installed performance remain untested",
    predecessor_id: null as string | null,
  };
  return { ...f, document, submit };
}
