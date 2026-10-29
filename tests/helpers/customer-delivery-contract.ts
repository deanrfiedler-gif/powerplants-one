// Exact additional binding contract, independent of the migration and runtime source list.
export const customerDeliveryBindings = [
  ...[
    "dispatch.carrier",
    "dispatch.platform",
    "dispatch.tracking_number",
    "dispatch.tracking_url",
    "dispatch.movement_at",
    "dispatch.quantity",
    "dispatch.dispatched_quantity",
    "dispatch.outstanding_quantity",
    "dispatch.item",
    "dispatch.unit",
    "delivery.customer_eta",
  ].map((binding) => ({ message_class: "DispatchNotice", binding })),
  ...["delivery.customer_eta", "delay.previous_eta", "delay.reason"].map(
    (binding) => ({ message_class: "DelayNotice", binding }),
  ),
];
