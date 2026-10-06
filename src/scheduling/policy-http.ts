// Online API-C26 adapters. Step 4 couples registration to booking, readiness,
// actual-start and delayed-offline enforcement; no offline dispatch is registered.
import { object } from "../shared/validation";
import { commandRoute, readRoute } from "../shared/http";
import {
  readPolicyFamily,
  proposeSchedulingPolicy,
  reviewSchedulingPolicy,
  publishSchedulingPolicy,
  readPolicyEvidence,
} from "./policy-commands";
import {
  readPolicyImpact,
  resolveSchedulingPolicyImpact,
} from "./policy-resolution";
export const propose = commandRoute((p, _id, input) =>
  proposeSchedulingPolicy(p, input),
);
export const review = commandRoute((p, _id, input) =>
  reviewSchedulingPolicy(p, input),
);
export const publish = commandRoute((p, _id, input) =>
  publishSchedulingPolicy(p, input),
);
export const resolve = commandRoute(resolveSchedulingPolicyImpact);
export const proposalRead = readRoute((p, id, query) => {
  object(query, []);
  return readPolicyEvidence(p, "proposal", id);
});
export const reviewRead = readRoute((p, id, query) => {
  object(query, []);
  return readPolicyEvidence(p, "review", id);
});
export const publicationRead = readRoute((p, id, query) => {
  object(query, []);
  return readPolicyEvidence(p, "publication", id);
});
export const impactRead = readRoute((p, id, query) => {
  object(query, ["replacement_id"]);
  return readPolicyImpact(p, id, query.replacement_id ?? null);
});
export const familyRead = readRoute((p, _id, query) => {
  object(query, []);
  return readPolicyFamily(p);
});
