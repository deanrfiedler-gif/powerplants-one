import { readRoute } from "../../../../../shared/http";
import { object } from "../../../../../shared/validation";
import { readSettings } from "../../../../../admin/settings";
export const GET = readRoute((p,id,query) => { object(query, []); return readSettings(p); });
