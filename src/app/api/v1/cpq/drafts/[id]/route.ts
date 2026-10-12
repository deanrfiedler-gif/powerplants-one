import { readRoute } from "../../../../../../shared/http";
import { readDraft } from "../../../../../../cpq/drafts";
export const GET = readRoute((p, id) => readDraft(p, id!));
