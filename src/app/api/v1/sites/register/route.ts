import { sitesRegister } from "../../../../../shared/sites";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => sitesRegister(p, q));
