import {
  readNoticePreferences,
  recordNoticePreference,
} from "../../../../../../communications";
import { commandRoute, readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readNoticePreferences(p, id, q));
export const POST = commandRoute((p, id, b) => recordNoticePreference(p, id, b));
