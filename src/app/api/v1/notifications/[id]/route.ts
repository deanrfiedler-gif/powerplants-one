import { notificationTarget } from "../../../../../notifications/service";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id) => notificationTarget(p, id));
