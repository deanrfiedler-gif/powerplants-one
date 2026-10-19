import { organisationRegister } from "../../../../../shared/organisation-register";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => organisationRegister(p, q));
