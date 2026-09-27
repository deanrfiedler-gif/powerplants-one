import {
  common,
  commonKeys,
  label,
  object,
  uuid,
  version,
} from "../shared/validation";
import { ids } from "../shared/cs/model";
export function fieldReadinessCommand(appointmentId: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "record_id",
    "expected_version",
    "presented_hash",
    "facility_ids",
    "activity",
  ]);
  return {
    ...common(r),
    appointment_id: uuid(appointmentId, "appointment_id"),
    record_id: uuid(r.record_id, "record_id"),
    expected_version: version(r.expected_version),
    presented_hash: label(r.presented_hash, "presented_hash", 64),
    facility_ids: ids(r.facility_ids, "facility_ids"),
    activity: label(r.activity, "activity", 100),
  };
}
