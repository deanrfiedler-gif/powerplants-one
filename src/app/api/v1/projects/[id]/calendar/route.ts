import {
  recordCalendar,
  readCalendar,
} from "../../../../../../projects/programme";
import { commandRoute, readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(readCalendar);
// 366 exceptions with bounded Unicode reasons still fit this explicit ceiling.
export const POST = commandRoute(recordCalendar, true, 262144);
