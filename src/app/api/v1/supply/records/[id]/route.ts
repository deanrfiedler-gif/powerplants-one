import { readRoute, commandRoute } from "../../../../../../shared/http";
import { workspace } from "../../../../../../supply/reads";
import { saveRecord } from "../../../../../../supply/commands";
import { AppError } from "../../../../../../platform/errors";
export const GET = readRoute((p, id) => workspace(p, id));
export const POST = commandRoute((p, id, input) => {
  if (
    !input ||
    typeof input !== "object" ||
    !("id" in input) ||
    input.id !== id
  )
    throw new AppError(
      422,
      "InvalidIdentity",
      "The record identity must match the route.",
    );
  return saveRecord(p, input, true);
}, false);
