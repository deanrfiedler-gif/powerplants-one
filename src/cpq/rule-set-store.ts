// Configuration rule set storage and versioning (ADR-0066 R2): draft, check, review, publish.
// Governance: a named engineering owner (Q2) who alone accepts blocking findings with a reason (Q5),
// an independent reviewer, a third-person publisher and immutable published versions. The database
// triggers in migration 0119 enforce the same rules if this service is bypassed.
import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { sharedOperation } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { choice, common, commonKeys, invalid, object, uuid, version } from "../shared/validation";
import { expected } from "../estimating/service";
import { duty, type Duty } from "./context";
import { hash } from "./hash";
import { digest } from "./validation";
import { ruleSetTestIsolated } from "./runner";
import { RuleSetInvalid, validateRuleSet, type RuleSetDefinition, type RuleSetTest } from "./rule-sets";

type ValidTest = Extract<RuleSetTest, { valid: true }>;

export type RuleSetRoot = {
  id: string;
  workspace_id: string;
  company_id: string;
  key: string;
  label: string;
  family: string;
  owner_id: string;
  version: number;
  current_revision_id: string;
  state: "Draft" | "Reviewed" | "Rejected" | "Published";
  created_by: string;
  updated_at: Date;
};
export type RuleSetRevision = {
  id: string;
  rule_set_id: string;
  company_id: string;
  version: number;
  predecessor_id: string | null;
  definition: RuleSetDefinition;
  content_hash: string;
  test: ValidTest;
  reason: string;
  created_by: string;
  created_at: Date;
};

const invalidDefinition = (e: RuleSetInvalid) =>
  new AppError(
    422,
    "RuleSetInvalid",
    "The rule set has problems. Fix each one and save again.",
    e.issues.slice(0, 100).map((i) => ({ field: `definition.${i.path}`.replace(/\.$/, ""), message: `${i.code}: ${i.message}` })),
  );

/** Checks a definition in this process (structure only) so a refusal names every problem. */
function checkedDefinition(value: unknown): RuleSetDefinition {
  try {
    return validateRuleSet(value).definition;
  } catch (e) {
    if (e instanceof RuleSetInvalid) throw invalidDefinition(e);
    throw e;
  }
}

/** Runs the reference cases and coverage checks inside the isolated worker. */
async function isolatedTest(definition: RuleSetDefinition): Promise<ValidTest> {
  const result = await ruleSetTestIsolated(definition);
  if (!("summary" in result)) {
    if ("issues" in result) throw invalidDefinition(new RuleSetInvalid(result.issues));
    throw new AppError(422, "CalculationLimit", "The rule set could not be checked. Simplify it and retry.");
  }
  return result;
}

async function root(c: QueryClient, p: Principal, id: string, cap: Duty = "cpq.read") {
  const r = (
    await c.query<RuleSetRoot>("SELECT * FROM ppo.cpq_rule_sets WHERE workspace_id=$1 AND id=$2", [p.workspace_id, uuid(id, "id")])
  ).rows[0];
  if (!r) throw unavailable();
  await duty(c, p, r.company_id, cap);
  return r;
}

async function revisionOf(c: QueryClient, p: Principal, ruleSet: RuleSetRoot, revisionId: string) {
  const v = (
    await c.query<RuleSetRevision>(
      "SELECT * FROM ppo.cpq_rule_set_revisions WHERE workspace_id=$1 AND rule_set_id=$2 AND id=$3",
      [p.workspace_id, ruleSet.id, uuid(revisionId, "revision_id")],
    )
  ).rows[0];
  if (!v) throw unavailable();
  return v;
}

const currentDraft = (r: RuleSetRoot, revisionId: string, states: RuleSetRoot["state"][] = ["Draft"]) => {
  if (r.current_revision_id !== revisionId || !states.includes(r.state))
    throw new AppError(409, "RuleSetRevisionChanged", "Act on the current revision of the rule set.");
};

/** The owner of a rule set must still be able to author or review for its company. */
const ownerDuty = async (c: QueryClient, p: Principal, company: string) =>
  (await hasPermission(c, p, "cpq.author", company)) || (await hasPermission(c, p, "cpq.review", company));

const blocking = (t: ValidTest) => t.coverage.filter((f) => f.severity === "Blocking");

async function acceptedFindings(c: QueryClient, p: Principal, revisionId: string) {
  return (
    await c.query<{ code: string; subject: string }>(
      "SELECT code,subject FROM ppo.cpq_rule_set_acceptances WHERE workspace_id=$1 AND revision_id=$2",
      [p.workspace_id, revisionId],
    )
  ).rows;
}

