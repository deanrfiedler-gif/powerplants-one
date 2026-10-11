import { commandRoute } from "../../../../../../shared/http";
import { decideProduct } from "../../../../../../products/commands";
export const POST = commandRoute((p, id, b) => decideProduct(p, id, b), false);
export const dynamic = "force-dynamic";
