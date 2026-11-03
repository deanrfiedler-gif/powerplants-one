import { readRoute } from "../../../../../../shared/http";
import {
  exportReceivingBriefs,
  listReceivingBriefs,
} from "../../../../../../sales/receiving-queue";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) =>
  q.selection
    ? exportReceivingBriefs(p, q.selection)
    : listReceivingBriefs(p, q),
);
