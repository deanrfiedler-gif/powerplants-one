import { inspectionRead, inspectionPost } from "../../../../../../inspections/service-http";
export const GET = inspectionRead("capture");
export const POST = inspectionPost("capture");