export async function saveRuleSet(p: Principal, value: unknown) {
  const r = object(value, [...commonKeys, "id", "company_id", "expected_version", "owner_id", "definition"]);
  if (!Number.isSafeInteger(r.expected_version) || Number(r.expected_version) < 0)
    invalid("expected_version", "Use the current rule set version, or zero for a new rule set.");
  const definition = checkedDefinition(r.definition);
  const input = {
    ...common(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    expected_version: Number(r.expected_version),
    owner_id: r.owner_id === undefined ? null : uuid(r.owner_id, "owner_id"),
    definition,
  };
  const content_hash = hash(definition);
  return sharedOperation(
    p,
    input,
    "Cpq:RuleSet:Save",
    async (c) => {
      await duty(c, p, input.company_id, "cpq.author");
      const prior = (
        await c.query<RuleSetRoot>("SELECT * FROM ppo.cpq_rule_sets WHERE workspace_id=$1 AND id=$2", [p.workspace_id, input.id])
      ).rows[0];
      if (prior) await duty(c, p, prior.company_id, "cpq.author");
      return prior;
    },
    async (c, prior) => {
      expected(prior?.version ?? 0, input.expected_version);
      if (prior && prior.company_id !== input.company_id)
        throw new AppError(409, "RuleSetCompanyChanged", "A rule set cannot change company.");
      if (prior && prior.key !== definition.key)
        throw new AppError(409, "RuleSetKeyChanged", "A rule set keeps its key. Create a new rule set for a new key.");
      const owner = prior?.owner_id ?? input.owner_id;
      if (!owner) invalid("owner_id", "Name the engineering owner of the new rule set.");
      if (prior && input.owner_id && input.owner_id !== prior.owner_id)
        throw new AppError(409, "RuleSetOwnerChanged", "This change cannot reassign the rule set owner.");
      const ownerPrincipal = { ...p, actor_id: owner! };
      if (!prior && !(await hasPermission(c, ownerPrincipal, "cpq.author", input.company_id)) && !(await hasPermission(c, ownerPrincipal, "cpq.review", input.company_id)))
        throw new AppError(409, "RuleSetOwnerUnauthorised", "The owner must be able to author or review rule sets for this company.");
      if (!prior) {
        const clash = (
          await c.query("SELECT 1 FROM ppo.cpq_rule_sets WHERE workspace_id=$1 AND company_id=$2 AND key=$3", [p.workspace_id, input.company_id, definition.key])
        ).rows[0];
        if (clash) throw new AppError(409, "RuleSetKeyTaken", "Another rule set in this company uses that key.");
      }
      const previous = prior
        ? (
            await c.query<{ id: string; version: number; content_hash: string }>(
              "SELECT id,version,content_hash FROM ppo.cpq_rule_set_revisions WHERE workspace_id=$1 AND id=$2",
              [p.workspace_id, prior.current_revision_id],
            )
          ).rows[0]
        : null;
      if (previous && previous.content_hash === content_hash)
        throw new AppError(409, "RuleSetUnchanged", "This content is already the current revision.");
      const test = await isolatedTest(definition);
      const revisionId = randomUUID();
      const saved = prior
        ? (
            await c.query<RuleSetRoot>(
              "UPDATE ppo.cpq_rule_sets SET version=version+1,current_revision_id=$3,label=$4,family=$5,state='Draft',updated_by=$6,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
              [p.workspace_id, prior.id, revisionId, definition.label, definition.family, p.actor_id],
            )
          ).rows[0]
        : (
            await c.query<RuleSetRoot>(
              "INSERT INTO ppo.cpq_rule_sets(id,workspace_id,company_id,key,label,family,owner_id,version,current_revision_id,state,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,1,$8,'Draft',$9,$9) RETURNING *",
              [input.id, p.workspace_id, input.company_id, definition.key, definition.label, definition.family, owner, revisionId, p.actor_id],
            )
          ).rows[0];
      await c.query(
        "INSERT INTO ppo.cpq_rule_set_revisions(id,workspace_id,company_id,rule_set_id,version,predecessor_id,definition,content_hash,test,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [revisionId, p.workspace_id, input.company_id, input.id, (previous?.version ?? 0) + 1, previous?.id ?? null, JSON.stringify(definition), content_hash, JSON.stringify(test), input.reason, p.actor_id],
      );
      return {
        ...saved,
        audit_details: { revision_id: revisionId, content_hash, summary: test.summary },
      };
    },
    "CpqRuleSet",
    "CpqChanged",
  );
}

export async function acceptRuleSetFinding(p: Principal, id: string, value: unknown) {
  const r = object(value, [...commonKeys, "expected_version", "revision_id", "code", "subject"]);
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    revision_id: uuid(r.revision_id, "revision_id"),
    code: typeof r.code === "string" && /^[A-Z_]{1,40}$/.test(r.code) ? r.code : invalid("code", "Use the finding code."),
    subject: typeof r.subject === "string" && r.subject.length > 0 && r.subject.length <= 200 ? r.subject : invalid("subject", "Use the finding subject."),
  };
  return sharedOperation(
    p,
    input,
    "Cpq:RuleSet:AcceptFinding",
    (c) => root(c, p, input.id),
    async (c, rs) => {
      expected(rs.version, input.expected_version);
      if (rs.owner_id !== p.actor_id)
        throw new AppError(403, "RuleSetOwnerOnly", "Only the rule set owner can accept a blocking finding.");
      if (!(await ownerDuty(c, p, rs.company_id)))
        throw new AppError(403, "RuleSetOwnerUnauthorised", "The owner must still be able to author or review rule sets for this company.");
      currentDraft(rs, input.revision_id);
      const v = await revisionOf(c, p, rs, input.revision_id);
      if (!blocking(v.test).some((f) => f.code === input.code && f.subject === input.subject))
        throw new AppError(409, "RuleSetFindingUnknown", "That is not a blocking finding of this revision.");
      if ((await acceptedFindings(c, p, v.id)).some((a) => a.code === input.code && a.subject === input.subject))
        throw new AppError(409, "RuleSetFindingAccepted", "That finding is already accepted.");
      const acceptance_id = randomUUID();
      await c.query(
        "INSERT INTO ppo.cpq_rule_set_acceptances(id,workspace_id,revision_id,code,subject,reason,accepted_by) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [acceptance_id, p.workspace_id, v.id, input.code, input.subject, input.reason, p.actor_id],
      );
      const saved = (
        await c.query<RuleSetRoot>(
          "UPDATE ppo.cpq_rule_sets SET version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, rs.id, p.actor_id],
        )
      ).rows[0];
      return { ...saved, audit_details: { acceptance_id, revision_id: v.id, code: input.code, subject: input.subject } };
    },
    "CpqRuleSet",
    "CpqChanged",
  );
}

