import {
  recordCalendar,
  readCalendar,
} from "../../../../../../projects/programme";
import { commandRoute, readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(readCalendar);
export const POST = commandRoute(recordCalendar);
