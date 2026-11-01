import { readRoute, commandRoute } from "../../../../../shared/http";
import { inventory } from "../../../../../supply/inventory";
import { register } from "../../../../../supply/reads";
import { saveRecord } from "../../../../../supply/commands";
export const GET = readRoute((p, _id, q) =>
  q.view === "inventory"
    ? inventory(p, { ...q, view: q.inventory_view ?? "all" })
    : register(p, q),
);
export const POST = commandRoute((p, _id, input) => saveRecord(p, input));
