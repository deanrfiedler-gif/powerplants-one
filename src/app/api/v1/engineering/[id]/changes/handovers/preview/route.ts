import { readPreview } from "../../../../../../../../engineering/changes/reads";
import { readRoute } from "../../../../../../../../shared/http";
export const dynamic = "force-dynamic";
// Informational until the server confirms it: confirmation rebuilds this preview and refuses one that no longer matches.
export const GET = readRoute((p, id, q) => readPreview(p, id, q));
