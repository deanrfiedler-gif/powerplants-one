import { packageReferences } from "./package-model";
import { composePackages, releasePackages } from "./package-bindings";
import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { sharedOperation } from "../platform/operations";
import { AppError } from "../platform/errors";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
  invalid,
} from "../shared/validation";
import { expected } from "../estimating/service";
import { active, duty, release, revision, type Release } from "./context";
import { definition, digest } from "./validation";
import { hash } from "./hash";
import { testIsolated } from "./runner";
import { costBindings } from "./costs";
import { productBindings } from "./products";
import { tableCoverage } from "./design-runtime";
import { retainVersionDraft } from "./drafts";
import { publicationQuality, qualityReceiptAuthority } from "./quality";

export async function saveRelease(p: Principal, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "id",
    "company_id",
    "expected_version",
    "definition",
    "draft",
    "packages",
  ]);
  const sourceDraft =
    r.draft === undefined ? null : object(r.draft, ["id", "expected_version"]);
  if (
    !Number.isSafeInteger(r.expected_version) ||
    Number(r.expected_version) < 0
  )
    invalid(
      "expected_version",
      "Use the current release version or zero for a new release.",
    );
  const input = {
    ...common(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    expected_version: Number(r.expected_version),
    definition: definition(r.definition),
    ...(r.packages === undefined ? {} : {packages: packageReferences(r.packages)}),
    ...(sourceDraft
      ? {
          draft: {
            id: uuid(sourceDraft.id, "draft_id"),
            expected_version: version(sourceDraft.expected_version),
          },
        }
      : {}),
  };
  return sharedOperation(
    p,
    input,
    "Cpq:Save",
    async (c) => {
      await duty(c, p, input.company_id, "cpq.author");
      await productBindings(c, p, input.company_id, input.definition);
      await costBindings(c, p, input.company_id, input.definition);
      if(input.packages) await composePackages(c,p,input.company_id,input.definition,input.packages);
      const prior = (
        await c.query<Release>(
          "SELECT * FROM ppo.cpq_releases WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, input.id],
        )
      ).rows[0];
      if (prior) await duty(c, p, prior.company_id, "cpq.author");
      if (prior && prior.company_id !== input.company_id)
        throw new AppError(
          409,
          "CpqCompanyChanged",
          "A release cannot change company.",
        );
      return prior;
    },
    async (c, prior) => {
      expected(prior?.version ?? 0, input.expected_version);
      await productBindings(c, p, input.company_id, input.definition, true);
      await costBindings(c, p, input.company_id, input.definition, true);
      if (input.definition.schema_version === 3) {
        const fixtures = await testIsolated(input.definition);
        const coverage = tableCoverage(input.definition);
        if (
          fixtures.some((f) => !f.passed) ||
          coverage.some((t) => !t.complete || t.issues.length)
        )
          throw new AppError(
            409,
            "CpqVersionTestsRequired",
            "All fixtures and decision table coverage checks must pass before creating an immutable design version. Save incomplete work as a draft.",
          );
      }
      const package_manifest = input.packages ? await composePackages(c,p,input.company_id,input.definition,input.packages,true) : null;
      const id = randomUUID(),
        v = prior ? await revision(c, p, prior.current_revision_id) : null;
      const root = prior
        ? (
            await c.query<Release>(
              "UPDATE ppo.cpq_releases SET version=version+1,current_revision_id=$3,label=$4,state='Draft',updated_by=$5,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
              [
                p.workspace_id,
                input.id,
                id,
                input.definition.label,
                p.actor_id,
              ],
            )
          ).rows[0]
        : (
            await c.query<Release>(
              "INSERT INTO ppo.cpq_releases(id,workspace_id,company_id,display_number,label,version,current_revision_id,state,created_by,updated_by) VALUES($1,$2,$3,$4,$5,1,$6,'Draft',$7,$7) RETURNING *",
              [
                input.id,
                p.workspace_id,
                input.company_id,
                null,
                input.definition.label,
                id,
                p.actor_id,
              ],
            )
          ).rows[0];
      await c.query(
        `INSERT INTO ppo.cpq_revisions(id,workspace_id,company_id,release_id,version,predecessor_id,definition,content_hash,reason,created_by${package_manifest ? ",package_manifest" : ""}) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10${package_manifest ? ",$11" : ""})`,
        [
          id,
          p.workspace_id,
          input.company_id,
          input.id,
          (v?.version ?? 0) + 1,
          v?.id ?? null,
          input.definition,
          hash(input.definition),
          input.reason,
          p.actor_id,
          ...(package_manifest ? [JSON.stringify(package_manifest)] : []),
        ],
      );
      if (input.definition.schema_version === 3)
        for (const rule of input.definition.rules) {
          const previous = (
            await c.query<{
              id: string;
              version: number;
              content_hash: string;
            }>(
              "SELECT id,version,content_hash FROM ppo.cpq_rule_versions WHERE workspace_id=$1 AND release_id=$2 AND rule_key=$3 ORDER BY version DESC LIMIT 1",
              [p.workspace_id, input.id, rule.key],
            )
          ).rows[0];
          const content_hash = hash(rule);
          const reusable = (
            await c.query<{ id: string }>(
              "SELECT id FROM ppo.cpq_rule_versions WHERE workspace_id=$1 AND release_id=$2 AND rule_key=$3 AND content_hash=$4 ORDER BY version LIMIT 1",
              [p.workspace_id, input.id, rule.key, content_hash],
            )
          ).rows[0];
          const ruleId = reusable?.id ?? randomUUID();
          if (!reusable)
            await c.query(
              "INSERT INTO ppo.cpq_rule_versions(id,workspace_id,release_id,rule_key,version,content,content_hash,created_by,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
              [
                ruleId,
                p.workspace_id,
                input.id,
                rule.key,
                (previous?.version ?? 0) + 1,
                rule,
                content_hash,
                p.actor_id,
                input.reason,
              ],
            );
          await c.query(
            "INSERT INTO ppo.cpq_release_members(workspace_id,revision_id,rule_key,rule_version_id) VALUES($1,$2,$3,$4)",
            [p.workspace_id, id, rule.key, ruleId],
          );
        }
      if (input.draft)
        await retainVersionDraft(c, p, {
          ...input.draft,
          release_id: input.id,
          revision_id: id,
          company_id: input.company_id,
          content: input.definition,
          reason: input.reason,
        });
      return {
        ...root,
        audit_details: {
          revision_id: id,
          content_hash: hash(input.definition),
        },
      };
    },
    "CpqRelease",
    "CpqChanged",
  );
}
export async function reviewRelease(p: Principal, id: string, value: unknown) {
  const r = object(value, [
      ...commonKeys,
      "expected_version",
      "revision_id",
      "content_hash",
      "outcome",
    ]),
    input = {
      ...common(r),
      id: uuid(id, "id"),
      expected_version: version(r.expected_version),
      revision_id: uuid(r.revision_id, "revision_id"),
      content_hash: digest(r.content_hash, "content_hash"),
      outcome: choice(r.outcome, "outcome", ["Approved", "Rejected"] as const),
    };
  return sharedOperation(
    p,
    input,
    "Cpq:Review",
    async (c) => {
      const root = await release(c, p, input.id, "cpq.review");
      await revision(c, p, input.revision_id);
      return root;
    },
    async (c, root) => {
      expected(root.version, input.expected_version);
      if (
        root.current_revision_id !== input.revision_id ||
        root.state !== "Draft"
      )
        throw new AppError(
          409,
          "CpqRevisionChanged",
          "Review the current draft release.",
        );
      const v = await revision(c, p, input.revision_id);
      if (v.content_hash !== input.content_hash)
        throw new AppError(
          409,
          "CpqRevisionChanged",
          "Review the exact content hash.",
        );
      if (v.created_by === p.actor_id)
        throw new AppError(
          403,
          "CpqIndependentReview",
          "Another authorised person must review this release.",
        );
      const fixtures = await testIsolated(v.definition);
      if (input.outcome === "Approved") {
        await releasePackages(c,p,v,true);
      await productBindings(c, p, root.company_id, v.definition, true);
        await costBindings(c, p, root.company_id, v.definition, true);
      }
      if (input.outcome === "Approved" && fixtures.some((f) => !f.passed))
        throw new AppError(
          409,
          "CpqFixturesFailed",
          "All saved fixtures must pass before approval. Inspect the test bench results.",
        );
      const review_id = randomUUID();
      await c.query(
        "INSERT INTO ppo.cpq_reviews(id,workspace_id,revision_id,reviewer_id,outcome,content_hash,fixture_results,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          review_id,
          p.workspace_id,
          v.id,
          p.actor_id,
          input.outcome,
          v.content_hash,
          JSON.stringify(fixtures),
          input.reason,
        ],
      );
      const updated = (
        await c.query<Release>(
          "UPDATE ppo.cpq_releases SET version=version+1,state=$3,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [
            p.workspace_id,
            root.id,
            input.outcome === "Approved" ? "Reviewed" : "Rejected",
            p.actor_id,
          ],
        )
      ).rows[0];
      return {
        ...updated,
        audit_details: {
          review_id,
          revision_id: v.id,
          content_hash: v.content_hash,
        },
      };
    },
    "CpqRelease",
    "CpqChanged",
  );
}
export async function activateRelease(
  p: Principal,
  id: string,
  value: unknown,
) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "content_hash",
    "expected_activation_version",
  ]);
  if (
    !Number.isSafeInteger(r.expected_activation_version) ||
    Number(r.expected_activation_version) < 0
  )
    invalid(
      "expected_activation_version",
      "Use the current company activation version, or zero.",
    );
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    revision_id: uuid(r.revision_id, "revision_id"),
    content_hash: digest(r.content_hash, "content_hash"),
    expected_activation_version: Number(r.expected_activation_version),
  };
  return sharedOperation(
    p,
    input,
    "Cpq:Activate",
    async (c) => {
      const root = await release(c, p, input.id, "cpq.publish");
      await revision(c, p, input.revision_id);
      await qualityReceiptAuthority(c, p, root, input.operation_id);
      return root;
    },
    async (c, root) => {
      expected(root.version, input.expected_version);
      const v = await revision(c, p, input.revision_id),
        head = await active(c, p, root.company_id);
      expected(head?.version ?? 0, input.expected_activation_version);
      if (
        root.current_revision_id !== v.id ||
        v.content_hash !== input.content_hash ||
        !(
          v.definition.schema_version === 3
            ? ["Sealed", "Published"]
            : ["Reviewed", "Published"]
        ).includes(root.state)
      )
        throw new AppError(
          409,
          "CpqRevisionChanged",
          "Activate the current reviewed release and exact hash.",
        );
      const review = (
        await c.query<{ id: string; reviewer_id: string; outcome: string }>(
          "SELECT * FROM ppo.cpq_reviews WHERE workspace_id=$1 AND revision_id=$2",
          [p.workspace_id, v.id],
        )
      ).rows[0];
      if (!review || review.outcome !== "Approved")
        throw new AppError(
          409,
          "CpqReviewRequired",
          "An approved review is required.",
        );
      if ([v.created_by, review.reviewer_id].includes(p.actor_id))
        throw new AppError(
          403,
          "CpqIndependentPublication",
          "A third authorised person must publish this release.",
        );
      await duty(
        c,
        { ...p, actor_id: review.reviewer_id },
        root.company_id,
        "cpq.review",
      );
      await releasePackages(c,p,v,true);
      await productBindings(c, p, root.company_id, v.definition, true);
      await productBindings(
        c,
        { ...p, actor_id: review.reviewer_id },
        root.company_id,
        v.definition,
      );
      await costBindings(c, p, root.company_id, v.definition, true);
      await costBindings(
        c,
        { ...p, actor_id: review.reviewer_id },
        root.company_id,
        v.definition,
      );
      const quality = await publicationQuality(c, p, root);
      const activation_id = randomUUID();
      await c.query(
        "INSERT INTO ppo.cpq_activations(id,workspace_id,company_id,revision_id,review_id,version,created_by,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          activation_id,
          p.workspace_id,
          root.company_id,
          v.id,
          review.id,
          (head?.version ?? 0) + 1,
          p.actor_id,
          input.reason,
        ],
      );
      await c.query(
        "INSERT INTO ppo.cpq_heads(workspace_id,company_id,activation_id) VALUES($1,$2,$3) ON CONFLICT(workspace_id,company_id) DO UPDATE SET activation_id=excluded.activation_id",
        [p.workspace_id, root.company_id, activation_id],
      );
      const updated = (
        await c.query<Release>(
          "UPDATE ppo.cpq_releases SET version=version+1,state='Published',updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, root.id, p.actor_id],
        )
      ).rows[0];
      return {
        ...updated,
        audit_details: {
          activation_id,
          revision_id: v.id,
          content_hash: v.content_hash,
          ...quality,
        },
      };
    },
    "CpqRelease",
    "CpqChanged",
  );
}
export async function sealRelease(p: Principal, id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "content_hash",
  ]);
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    revision_id: uuid(r.revision_id, "revision_id"),
    content_hash: digest(r.content_hash, "content_hash"),
  };
  return sharedOperation(
    p,
    input,
    "Cpq:Seal",
    (c) => release(c, p, input.id, "cpq.publish"),
    async (c, root) => {
      expected(root.version, input.expected_version);
      const v = await revision(c, p, input.revision_id);
      if (
        v.id !== root.current_revision_id ||
        v.content_hash !== input.content_hash ||
        root.state !== "Reviewed" ||
        v.definition.schema_version !== 3
      )
        throw new AppError(
          409,
          "CpqSealBasisChanged",
          "Seal the current approved design version and exact content hash.",
        );
      const review = (
        await c.query<{ id: string; reviewer_id: string; outcome: string }>(
          "SELECT * FROM ppo.cpq_reviews WHERE workspace_id=$1 AND revision_id=$2",
          [p.workspace_id, v.id],
        )
      ).rows[0];
      if (!review || review.outcome !== "Approved")
        throw new AppError(
          409,
          "CpqReviewRequired",
          "An approved review is required before sealing.",
        );
      if ([v.created_by, review.reviewer_id].includes(p.actor_id))
        throw new AppError(
          403,
          "CpqIndependentPublication",
          "A third authorised person must seal this release.",
        );
      await duty(
        c,
        { ...p, actor_id: review.reviewer_id },
        root.company_id,
        "cpq.review",
      );
      await releasePackages(c,p,v,true);
      const sealId = randomUUID();
      await c.query(
        "INSERT INTO ppo.cpq_seals(id,workspace_id,revision_id,review_id,content_hash,created_by,reason) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          sealId,
          p.workspace_id,
          v.id,
          review.id,
          v.content_hash,
          p.actor_id,
          input.reason,
        ],
      );
      const saved = (
        await c.query<Release>(
          "UPDATE ppo.cpq_releases SET version=version+1,state='Sealed',updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, root.id, p.actor_id],
        )
      ).rows[0];
      return {
        ...saved,
        audit_details: {
          seal_id: sealId,
          revision_id: v.id,
          content_hash: v.content_hash,
        },
      };
    },
    "CpqRelease",
    "CpqChanged",
  );
}
export async function testRelease(p: Principal, id: string) {
  const v = await transaction((c) => revision(c, p, id));
  return {
    revision_id: v.id,
    content_hash: v.content_hash,
    results: await testIsolated(v.definition),
    synthetic: true,
  };
}
