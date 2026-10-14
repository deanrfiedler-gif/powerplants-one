import { randomUUID } from "node:crypto";
import {
  createProposal,
  reviewProposal,
} from "../../src/documents/drafts/commands";
import { publicationReadiness } from "../../src/documents/publication/service";
import {
  setupDraft,
  grantDraft,
  draftInput,
  reviewCommand,
  base,
} from "./template-drafts";
import type { Principal } from "../../src/platform/identity";
export async function publicationCommand(p: Principal, id: string) {
  const v = await publicationReadiness(p, id);
  return {
    ...base(),
    id: randomUUID(),
    template_id: randomUUID(),
    expected_version: v.expected_version,
    revision_id: v.revision_id,
    content_hash: v.content_hash,
    review_id: v.review_id,
    runtime_version: v.runtime_version,
    definition_hash: v.definition_hash,
    approval_note:
      "SYN Service approval of exact Internal pack layout and retained mandatory content.",
  };
}
export async function reviewedDraft() {
  const { p, reviewer } = await setupDraft();
  await grantDraft(reviewer, ["template.publish", "pack.check"]);
  const input = await draftInput(p);
  await createProposal(p, input);
  await reviewProposal(
    reviewer,
    input.id,
    await reviewCommand(reviewer, input.id),
  );
  return {
    p,
    publisher: reviewer,
    input,
    command: await publicationCommand(reviewer, input.id),
  };
}
