import { readTemplate } from "../../../../../documents/template-catalogue";
import { readRoute } from "../../../../../shared/http";
export const GET = readRoute(readTemplate);
