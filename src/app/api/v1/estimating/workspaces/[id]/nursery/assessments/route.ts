import { readRoute, commandRoute } from "../../../../../../../../shared/http";
import {
  readAssessment,
  saveAssessment,
} from "../../../../../../../../estimating/nursery-automation/assessment-service";
import { assessmentByteLimit } from "../../../../../../../../estimating/nursery-automation/assessment-validation";
export const GET = readRoute(readAssessment);
export const POST = commandRoute(saveAssessment, true, assessmentByteLimit);
