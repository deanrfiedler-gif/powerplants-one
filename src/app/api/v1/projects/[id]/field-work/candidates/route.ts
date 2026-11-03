import { fieldWorkCandidates } from "../../../../../../../service/project-field-work";
import { readRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => fieldWorkCandidates(p, id, q));
