import { readRoute } from "../../../../../shared/http";
import { accountLanding } from "../../../../../shell/landing-reads";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => accountLanding(p, q));
