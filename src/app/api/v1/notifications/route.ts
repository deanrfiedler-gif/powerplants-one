import { notificationInbox } from "../../../../notifications/service";
import { readRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => notificationInbox(p, q));