export async function reviewRuleSet(p: Principal, id: string, value: unknown) {
  const r = object(value, [...commonKeys, "expected_version", "revision_id", "content_hash", "outcome"]);
  const input = {
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
    "Cpq:RuleSet:Review",
    (c) => root(c, p, input.id, "cpq.review"),
    async (c, rs) => {
      expected(rs.version, input.expected_version);
      currentDraft(rs, input.revision_id);
      const v = await revisionOf(c, p, rs, input.revision_id);
      if (v.content_hash !== input.content_hash)
        throw new AppError(409, "RuleSetRevisionChanged", "Review the exact content hash.");
      if (v.created_by === p.actor_id)
        throw new AppError(403, "RuleSetIndependentReview", "Another authorised person must review this revision.");
      if (rs.owner_id !== v.created_by && rs.owner_id !== p.actor_id)
        throw new AppError(403, "RuleSetOwnerReview", "The rule set owner must author or review each revision.");
      const test = await isolatedTest(v.definition);
      if (input.outcome === "Approved") {
        if (test.summary.cases === 0 || test.summary.failed !== 0)
          throw new AppError(409, "RuleSetCasesFailed", "Every reference case must pass before approval.");
        const accepted = await acceptedFindings(c, p, v.id);
        const open = blocking(test).filter((f) => !accepted.some((a) => a.code === f.code && a.subject === f.subject));
        if (open.length)
          throw new AppError(409, "RuleSetFindingsOpen", `The owner must accept ${open.length} blocking finding${open.length === 1 ? "" : "s"} first.`);
      }
      const review_id = randomUUID();
      await c.query(
        "INSERT INTO ppo.cpq_rule_set_reviews(id,workspace_id,revision_id,reviewer_id,outcome,content_hash,test,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [review_id, p.workspace_id, v.id, p.actor_id, input.outcome, v.content_hash, JSON.stringify(test), input.reason],
      );
      const saved = (
        await c.query<RuleSetRoot>(
          "UPDATE ppo.cpq_rule_sets SET version=version+1,state=$3,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, rs.id, input.outcome === "Approved" ? "Reviewed" : "Rejected", p.actor_id],
        )
      ).rows[0];
      return { ...saved, audit_details: { review_id, revision_id: v.id, content_hash: v.content_hash, outcome: input.outcome } };
    },
    "CpqRuleSet",
    "CpqChanged",
  );
}

