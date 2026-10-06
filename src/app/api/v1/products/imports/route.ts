import { readRoute, commandRoute } from "../../../../../shared/http";
import { listImports } from "../../../../../products/imports";
export const GET = readRoute((p, _id, _q) => listImports(p));
import { stageImport } from "../../../../../products/imports";
export const POST = commandRoute((p, _id, b) => stageImport(p, b), true);
export const dynamic = "force-dynamic";
