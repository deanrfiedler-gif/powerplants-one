import { commandRoute } from "../../../../../../../shared/http";
import { decideImport } from "../../../../../../../products/imports";
export const POST = commandRoute((p, id, b) => decideImport(p, id, b), false);
export const dynamic = "force-dynamic";
