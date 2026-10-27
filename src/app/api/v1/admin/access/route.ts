import { readRoute } from "../../../../../shared/http";
import { accessPeople } from "../../../../../access/service";
import { accessIdentityRegister } from "../../../../../access/identity-register";
export const GET = readRoute((p, _id, query) =>
  query.register === "1"
    ? accessIdentityRegister(p, query)
    : accessPeople(p, query),
);
