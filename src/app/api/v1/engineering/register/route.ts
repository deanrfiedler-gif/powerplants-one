import { engineeringRegister } from "../../../../../engineering/register";
import { readRoute } from "../../../../../shared/http";

export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, query) => engineeringRegister(p, query));
