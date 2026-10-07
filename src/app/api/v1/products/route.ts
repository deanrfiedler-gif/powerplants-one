import { readRoute, commandRoute } from "../../../../shared/http";
import { listProducts } from "../../../../products/reads";
export const GET = readRoute((p, _id, q) => listProducts(p, q));
import { createProduct } from "../../../../products/commands";
export const POST = commandRoute((p, _id, b) => createProduct(p, b), true);
export const dynamic = "force-dynamic";
