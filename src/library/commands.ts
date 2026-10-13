import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { canonical, sharedOperation } from "../platform/operations";
import { digest } from "../documents/store";
import { companyContext, scopedOwner } from "../shared/authority";
import { visible } from "../shared/reads";
import { narrative, uuid } from "../shared/validation";
import {
  documentContext,
  revisionContext,
  current,
  targetContext,
} from "./context";
import {
  capture,
  exactBytes,
  nativeSource,
  recoverExact,
  sourceAuthority,
} from "./sources";
import {
  commandInput,
  findingInput,
  linkInput,
  reviewInput,
  revisionInput,
} from "./validation";
import type { DocumentRow, Duty, Revision } from "./types";

const conflict = (code: string, message: string): never => {
  throw new AppError(409, code, message);
};
async function usable(
  c: PoolClient,
  p: Principal,
  d: DocumentRow,
  r: Revision,
) {
  if (!(await sourceAuthority(c, p, r.source)).current)
    conflict(
      "SourceSuperseded",
      "The owning workflow no longer treats this exact source as current.",
    );
  await exactBytes(c, p, d.id, r.id, r.source);
}
async function bump(
  c: PoolClient,
  p: Principal,
  d: DocumentRow,
  revision_id = d.current_revision_id,
  state = d.state,
) {
  return (
    await c.query<DocumentRow>(
      "UPDATE ppo.library_documents SET version=version+1,current_revision_id=$3,state=$4,updated_by=$5,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
      [p.workspace_id, d.id, revision_id, state, p.actor_id],
    )
  ).rows[0];
}
async function evidence(
  c: PoolClient,
  p: Principal,
  d: DocumentRow,
  revision_id: string,
  input: { operation_id: string; reason: string },
  command: string,
  table?: string,
  record_id?: string,
) {
  const id = randomUUID();
  // Table names come only from fixed call sites, never request input.
  const payload = table
    ? (
        await c.query(
          `SELECT to_jsonb(t) AS value FROM ppo.${table} t WHERE workspace_id=$1 AND id=$2`,
          [p.workspace_id, record_id],
        )
      ).rows[0].value
    : {};
  await c.query(
    `INSERT INTO ppo.library_events(id,workspace_id,document_id,revision_id,document_version,command,actor_id,operation_id,reason,document_snapshot,payload)
    SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,to_jsonb(d),$10 FROM ppo.library_documents d WHERE workspace_id=$2 AND id=$3`,
    [
      id,
      p.workspace_id,
      d.id,
      revision_id,
      d.version,
      command,
      p.actor_id,
      input.operation_id,
      input.reason,
      payload,
    ],
  );
  return {
    id: d.id,
    version: d.version,
    state: d.state,
    updated_at: d.updated_at,
    audit_details: { event_id: id, revision_id },
  };
}
async function insertRevision(
  c: PoolClient,
  p: Principal,
  d: DocumentRow,
  input: ReturnType<typeof revisionInput>,
  command: string,
  number: number,
) {
  await scopedOwner(
    c,
    p,
    input.owner_id,
    d.company_id,
    d.site_id ?? undefined,
    "document.register",
  );
  const source = await capture(
    c,
    p,
    input.source,
    d,
    input.revision_id,
    input.operation_id,
    digest(
      canonical({
        command: "Library:" + command,
        ...input,
        ...(command === "Revise" ? { document_id: d.id } : {}),
      }),
    ),
  );
  await c.query(
    `INSERT INTO ppo.library_revisions(id,workspace_id,document_id,revision,document_version,title,document_type,applicability,audience,owner_id,source,created_by,reason)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      input.revision_id,
      p.workspace_id,
      d.id,
      number,
      d.version,
      input.title,
      input.document_type,
      input.applicability,
      input.audience,
      input.owner_id,
      source,
      p.actor_id,
      input.reason,
    ],
  );
}
export async function createDocument(p: Principal, value: unknown) {
  const input = revisionInput(value, true);
  if (!("id" in input)) throw Error("Create parser invariant");
  const { id, company_id, organisation_id } = input;
  const site_id = input.site_id ?? null;
  return sharedOperation(
    p,
    input,
    "Library:Create",
    async (c) => {
      await companyContext(c, p, company_id, site_id, "document.read");
      await companyContext(c, p, company_id, site_id, "document.register");
      const o = await visible(c, p, "Organisation", organisation_id);
      if (o.company_id !== company_id) throw unavailable();
      if (
        site_id &&
        !(
          await c.query(
            "SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND organisation_id=$4 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",
            [p.workspace_id, company_id, site_id, organisation_id],
          )
        ).rowCount
      )
        throw unavailable();
      if (input.source.kind !== "SyntheticText")
        await nativeSource(c, p, input.source.kind, input.source.issue_id);
      const existing = (
        await c.query(
          "SELECT 1 FROM ppo.library_documents WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, id],
        )
      ).rowCount;
      if (existing) {
        const { d } = await documentContext(c, p, id, "document.register");
        await revisionContext(c, p, d, input.revision_id);
      }
    },
    async (c) => {
      const d = (
        await c.query<DocumentRow>(
          `INSERT INTO ppo.library_documents(id,workspace_id,company_id,organisation_id,site_id,version,current_revision_id,state,created_by,updated_by)
      VALUES($1,$2,$3,$4,$5,1,$6,'Current',$7,$7) RETURNING *`,
          [
            id,
            p.workspace_id,
            company_id,
            organisation_id,
            site_id,
            input.revision_id,
            p.actor_id,
          ],
        )
      ).rows[0];
      await insertRevision(c, p, d, input, "Create", 1);
      return evidence(
        c,
        p,
        d,
        input.revision_id,
        input,
        "Create",
        "library_revisions",
        input.revision_id,
      );
    },
    "LibraryDocument",
    "SharedRecordUpdated",
  );
}
export async function reviseDocument(p: Principal, id: string, value: unknown) {
  const parsed = revisionInput(value);
  if (!("expected_version" in parsed)) throw Error("Revision parser invariant");
  const input = { ...parsed, document_id: uuid(id, "document_id") };
  return sharedOperation(
    p,
    input,
    "Library:Revise",
    async (c) => {
      const ctx = await documentContext(
        c,
        p,
        input.document_id,
        "document.register",
      );
      await revisionContext(c, p, ctx.d, input.observed_revision_id!);
      if (input.source.kind !== "SyntheticText")
        await nativeSource(c, p, input.source.kind, input.source.issue_id);
      return ctx;
    },
    async (c, { d, r }) => {
      current(d, input.observed_revision_id!, input.expected_version!);
      const next = await bump(c, p, d, input.revision_id);
      await insertRevision(c, p, next, parsed, "Revise", r.revision + 1);
      return evidence(
        c,
        p,
        next,
        input.revision_id,
        input,
        "Revise",
        "library_revisions",
        input.revision_id,
      );
    },
    "LibraryDocument",
    "SharedRecordUpdated",
  );
}
async function authorise(
  c: PoolClient,
  p: Principal,
  id: string,
  revision_id: string,
  duty: Duty,
) {
  const { d } = await documentContext(c, p, id, duty);
  return { d, r: await revisionContext(c, p, d, revision_id) };
}
export async function recordFinding(p: Principal, id: string, value: unknown) {
  const input = {
      ...findingInput(value),
      document_id: uuid(id, "document_id"),
    },
    command = "Finding:" + input.action;
  return sharedOperation(
    p,
    input,
    "Library:" + command,
    (c) =>
      authorise(
        c,
        p,
        input.document_id,
        input.revision_id,
        input.action === "Accept" ? "document.review" : "document.register",
      ),
    async (c, { d, r }) => {
      current(d, r.id, input.expected_version);
      const next = await bump(c, p, d);
      if (input.action === "Open") {
        await usable(c, p, d, r);
        await scopedOwner(
          c,
          p,
          input.owner_id!,
          d.company_id,
          d.site_id ?? undefined,
          "document.register",
        );
        if (
          Number(
            (
              await c.query(
                "SELECT count(*) FROM ppo.library_findings WHERE workspace_id=$1 AND revision_id=$2",
                [p.workspace_id, r.id],
              )
            ).rows[0].count,
          ) >= 100
        )
          conflict(
            "FindingLimit",
            "This revision has reached the bounded finding limit.",
          );
        await c.query(
          `INSERT INTO ppo.library_findings(id,workspace_id,document_id,revision_id,document_version,text,owner_id,due_date,state,created_by)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,'Open',$9)`,
          [
            input.finding_id,
            p.workspace_id,
            d.id,
            r.id,
            next.version,
            input.text,
            input.owner_id,
            input.due_date,
            p.actor_id,
          ],
        );
      } else {
        const f = (
          await c.query(
            "SELECT * FROM ppo.library_findings WHERE workspace_id=$1 AND document_id=$2 AND revision_id=$3 AND id=$4",
            [p.workspace_id, d.id, r.id, input.finding_id],
          )
        ).rows[0];
        if (!f) throw unavailable();
        if (input.action === "Respond") {
          if (f.state !== "Open")
            conflict(
              "FindingState",
              "Only an open finding accepts a response.",
            );
          if (f.owner_id !== p.actor_id) throw unavailable();
          await c.query(
            "UPDATE ppo.library_findings SET document_version=$3,state='AwaitingReview',response=$4,response_by=$5,response_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, f.id, next.version, input.text, p.actor_id],
          );
        } else {
          if (f.state !== "AwaitingReview")
            conflict(
              "FindingState",
              "A response must await review before acceptance.",
            );
          if (f.response_by === p.actor_id)
            conflict(
              "IndependentReviewRequired",
              "The response author cannot accept their own response.",
            );
          await c.query(
            "UPDATE ppo.library_findings SET document_version=$3,state='Closed',acceptance=$4,accepted_by=$5,accepted_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, f.id, next.version, input.text, p.actor_id],
          );
        }
      }
      return evidence(
        c,
        p,
        next,
        r.id,
        input,
        command,
        "library_findings",
        input.finding_id,
      );
    },
    "LibraryDocument",
    "SharedRecordUpdated",
  );
}
export async function reviewDocument(p: Principal, id: string, value: unknown) {
  const input = { ...reviewInput(value), document_id: uuid(id, "document_id") };
  return sharedOperation(
    p,
    input,
    "Library:Review",
    (c) =>
      authorise(c, p, input.document_id, input.revision_id, "document.review"),
    async (c, { d, r }) => {
      current(d, r.id, input.expected_version);
      if (r.created_by === p.actor_id || r.source.author_id === p.actor_id)
        conflict(
          "IndependentReviewRequired",
          "Review requires someone other than the revision registrar and source author.",
        );
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.library_reviews WHERE workspace_id=$1 AND revision_id=$2",
            [p.workspace_id, r.id],
          )
        ).rowCount
      )
        conflict(
          "DecisionRetained",
          "This revision already has a decision. Register a successor for another review.",
        );
      await usable(c, p, d, r);
      const findings = (
        await c.query(
          "SELECT to_jsonb(f) AS value FROM ppo.library_findings f WHERE workspace_id=$1 AND revision_id=$2 ORDER BY id",
          [p.workspace_id, r.id],
        )
      ).rows.map((x) => x.value);
      if (
        input.outcome === "Reviewed" &&
        findings.some((f) => f.state !== "Closed")
      )
        conflict(
          "FindingsUnresolved",
          "Resolve every finding before marking this revision reviewed.",
        );
      const next = await bump(c, p, d),
        review_id = randomUUID();
      await c.query(
        `INSERT INTO ppo.library_reviews(id,workspace_id,document_id,revision_id,document_version,outcome,purpose,rationale,content_hash,findings_snapshot,reviewer_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          review_id,
          p.workspace_id,
          d.id,
          r.id,
          next.version,
          input.outcome,
          input.purpose,
          input.rationale,
          r.source.content_hash,
          JSON.stringify(findings),
          p.actor_id,
        ],
      );
      return evidence(
        c,
        p,
        next,
        r.id,
        input,
        "Review",
        "library_reviews",
        review_id,
      );
    },
    "LibraryDocument",
    "SharedRecordUpdated",
  );
}
export async function linkDocument(p: Principal, id: string, value: unknown) {
  const input = { ...linkInput(value), document_id: uuid(id, "document_id") },
    command = "Link:" + input.action;
  return sharedOperation(
    p,
    input,
    "Library:" + command,
    async (c) => {
      const ctx = await authorise(
        c,
        p,
        input.document_id,
        input.revision_id,
        "document.register",
      );
      const link =
        input.action === "Retire"
          ? (
              await c.query(
                "SELECT * FROM ppo.library_links WHERE workspace_id=$1 AND document_id=$2 AND revision_id=$3 AND id=$4",
                [p.workspace_id, ctx.d.id, ctx.r.id, input.link_id],
              )
            ).rows[0]
          : null;
      if (input.action === "Retire" && !link) throw unavailable();
      await targetContext(
        c,
        p,
        input.target_kind ?? link.target_kind,
        input.target_id ?? link.target_id,
        ctx.d,
      );
      return { ...ctx, link };
    },
    async (c, { d, r, link }) => {
      if (input.action === "Add") {
        current(d, r.id, input.expected_version);
        await usable(c, p, d, r);
      } else if (d.version !== input.expected_version)
        conflict(
          "StaleVersion",
          "The document changed. Reload its exact current version.",
        );
      if (link?.retired_at)
        conflict("LinkRetired", "This exact reference is already retired.");
      const next = await bump(c, p, d);
      if (input.action === "Add") {
        if (
          Number(
            (
              await c.query(
                "SELECT count(*) FROM ppo.library_links WHERE workspace_id=$1 AND document_id=$2 AND retired_at IS NULL",
                [p.workspace_id, d.id],
              )
            ).rows[0].count,
          ) >= 100
        )
          conflict(
            "LinkLimit",
            "This document has reached the active reference limit.",
          );
        await c.query(
          `INSERT INTO ppo.library_links(id,workspace_id,document_id,revision_id,document_version,target_kind,target_id,purpose,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            input.link_id,
            p.workspace_id,
            d.id,
            r.id,
            next.version,
            input.target_kind,
            input.target_id,
            input.purpose,
            p.actor_id,
          ],
        );
      } else
        await c.query(
          "UPDATE ppo.library_links SET document_version=$3,retired_by=$4,retired_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, input.link_id, next.version, p.actor_id],
        );
      return evidence(
        c,
        p,
        next,
        r.id,
        input,
        command,
        "library_links",
        input.link_id,
      );
    },
    "LibraryDocument",
    "SharedRecordUpdated",
  );
}
export async function withdrawDocument(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = {
    ...commandInput(value, []).base,
    document_id: uuid(id, "document_id"),
  };
  return sharedOperation(
    p,
    input,
    "Library:Withdraw",
    (c) =>
      authorise(
        c,
        p,
        input.document_id,
        input.revision_id,
        "document.register",
      ),
    async (c, { d, r }) => {
      current(d, r.id, input.expected_version);
      return evidence(
        c,
        p,
        await bump(c, p, d, r.id, "Withdrawn"),
        r.id,
        input,
        "Withdraw",
      );
    },
    "LibraryDocument",
    "SharedRecordUpdated",
  );
}
export async function recoverDocument(
  p: Principal,
  id: string,
  value: unknown,
) {
  const { base, x } = commandInput(value, ["text"]);
  const input = {
    ...base,
    text: narrative(x.text, "text", 20000),
    document_id: uuid(id, "document_id"),
  };
  return sharedOperation(
    p,
    input,
    "Library:Recover",
    (c) =>
      authorise(
        c,
        p,
        input.document_id,
        input.revision_id,
        "document.register",
      ),
    async (c, { d, r }) => {
      if (d.version !== input.expected_version)
        conflict(
          "StaleVersion",
          "The document changed. Reload its exact current version.",
        );
      await recoverExact(p, d.id, r.id, r.source, input.text);
      await exactBytes(c, p, d.id, r.id, r.source);
      return evidence(c, p, await bump(c, p, d), r.id, input, "Recover");
    },
    "LibraryDocument",
    "SharedRecordUpdated",
  );
}
