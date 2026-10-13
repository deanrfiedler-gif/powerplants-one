import { projectRegister } from "../../../../../projects/register";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => projectRegister(p, q));