export async function publishRuleSet(p: Principal, id: string, value: unknown) {
  const r = object(value, [...commonKeys, "expected_version", "revision_id", "content_hash", "expected_publication_version"]);
  if (!Number.isSafeInteger(r.expected_publication_version) || Number(r.expected_publication_version) < 0)
    invalid("expected_publication_version", "Use the current published version of this rule set, or zero.");
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    revision_id: uuid(r.revision_id, "revision_id"),
    content_hash: digest(r.content_hash, "content_hash"),
    expected_publication_version: Number(r.expected_publication_version),
  };
  return sharedOperation(
    p,
    input,
    "Cpq:RuleSet:Publish",
    (c) => root(c, p, input.id, "cpq.publish"),
    async (c, rs) => {
      expected(rs.version, input.expected_version);
      currentDraft(rs, input.revision_id, ["Reviewed"]);
      const v = await revisionOf(c, p, rs, input.revision_id);
      if (v.content_hash !== input.content_hash)
        throw new AppError(409, "RuleSetRevisionChanged", "Publish the exact reviewed content hash.");
      const review = (
        await c.query<{ id: string; reviewer_id: string; outcome: string }>(
          "SELECT id,reviewer_id,outcome FROM ppo.cpq_rule_set_reviews WHERE workspace_id=$1 AND revision_id=$2",
          [p.workspace_id, v.id],
        )
      ).rows[0];
      if (!review || review.outcome !== "Approved")
        throw new AppError(409, "RuleSetReviewRequired", "An approved review is required.");
      if ([v.created_by, review.reviewer_id].includes(p.actor_id))
        throw new AppError(403, "RuleSetIndependentPublication", "A third authorised person must publish this rule set.");
      if (!(await hasPermission(c, { ...p, actor_id: review.reviewer_id }, "cpq.review", rs.company_id)))
        throw new AppError(409, "RuleSetReviewerUnauthorised", "The reviewer no longer holds the review duty. Review the revision again.");
      const head = await headOf(c, p, rs.id);
      expected(head?.version ?? 0, input.expected_publication_version);
      const publication_id = randomUUID();
      await c.query(
        "INSERT INTO ppo.cpq_rule_set_publications(id,workspace_id,company_id,rule_set_id,revision_id,review_id,version,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [publication_id, p.workspace_id, rs.company_id, rs.id, v.id, review.id, (head?.version ?? 0) + 1, input.reason, p.actor_id],
      );
      await c.query(
        "INSERT INTO ppo.cpq_rule_set_heads(workspace_id,rule_set_id,publication_id) VALUES($1,$2,$3) ON CONFLICT(workspace_id,rule_set_id) DO UPDATE SET publication_id=excluded.publication_id",
        [p.workspace_id, rs.id, publication_id],
      );
      const saved = (
        await c.query<RuleSetRoot>(
          "UPDATE ppo.cpq_rule_sets SET version=version+1,state='Published',updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, rs.id, p.actor_id],
        )
      ).rows[0];
      return { ...saved, audit_details: { publication_id, revision_id: v.id, content_hash: v.content_hash, published_version: (head?.version ?? 0) + 1 } };
    },
    "CpqRuleSet",
    "CpqChanged",
  );
}

async function headOf(c: QueryClient, p: Principal, ruleSetId: string) {
  return (
    await c.query<{ id: string; version: number; revision_id: string; created_at: Date }>(
      "SELECT pub.id,pub.version,pub.revision_id,pub.created_at FROM ppo.cpq_rule_set_heads h JOIN ppo.cpq_rule_set_publications pub ON (pub.workspace_id,pub.rule_set_id,pub.id)=(h.workspace_id,h.rule_set_id,h.publication_id) WHERE h.workspace_id=$1 AND h.rule_set_id=$2",
      [p.workspace_id, ruleSetId],
    )
  ).rows[0];
}

