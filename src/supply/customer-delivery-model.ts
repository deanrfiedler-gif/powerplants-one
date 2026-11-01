import {
  common,
  commonKeys,
  dateOnly,
  invalid,
  label,
  object,
  optionalId,
  uuid,
  version,
} from "../shared/validation";
import { decimal, quantity } from "./model";

export type DispatchNoticeDetails = {
  carrier_code: string;
  platform_code: string;
  tracking_number: string;
};
export function catalogueCode(value: unknown, kind: "CAR" | "PLT" | "DLR") {
  if (
    typeof value !== "string" ||
    !new RegExp(`^SYN-${kind}-[0-9]{6}$`).test(value)
  )
    return invalid(
      "catalogue_code",
      "Select an entry from the synthetic catalogue.",
    );
  return value;
}
export function dispatchNoticeDetails(value: unknown): DispatchNoticeDetails {
  const r = object(value, ["carrier_code", "platform_code", "tracking_number"]);
  const tracking = label(r.tracking_number, "tracking_number", 120);
  if (!/^[A-Za-z0-9][A-Za-z0-9 ./_-]*$/.test(tracking))
    invalid(
      "tracking_number",
      "Use the recorded consignment number, without a URL or message text.",
    );
  return {
    carrier_code: catalogueCode(r.carrier_code, "CAR"),
    platform_code: catalogueCode(r.platform_code, "PLT"),
    tracking_number: tracking,
  };
}
export function customerDeliveryCommand(id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "contact_id",
    "customer_eta",
    "delay_reason_code",
  ]);
  return {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    contact_id: optionalId(r.contact_id, "contact_id"),
    customer_eta:
      r.customer_eta === null || r.customer_eta === undefined
        ? null
        : dateOnly(r.customer_eta, "customer_eta"),
    delay_reason_code:
      r.delay_reason_code === null || r.delay_reason_code === undefined
        ? null
        : catalogueCode(r.delay_reason_code, "DLR"),
  };
}
// Customer ETA is an explicitly recorded calendar date. Neither supplier ETA nor required_on
// is an input. Submitted/unknown drafts are not a communicated baseline.
export function laterCustomerEta(current: string | null, sent: string | null) {
  return Boolean(current && sent && current > sent);
}
export function dispatchQuantities(
  ordered: string,
  moved: readonly string[],
  thisMovement: string,
) {
  const total = moved.reduce((n, v) => n + decimal(v), 0n);
  const demand = decimal(ordered),
    movement = decimal(thisMovement);
  if (total > demand || movement > total || movement === 0n)
    invalid(
      "quantity",
      "Dispatch quantities must conserve the recorded order quantity.",
    );
  return {
    movement: quantity(movement),
    dispatched: quantity(total),
    outstanding: quantity(demand - total),
  };
}
