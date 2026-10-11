import { readRoute, commandRoute } from "../../../../../shared/http";
import { readProduct } from "../../../../../products/reads";
export const GET = readRoute((p, id, q) => readProduct(p, id, q));
import { reviseProduct } from "../../../../../products/commands";
export const POST = commandRoute((p, id, b) => reviseProduct(p, id, b), false);
export const dynamic = "force-dynamic";
