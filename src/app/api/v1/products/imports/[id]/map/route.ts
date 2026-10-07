import { commandRoute } from "../../../../../../../shared/http";
import { mapImport } from "../../../../../../../products/imports";
export const POST = commandRoute((p, id, b) => mapImport(p, id, b), false);
export const dynamic = "force-dynamic";
