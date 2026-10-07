import { readRoute } from "../../../../../../../shared/http";
import { previewProductUse } from "../../../../../../../products/uses";
export const GET = readRoute((p, id, q) => previewProductUse(p, id, q));
export const dynamic = "force-dynamic";
