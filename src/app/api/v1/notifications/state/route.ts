import { changeNotices } from "../../../../../notifications/service";
export const dynamic = "force-dynamic";
import { personalRoute } from "../../../../../shared/personal-http";
export const POST = personalRoute(changeNotices);