export async function listRuleSets(p: Principal, query: Record<string, string>) {
  const q = object(query, ["company_id"]);
  const company = uuid(q.company_id, "company_id");
  return transaction(async (c) => {
    await duty(c, p, company);
    return {
      items: (
        await c.query(
          `SELECT s.id,s.key,s.label,s.family,s.owner_id,u.display_name AS owner_name,s.version,s.state,s.current_revision_id,s.updated_at,
             v.test->'summary' AS summary,pub.version AS published_version
           FROM ppo.cpq_rule_sets s
           JOIN ppo.users u ON (u.workspace_id,u.id)=(s.workspace_id,s.owner_id)
           JOIN ppo.cpq_rule_set_revisions v ON (v.workspace_id,v.id)=(s.workspace_id,s.current_revision_id)
           LEFT JOIN ppo.cpq_rule_set_heads h ON (h.workspace_id,h.rule_set_id)=(s.workspace_id,s.id)
           LEFT JOIN ppo.cpq_rule_set_publications pub ON (pub.workspace_id,pub.rule_set_id,pub.id)=(h.workspace_id,h.rule_set_id,h.publication_id)
           WHERE s.workspace_id=$1 AND s.company_id=$2 ORDER BY s.key LIMIT 100`,
          [p.workspace_id, company],
        )
      ).rows,
      capabilities: {
        author: await hasPermission(c, p, "cpq.author", company),
        review: await hasPermission(c, p, "cpq.review", company),
        publish: await hasPermission(c, p, "cpq.publish", company),
      },
      limit: 100,
      synthetic: true,
    };
  });
}

export async function readRuleSet(p: Principal, id: string, query: Record<string, string> = {}) {
  const q = object(query, ["revision_id"]);
  return transaction(async (c) => {
    const rs = await root(c, p, id);
    const selected = await revisionOf(c, p, rs, q.revision_id === undefined ? rs.current_revision_id : uuid(q.revision_id, "revision_id"));
    const owner = (
      await c.query<{ id: string; display_name: string }>("SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2", [p.workspace_id, rs.owner_id])
    ).rows[0];
    return {
      rule_set: rs,
      owner,
      revision: selected,
      acceptances: (
        await c.query(
          "SELECT id,code,subject,reason,accepted_by,created_at FROM ppo.cpq_rule_set_acceptances WHERE workspace_id=$1 AND revision_id=$2 ORDER BY created_at,id",
          [p.workspace_id, selected.id],
        )
      ).rows,
      review:
        (
          await c.query(
            "SELECT id,reviewer_id,outcome,content_hash,reason,created_at FROM ppo.cpq_rule_set_reviews WHERE workspace_id=$1 AND revision_id=$2",
            [p.workspace_id, selected.id],
          )
        ).rows[0] ?? null,
      revisions: (
        await c.query(
          "SELECT id,version,content_hash,test->'summary' AS summary,reason,created_by,created_at FROM ppo.cpq_rule_set_revisions WHERE workspace_id=$1 AND rule_set_id=$2 ORDER BY version DESC LIMIT 100",
          [p.workspace_id, rs.id],
        )
      ).rows,
      publications: (
        await c.query(
          "SELECT id,version,revision_id,review_id,reason,created_by,created_at FROM ppo.cpq_rule_set_publications WHERE workspace_id=$1 AND rule_set_id=$2 ORDER BY version DESC LIMIT 100",
          [p.workspace_id, rs.id],
        )
      ).rows,
      head: (await headOf(c, p, rs.id)) ?? null,
      capabilities: {
        author: await hasPermission(c, p, "cpq.author", rs.company_id),
        review: await hasPermission(c, p, "cpq.review", rs.company_id),
        publish: await hasPermission(c, p, "cpq.publish", rs.company_id),
        accept_findings: rs.owner_id === p.actor_id,
      },
      synthetic: true,
    };
  });
}

/** A replayed receipt is returned only to someone who still holds the duty the command needed. */
export async function ruleSetReceiptAuthority(c: QueryClient, p: Principal, id: string, command: string) {
  const cap: Duty =
    command === "Cpq:RuleSet:Save" ? "cpq.author" : command === "Cpq:RuleSet:Review" ? "cpq.review" : command === "Cpq:RuleSet:Publish" ? "cpq.publish" : "cpq.read";
  const rs = await root(c, p, id, cap);
  if (command === "Cpq:RuleSet:AcceptFinding" && (rs.owner_id !== p.actor_id || !(await ownerDuty(c, p, rs.company_id)))) throw unavailable();
}
