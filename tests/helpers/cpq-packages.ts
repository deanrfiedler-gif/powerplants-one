import { randomUUID } from "node:crypto";
import type { Definition } from "../../src/cpq/types";
import type { Principal } from "../../src/platform/identity";
import { packageContent, type PackageKind } from "../../src/cpq/package-model";
import {
  savePackage,
  decidePackage,
  readPackage,
} from "../../src/cpq/packages";
import { cpqDefinition, cpqInput } from "./cpq";
import { crmBase, CRM } from "./crm";

export function packageFixture(
  owner: string,
  d = cpqDefinition(),
  kind: PackageKind = "Rules",
) {
  const costs =
    d.schema_version === 4
      ? ["56.00", "560.00", "1120.00"]
      : ["70.00", "700.00", "1400.00"];
  d = structuredClone(d);
  d.fixtures = [1, 10, 20].map((count, i) => ({
    name: `SYN ${["small", "typical", "boundary"][i]} ${count} instances`,
    input: {
      ...cpqInput(),
      instances: Array.from({ length: count }, (_, n) => ({
        ...cpqInput().instances[0],
        id: `c0860000-0000-4000-8000-${String(n + 1).padStart(12, "0")}`,
      })),
    },
    expected: {
      ready: true,
      cost: costs[i],
      sell: ["105.00", "1050.00", "2100.00"][i],
      diagnostic_codes: [],
    },
  }));
  return packageContent(
    {
      schema_version: 1,
      label: "SYN owned sensor rules",
      definition: d,
      member_keys: (kind === "Rules" ? d.rules : d.design!.decision_tables).map(
        (m) => m.key,
      ),
      fixture_owner_id: owner,
      workload: {
        family: "Synthetic sensor assembly 1/10/20",
        rationale:
          "Exercise minimum, typical synthetic and maximum supported instance counts; no operational workload claim.",
        evaluation_ms: 1000,
        result_bytes: 200000,
        cases: d.fixtures.map((f, i) => ({
          fixture: f.name,
          role: ["Small", "Typical", "Boundary"][i],
        })),
      },
    },
    kind,
  );
}
export function packageDecision(view: Awaited<ReturnType<typeof readPackage>>) {
  return {
    ...crmBase(),
    expected_version: view.package.version,
    revision_id: view.current.id,
    content_hash: view.current.content_hash,
  };
}
export async function publishedFixture(
  actors: { p: Principal; reviewer: Principal; publisher: Principal },
  d?: Definition,
  kind: PackageKind = "Rules",
) {
  const content = packageFixture(actors.p.actor_id, d, kind);
  const command = {
    ...crmBase(),
    id: randomUUID(),
    company_id: CRM.company,
    kind,
    expected_version: 0,
    content,
  };
  await savePackage(actors.p, command);
  const saved = await readPackage(actors.p, command.id),
    attest = packageDecision(saved);
  await decidePackage(actors.p, command.id, "Attest", attest);
  const tested = await readPackage(actors.reviewer, command.id);
  const review = {
    ...packageDecision(tested),
    evidence_hash: tested.events.at(-1)!.report_hash,
    outcome: "Approved",
  };
  await decidePackage(actors.reviewer, command.id, "Review", review);
  const reviewed = await readPackage(actors.publisher, command.id);
  const publish = {
    ...packageDecision(reviewed),
    evidence_hash: reviewed.events.at(-1)!.report_hash,
  };
  await decidePackage(actors.publisher, command.id, "Publish", publish);
  const view = await readPackage(actors.p, command.id);
  return {
    content,
    command,
    attest,
    review,
    publish,
    view,
    reference: {
      package_id: view.package.id,
      revision_id: view.current.id,
      content_hash: view.current.content_hash,
      publication_id: view.events.at(-1)!.id,
    },
  };
}
