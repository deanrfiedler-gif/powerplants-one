import type { JournalEntry } from "../shared/lib/command-journal";

const commandPath =
  /^products(?:\/[a-f0-9-]{36}(?:\/review|\/pricing|\/uses)?|\/relationships(?:\/[a-f0-9-]{36}\/review)?|\/imports(?:\/[a-f0-9-]{36}(?:\/map|\/review)?)?)?$/;
const ordinaryTarget = /^\/products(?:\/[a-z0-9-]+)?(?:\?[a-z_]+=[a-z0-9-]+)?$/;
const exactPricingTarget =
  /^\/products\/pricing\?product_id=[a-f0-9-]{36}&revision_id=[a-f0-9-]{36}$/;

export function acceptsProductCommand(entry: JournalEntry) {
  return (
    commandPath.test(entry.path) &&
    (ordinaryTarget.test(entry.target) || exactPricingTarget.test(entry.target))
  );
}
