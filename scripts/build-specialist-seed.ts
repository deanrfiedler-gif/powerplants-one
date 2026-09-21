import { writeFile } from "node:fs/promises";
import {
  bundleId,
  bundleHash,
  definition,
} from "../src/estimating/specialist/definition";
import {
  receivingPolicy,
  receivingPolicyHash,
} from "../src/estimating/specialist/fixture-policy";
const q = (v: unknown) =>
  "'" +
  String(typeof v === "string" ? v : JSON.stringify(v)).replaceAll("'", "''") +
  "'";
await writeFile(
  "db/seed-specialist.sql",
  `-- ADR-0034: immutable synthetic definition/policy only; no users, grants or operational approval.
INSERT INTO ppo.specialist_definitions(id,bundle_hash,manifest,state) VALUES(${q(bundleId)},${q(bundleHash)},${q(definition)},'Review required') ON CONFLICT(id) DO NOTHING;
INSERT INTO ppo.specialist_policies(id,content_hash,manifest,definition_id,definition_hash) VALUES(${q(receivingPolicy.id)},${q(receivingPolicyHash)},${q(receivingPolicy)},${q(bundleId)},${q(bundleHash)}) ON CONFLICT(id) DO NOTHING;
`,
);
