import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { sharedOperation } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
} from "../shared/validation";
import { expected } from "../estimating/service";
import { duty } from "./context";
import { productBindings } from "./products";
import { costBindings } from "./costs";
import { hash } from "./hash";
import { digest } from "./validation";
import { integer, packageContent } from "./package-model";
import { packageIsolated } from "./runner";
import {
  packageRoot,
  packageRevision,
  latestPackageEvent,
  packageEvent,
  packageError,
  type PackageRoot,
} from "./package-context";

async function event(
  c: PoolClient,
  p: Principal,
  root: PackageRoot,
  input: { operation_id: string; reason: string },
  action: string,
  report: Record<string, unknown>,
  basis: string | null = null,
) {
  const id = randomUUID(),
    report_hash = hash(report);
  await c.query(
    "INSERT INTO ppo.cpq_package_events(id,workspace_id,package_id,revision_id,version,action,state,basis_id,report,report_hash,actor_id,operation_id,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
    [
      id,
      p.workspace_id,
      root.id,
      root.current_revision_id,
      root.version,
      action,
      root.state,
      basis,
      report,
      report_hash,
      p.actor_id,
      input.operation_id,
      input.reason,
    ],
  );
  return {
    ...root,
    audit_details: {
      event_id: id,
      revision_id: root.current_revision_id,
      report_hash,
    },
  };
}
export async function savePackage(p: Principal, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "id",
    "company_id",
    "kind",
    "expected_version",
    "content",
  ]);
  const kind = choice(r.kind, "kind", ["Rules", "Tables"] as const);
  const input = {
    ...common(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    kind,
    expected_version: integer(
      r.expected_version,
      "expected_version",
      0,
      2147483646,
    ),
    content: packageContent(r.content, kind),
  };
  return sharedOperation(
    p,
    input,
    "CpqPackage:Save",
    async (c) => {
      await duty(c, p, input.company_id, "cpq.author");
      await productBindings(c, p, input.company_id, input.content.definition);
      await costBindings(c, p, input.company_id, input.content.definition);
      const prior = (
        await c.query<PackageRoot>(
          "SELECT * FROM ppo.cpq_packages WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, input.id],
        )
      ).rows[0];
      if (prior) {
        await duty(c, p, prior.company_id, "cpq.author");
        if (
          prior.owner_id !== p.actor_id ||
          prior.company_id !== input.company_id ||
          prior.kind !== kind
        )
          throw unavailable();
      }
      return prior;
    },
    async (c, prior) => {
      expected(prior?.version ?? 0, input.expected_version);
      await duty(
        c,
        { ...p, actor_id: input.content.fixture_owner_id },
        input.company_id,
        "cpq.author",
      );
      await productBindings(
        c,
        p,
        input.company_id,
        input.content.definition,
        true,
      );
      await costBindings(
        c,
        p,
        input.company_id,
        input.content.definition,
        true,
      );
      const previous = prior
        ? await packageRevision(c, p, prior, prior.current_revision_id)
        : null;
      const revision_id = randomUUID();
      const root = (
        await c.query<PackageRoot>(
          prior
            ? "UPDATE ppo.cpq_packages SET version=version+1,current_revision_id=$3,state='Draft',updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *"
            : "INSERT INTO ppo.cpq_packages(workspace_id,id,current_revision_id,company_id,kind,owner_id,version,state) VALUES($1,$2,$3,$4,$5,$6,1,'Draft') RETURNING *",
          prior
            ? [p.workspace_id, input.id, revision_id]
            : [
                p.workspace_id,
                input.id,
                revision_id,
                input.company_id,
                kind,
                p.actor_id,
              ],
        )
      ).rows[0];
      await c.query(
        "INSERT INTO ppo.cpq_package_revisions(id,workspace_id,package_id,version,predecessor_id,fixture_owner_id,content,content_hash,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          revision_id,
          p.workspace_id,
          root.id,
          (previous?.version ?? 0) + 1,
          previous?.id ?? null,
          input.content.fixture_owner_id,
          input.content,
          hash(input.content),
          p.actor_id,
        ],
      );
      return event(c, p, root, input, "Save", {
        content_hash: hash(input.content),
      });
    },
    "CpqPackage",
    "CpqChanged",
  );
}
export async function decidePackage(
  p: Principal,
  id: string,
  action: "Attest" | "Review" | "Publish" | "Withdraw",
  value: unknown,
) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "content_hash",
    ...(action === "Review"
      ? ["outcome", "evidence_hash"]
      : action === "Publish"
        ? ["evidence_hash"]
        : []),
  ]);
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    action,
    expected_version: version(r.expected_version),
    revision_id: uuid(r.revision_id, "revision_id"),
    content_hash: digest(r.content_hash, "content_hash"),
    ...(action === "Review"
      ? {
          outcome: choice(r.outcome, "outcome", [
            "Approved",
            "Rejected",
          ] as const),
        }
      : {}),
    ...(["Review", "Publish"].includes(action)
      ? { evidence_hash: digest(r.evidence_hash, "evidence_hash") }
      : {}),
  };
  const cap =
    action === "Review"
      ? "cpq.review"
      : action === "Publish"
        ? "cpq.publish"
        : "cpq.author";
  return sharedOperation(
    p,
    input,
    `CpqPackage:${action}`,
    async (c) => {
      const root = await packageRoot(c, p, input.id, cap),
        rev = await packageRevision(c, p, root, input.revision_id);
      if (rev.content_hash !== input.content_hash)
        throw packageError("Use the exact package hash.");
      if (
        (action === "Withdraw" && root.owner_id !== p.actor_id) ||
        (action === "Attest" && rev.fixture_owner_id !== p.actor_id)
      )
        throw unavailable();
      return { root, rev };
    },
    async (c, { root, rev }) => {
      expected(root.version, input.expected_version);
      if (root.current_revision_id !== rev.id)
        throw packageError("Use the current package revision.");
      const prior = await latestPackageEvent(c, p, root);
      let state: string,
        report: Record<string, unknown>,
        basis: string | null = null;
      if (action !== "Withdraw") {
        await packageRevision(c, p, root, rev.id, true);
        await duty(
          c,
          { ...p, actor_id: root.owner_id },
          root.company_id,
          "cpq.author",
        );
        await duty(
          c,
          { ...p, actor_id: rev.fixture_owner_id },
          root.company_id,
          "cpq.author",
        );
        for (const actor_id of new Set([root.owner_id, rev.fixture_owner_id]))
          if (actor_id !== p.actor_id)
            await packageRevision(c, { ...p, actor_id }, root, rev.id);
      }
      if (action === "Attest") {
        if (!["Draft", "TestFailed"].includes(root.state))
          throw packageError("Attest an unreviewed current package revision.");
        report = await packageIsolated(rev.content);
        if (Buffer.byteLength(JSON.stringify(report)) > 150000)
          throw new AppError(
            422,
            "CpqPackageLimit",
            "The complete workload evidence exceeds 150000 bytes. No partial attestation is retained.",
          );
        state = report.passed ? "Tested" : "TestFailed";
      } else if (action === "Review") {
        if (
          root.state !== "Tested" ||
          prior.report_hash !== input.evidence_hash
        )
          throw packageError(
            "Review the exact passing fixture-owner attestation.",
          );
        if ([root.owner_id, rev.fixture_owner_id].includes(p.actor_id))
          throw new AppError(
            403,
            "CpqIndependentReview",
            "Review independently of the package and fixture owners.",
          );
        state = input.outcome === "Approved" ? "Reviewed" : "Rejected";
        basis = prior.id;
        report = {
          basis_id: prior.id,
          basis_hash: prior.report_hash,
          outcome: input.outcome,
        };
      } else if (action === "Publish") {
        if (
          root.state !== "Reviewed" ||
          prior.report_hash !== input.evidence_hash ||
          !prior.basis_id
        )
          throw packageError(
            "Publish the exact independently approved evidence.",
          );
        if (
          [root.owner_id, rev.fixture_owner_id, prior.actor_id].includes(
            p.actor_id,
          )
        )
          throw new AppError(
            403,
            "CpqIndependentPublication",
            "A separate authorised publisher is required.",
          );
        const reviewer = { ...p, actor_id: prior.actor_id };
        await duty(c, reviewer, root.company_id, "cpq.review");
        await packageRevision(c, reviewer, root, rev.id);
        const accepted = await packageEvent(c, p, root, prior.basis_id);
        await packageRevision(
          c,
          { ...p, actor_id: rev.fixture_owner_id },
          root,
          rev.id,
        );
        state = "Published";
        basis = prior.id;
        report = {
          review_id: prior.id,
          review_hash: prior.report_hash,
          attestation_id: accepted.id,
          attestation_hash: accepted.report_hash,
        };
      } else {
        if (root.state === "Withdrawn")
          throw packageError("This package is already withdrawn.");
        state = "Withdrawn";
        report = { content_hash: rev.content_hash };
      }
      const updated = (
        await c.query<PackageRoot>(
          "UPDATE ppo.cpq_packages SET version=version+1,state=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, root.id, state],
        )
      ).rows[0];
      return event(c, p, updated, input, action, report, basis);
    },
    "CpqPackage",
    "CpqChanged",
  );
}
export async function readPackage(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  object(query, []);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const root = await packageRoot(c, p, uuid(id, "id"));
    const revisions = [];
    for (const row of (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.cpq_package_revisions WHERE workspace_id=$1 AND package_id=$2 ORDER BY version",
        [p.workspace_id, id],
      )
    ).rows)
      revisions.push(await packageRevision(c, p, root, row.id));
    const events = [];
    for (const row of (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.cpq_package_events WHERE workspace_id=$1 AND package_id=$2 ORDER BY version",
        [p.workspace_id, id],
      )
    ).rows)
      events.push(await packageEvent(c, p, root, row.id));
    return {
      package: root,
      current: revisions.find((r) => r.id === root.current_revision_id)!,
      revisions,
      events,
      synthetic: true,
    };
  });
}
export async function listPackages(
  p: Principal,
  query: Record<string, string>,
) {
  const q = object(query, ["company_id"]),
    company = uuid(q.company_id, "company_id");
  return transaction(async (c) => {
    await duty(c, p, company);
    return (
      await c.query<PackageRoot>(
        "SELECT * FROM ppo.cpq_packages WHERE workspace_id=$1 AND company_id=$2 ORDER BY id LIMIT 100",
        [p.workspace_id, company],
      )
    ).rows;
  });
}
