import { peopleRegister } from "../../../../../shared/people-register";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => peopleRegister(p, q));
