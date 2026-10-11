import { readRoute } from "../../../../../../shared/http";
import { readImport } from "../../../../../../products/imports";
export const GET = readRoute((p, id, _q) => readImport(p, id));
export const dynamic = "force-dynamic";
