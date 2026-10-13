import { commandRoute } from "../../../../../../../shared/http";
import { sealRelease } from "../../../../../../../cpq/releases";
export const POST = commandRoute((p, id, v) => sealRelease(p, id!, v));
