import { fertigationPost } from "../../../../../../estimating/fertigation/http";
import { confirmNativeImport } from "../../../../../../estimating/fertigation/import-service";
import { PORTABLE_BYTES } from "../../../../../../estimating/fertigation/portable-limits";
export const POST = fertigationPost(confirmNativeImport, true, PORTABLE_BYTES);
