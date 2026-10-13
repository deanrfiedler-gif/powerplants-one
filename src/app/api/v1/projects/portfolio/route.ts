import { readRoute } from "../../../../../shared/http";
import { readPortfolio } from "../../../../../projects/portfolio";
export const runtime = "nodejs";
export const GET = readRoute((p, _id, q) => readPortfolio(p, q));
