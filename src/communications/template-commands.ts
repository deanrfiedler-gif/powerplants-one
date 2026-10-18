import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { transaction } from "../platform/database";
import { unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import { hasPermission } from "../platform/permissions";
import { companyContext } from "../shared/authority";
import { choice, common, commonKeys, invalid, label, object, uuid } from "../shared/validation";
import { classRules, messageClasses, type MessageClass } from "./model";
import { conflict, insertRow } from "./records";
import { definitionText, family, parseDefinition, sha256 } from "./templates";

// CUS-EMAIL under DK-06's rules: an immutable proposal by one person, then an immutable publication
// of that exact definition by another, who also holds the class's working duty. The latest
// publication for a company and class is current; S2 adds no site-level assignment.
async function allowlist(c: PoolClient, cls: MessageClass) {
  return (
    await c.query("SELECT binding FROM ppo.customer_email_bindings WHERE message_class=$1 ORDER BY binding", [cls])
  ).rows.map((r) => r.binding as string);
}
export async function proposeCustomerEmailTemplate(p: Principal, input: unknown) {
  const r = object(input, [...commonKeys, "company_id", "message_class", "definition"]);
  const cmd = {
    ...common(r),
    company_id: uuid(r.company_id, "company_id"),
    message_class: choice(r.message_class, "message_class", messageClasses),
    definition: r.definition,
  };
  return sharedOperation(
    p,
    cmd,
    "ProposeCustomerEmailTemplate",
    async (c) => {
      await companyContext(c, p, cmd.company_id, null, "template.propose");
      await companyContext(c, p, cmd.company_id, null, "template.read");
      const d = parseDefinition(cmd.definition, await allowlist(c, cmd.message_class));
      if (d.message_class !== cmd.message_class)
        invalid("definition.message_class", "The definition must be for the proposed class.");
      return d;
    },
    async (c, d) => {
      const text = definitionText(d);
      const row = await insertRow(c, "customer_email_template_proposals", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        company_id: cmd.company_id,
        message_class: cmd.message_class,
        definition: text,
        definition_hash: sha256(text),
        author_id: p.actor_id,
        operation_id: cmd.operation_id,
        reason: cmd.reason,
      });
      return {
        id: row.id,
        version: 1,
        state: "Proposed",
        updated_at: row.created_at,
        audit_details: { family, message_class: cmd.message_class, definition_hash: row.definition_hash },
      };
    },
    "CustomerEmailTemplateProposal",
    "CustomerEmailTemplateProposed",
  );
}
export async function publishCustomerEmailTemplate(p: Principal, proposalId: string, input: unknown) {
  const r = object(input, [...commonKeys, "definition_hash", "approval_note"]);
  const cmd = {
    ...common(r),
    proposal_id: uuid(proposalId, "proposal_id"),
    definition_hash:
      typeof r.definition_hash === "string" && /^[a-f0-9]{64}$/.test(r.definition_hash)
        ? r.definition_hash
        : invalid("definition_hash", "Publish the exact reviewed definition hash."),
    approval_note: label(r.approval_note, "approval_note", 2000),
  };
  return sharedOperation(
    p,
    cmd,
    "PublishCustomerEmailTemplate",
    async (c) => {
      const pr = (
        await c.query("SELECT * FROM ppo.customer_email_template_proposals WHERE workspace_id=$1 AND id=$2", [
          p.workspace_id,
          cmd.proposal_id,
        ])
      ).rows[0];
      if (!pr) throw unavailable();
      await companyContext(c, p, pr.company_id, null, "template.read");
      await companyContext(c, p, pr.company_id, null, "template.publish");
      await companyContext(c, p, pr.company_id, null, classRules[pr.message_class as MessageClass].working);
      return pr;
    },
    async (c, pr) => {
      if (pr.author_id === p.actor_id)
        conflict("IndependentPublisherRequired", "The person who proposed a template cannot publish it.");
      if (pr.definition_hash !== cmd.definition_hash)
        conflict("DefinitionChanged", "Publish only the exact definition you reviewed.");
      if (
        (await c.query("SELECT 1 FROM ppo.customer_email_templates WHERE workspace_id=$1 AND proposal_id=$2", [p.workspace_id, pr.id]))
          .rowCount
      )
        conflict("AlreadyPublished", "This proposal is already published.");
      parseDefinition(JSON.parse(pr.definition), await allowlist(c, pr.message_class));
      const next =
        Number(
          (
            await c.query(
              "SELECT coalesce(max(version),0) AS v FROM ppo.customer_email_templates WHERE workspace_id=$1 AND company_id=$2 AND message_class=$3",
              [p.workspace_id, pr.company_id, pr.message_class],
            )
          ).rows[0].v,
        ) + 1;
      const row = await insertRow(c, "customer_email_templates", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        company_id: pr.company_id,
        message_class: pr.message_class,
        version: next,
        proposal_id: pr.id,
        definition: pr.definition,
        definition_hash: pr.definition_hash,
        publisher_id: p.actor_id,
        approval_note: cmd.approval_note,
        operation_id: cmd.operation_id,
        reason: cmd.reason,
      });
      return {
        id: row.id,
        version: row.version,
        state: "Published",
        updated_at: row.published_at,
        audit_details: { family, message_class: pr.message_class, proposal_id: pr.id, definition_hash: pr.definition_hash },
      };
    },
    "CustomerEmailTemplate",
    "CustomerEmailTemplatePublished",
  );
}
export async function listCustomerEmailTemplates(p: Principal, query: Record<string, string>) {
  const q = object(query, ["company_id"]);
  const company = uuid(q.company_id, "company_id");
  return transaction(async (c) => {
    await companyContext(c, p, company, null, "template.read");
    const proposals = (
      await c.query(
        `SELECT t.id,t.message_class,t.definition,t.definition_hash,t.reason,t.created_at,u.display_name AS author,
         (SELECT id FROM ppo.customer_email_templates x WHERE x.workspace_id=t.workspace_id AND x.proposal_id=t.id) AS publication_id
         FROM ppo.customer_email_template_proposals t JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.author_id)
         WHERE t.workspace_id=$1 AND t.company_id=$2 ORDER BY t.created_at,t.id`,
        [p.workspace_id, company],
      )
    ).rows;
    const publications = (
      await c.query(
        `SELECT t.id,t.message_class,t.version,t.proposal_id,t.definition,t.definition_hash,t.approval_note,t.published_at,u.display_name AS publisher
         FROM ppo.customer_email_templates t JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.publisher_id)
         WHERE t.workspace_id=$1 AND t.company_id=$2 ORDER BY t.message_class,t.version DESC`,
        [p.workspace_id, company],
      )
    ).rows;
    const can_publish = await hasPermission(c, p, "template.publish", company);
    return {
      family,
      company_id: company,
      classes: messageClasses.map((cls) => {
        const mine = publications.filter((x) => x.message_class === cls);
        const shape = (x: (typeof publications)[number]) => ({
          id: x.id,
          version: x.version,
          proposal_id: x.proposal_id,
          definition: JSON.parse(x.definition),
          definition_hash: x.definition_hash,
          approval_note: x.approval_note,
          published_by: x.publisher,
          published_at: x.published_at.toISOString(),
        });
        return {
          message_class: cls,
          code: classRules[cls].code,
          label: classRules[cls].label,
          current: mine[0] ? shape(mine[0]) : null,
          history: mine.map(shape),
        };
      }),
      proposals: proposals.map((x) => ({
        id: x.id,
        message_class: x.message_class,
        definition: JSON.parse(x.definition),
        definition_hash: x.definition_hash,
        proposed_by: x.author,
        proposed_at: x.created_at.toISOString(),
        reason: x.reason,
        publication_id: x.publication_id,
      })),
      can_publish,
    };
  });
}
