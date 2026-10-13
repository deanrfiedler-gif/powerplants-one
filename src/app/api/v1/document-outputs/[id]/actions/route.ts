import { readRoute } from "../../../../../../shared/http";
import { readOutputActions } from "../../../../../../outputs/actions";
import { outputActionRoute } from "../../../../../../outputs/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readOutputActions(p, id, q));
export const POST = outputActionRoute;
