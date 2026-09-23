import {
  notificationPreferences,
  saveNotificationPreferences,
} from "../../../../../notifications/service";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
import { personalRoute } from "../../../../../shared/personal-http";
export const GET = readRoute((p) => notificationPreferences(p));
export const POST = personalRoute(saveNotificationPreferences);
