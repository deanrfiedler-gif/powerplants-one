import {
  listHandovers,
  createHandover,
} from "../../../../../sales/handover-service";
import { handoverKinds } from "../../../../../sales/handover-model";
import { choice } from "../../../../../shared/validation";
import { readRoute, commandRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) =>
  listHandovers(
    p,
    choice(q.kind, "kind", handoverKinds),
    q.opportunity_id,
    q.receiving === "true",
  ),
);
export const POST = commandRoute((p, _id, v) => createHandover(p, v));
