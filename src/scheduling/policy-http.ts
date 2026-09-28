// Unregistered adapters for the isolated Step 3 contract harness. No src/app route
// imports this module. Step 4 activation requires a reviewed integrated change.
import { commandRoute, readRoute } from "../shared/http";
import {
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
export const proposalRead = readRoute((p, id) =>
  readPolicyEvidence(p, "proposal", id),
);
export const reviewRead = readRoute((p, id) =>
  readPolicyEvidence(p, "review", id),
);
export const publicationRead = readRoute((p, id) =>
  readPolicyEvidence(p, "publication", id),
);
export const impactRead = readRoute((p, id, query) =>
  readPolicyImpact(p, id, query.replacement_id ?? null),
);
