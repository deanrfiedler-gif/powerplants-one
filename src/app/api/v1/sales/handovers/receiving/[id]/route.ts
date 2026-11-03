import { readRoute } from "../../../../../../../shared/http";
import { readReceivingBrief } from "../../../../../../../sales/receiving-queue";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readReceivingBrief(p, id, q));
