import { readRoute, commandRoute } from "../../../../../shared/http";
import {
  equipmentInstruments,
  recordCalibration,
} from "../../../../../equipment/evidence";
export const GET = readRoute((p) => equipmentInstruments(p));
export const POST = commandRoute((p, _id, b) => recordCalibration(p, b));
