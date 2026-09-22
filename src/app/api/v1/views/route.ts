import {
  readSavedViews,
  saveSavedViews,
} from "../../../../platform/saved-views";
import { readRoute } from "../../../../shared/http";
import { personalRoute } from "../../../../shared/personal-http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p) => readSavedViews(p));
export const POST = personalRoute(saveSavedViews);
