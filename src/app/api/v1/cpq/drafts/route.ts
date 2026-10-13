import { readRoute, commandRoute } from "../../../../../shared/http";
import { listDrafts, saveDraft } from "../../../../../cpq/drafts";
export const GET = readRoute((p, _id, q) => listDrafts(p, q));
export const POST = commandRoute((p, _id, v) => saveDraft(p, v));
