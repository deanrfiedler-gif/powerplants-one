import { readRoute, commandRoute } from "../../../../../../shared/http";
import { productPricing } from "../../../../../../products/reads";
export const GET = readRoute((p, id, q) => productPricing(p, id, q));
import { bindProductSource } from "../../../../../../products/commands";
export const POST = commandRoute(
  (p, id, b) => bindProductSource(p, id, b),
  false,
);
export const dynamic = "force-dynamic";
