import { readRoute } from "../../../../../shared/http";
import { quotationLanding } from "../../../../../shell/landing-reads";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => quotationLanding(p, q));
