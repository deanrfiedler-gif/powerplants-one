import { listTemplates } from "../../../../documents/template-catalogue";
import { readRoute } from "../../../../shared/http";
export const GET = readRoute((p, _id, query) => listTemplates(p, query));
