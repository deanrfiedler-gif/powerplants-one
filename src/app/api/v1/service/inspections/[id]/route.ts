import { inspectionRead, inspectionPost } from "../../../../../../inspections/service-http";
export const GET = inspectionRead("review");
export const POST = inspectionPost("review");
