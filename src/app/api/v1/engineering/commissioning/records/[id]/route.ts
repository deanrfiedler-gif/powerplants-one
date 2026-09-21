import { readRecord } from "../../../../../../../engineering/commissioning/reads";
import { readRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
// The full record route knows only the commissioning package; its Engineering package is resolved behind the same access check.
export const GET = readRoute((p, id, q) => readRecord(p, id, q));
