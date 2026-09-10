import { readRoute } from "../../../../../shared/http";
import { readDirectory } from "../../../../../crm/directory";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => readDirectory(p, q));
