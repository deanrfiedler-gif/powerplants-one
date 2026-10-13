import { readRoute } from "../../../../../../shared/http";
import { listCostSourceRegister } from "../../../../../../estimating/sources/register";

export const GET = readRoute((p, _id, query) =>
  listCostSourceRegister(p, query),
);
export const dynamic = "force-dynamic";
