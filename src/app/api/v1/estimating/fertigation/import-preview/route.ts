import { fertigationPost } from "../../../../../../estimating/fertigation/http";
import { previewNativeImport } from "../../../../../../estimating/fertigation/import-service";
import { PORTABLE_BYTES } from "../../../../../../estimating/fertigation/portable-limits";
export const POST = fertigationPost(previewNativeImport, false, PORTABLE_BYTES);
