// The context panel read (PPO-CONV-T1C-DESIGN 11; proposal section 3; S5). It is rebuilt for each viewer on every read
// and stores nothing: every group is drawn from reads PPO already has for deals and projects, under the viewer's own
// access. An item the viewer cannot open is left out entirely, title included. No pins or exclusions (T2, Carl only).
import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import type { QueryClient } from "../platform/permissions";
import { visibleOpportunity } from "../crm/context";
import { projectRow, tasksFor } from "../projects/service";
import { projectVisibility } from "../projects/visibility";
import { handoverRecord } from "../sales/handover-service";
import { deliverySalesSourcesInSnapshot } from "../sales/delivery-binding";
import { visibleWorkOrder } from "../service/work-orders";
import { linkedDocuments } from "../library/reads";
import { opportunityCommercial } from "../estimating/reads";
import { visible } from "../shared/reads";
import { uuid } from "../shared/validation";
import { recordOpenable, visibleThread, type ThreadRow } from "./access";
import {
  civilDate,
  mentionedBy,
  mergeItems,
  nameList,
  recordFacts,
  recordNoun,
  type ContextItem,
  type ThreadContext,
} from "./context-model";
import type { AnchorType } from "./model";

// A read the viewer is refused (403) or that finds nothing they may see (404) leaves its item out; anything else fails.
const hidden = (e: unknown) => e instanceof AppError && [403, 404].includes(e.status);
async function unlessHidden<T>(read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch (e) {
    if (hidden(e)) return null;
    throw e;
  }
}
// The deal page's own address; /crm/opportunities only redirects there.
const recordHref = { Opportunity: "/sales/opportunities", Project: "/projects" } as const;
const recordTitle = (type: AnchorType, number: string, title: string) =>
  `${type === "Opportunity" ? "Deal" : "Project"} ${number} · ${title}`;

// A customer contact's phone and email show only to a reader who may read the person (shared.read and the person's
// visibility, as the People page applies). Anyone who opens the record still sees the name and role it carries.
async function contactDetails(c: QueryClient, p: Principal, person: string) {
  const row = await unlessHidden(() => visible(c, p, "Person", person));
  return row
    ? { href: `/people/${person}`, phone: (row.phone as string | null) ?? null, email: (row.email as string | null) ?? null }
    : { href: null };
}

async function dealSection(c: QueryClient, p: Principal, t: ThreadRow) {
  const o = await visibleOpportunity(c, p, t.anchor_id);
  const names = (
    await c.query(
      `SELECT u.display_name AS owner_name,r.display_name AS organisation_name,s.display_name AS site_name,pe.display_name AS contact_name
       FROM ppo.opportunities o JOIN ppo.users u ON (u.workspace_id,u.id)=(o.workspace_id,o.owner_id)
       JOIN ppo.organisations r ON (r.workspace_id,r.id)=(o.workspace_id,o.organisation_id)
       LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(o.workspace_id,o.site_id)
       LEFT JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(o.workspace_id,o.primary_person_id)
       WHERE o.workspace_id=$1 AND o.id=$2`,
      [p.workspace_id, o.id],
    )
  ).rows[0];
  const record = {
    type: "Opportunity" as const,
    id: o.id,
    title: recordTitle("Opportunity", o.display_number, o.title),
    href: `${recordHref.Opportunity}/${o.id}`,
    facts: recordFacts({
      type: "Opportunity",
      state: o.close_outcome === "Open" ? o.stage_id : o.close_outcome,
      owner: names.owner_name,
      customer: [names.organisation_name, names.site_name].filter(Boolean).join(" · "),
      dates: [{ label: "Expected close", value: o.expected_close_date ?? null }],
    }),
    why: "The record this thread is about",
  };
  const contacts: ContextItem[] = [
    { key: `User:${o.owner_id}`, title: names.owner_name, detail: "Deal owner", why: ["On the deal"], href: null },
  ];
  if (o.primary_person_id)
    contacts.push({
      key: `Person:${o.primary_person_id}`,
      title: names.contact_name,
      detail: `Customer contact · ${names.organisation_name}`,
      why: ["On the deal"],
      ...(await contactDetails(c, p, o.primary_person_id)),
    });
  // Delivery bound from this deal's handovers: each step re-reads the handover under the viewer's access (the read
  // the Projects and Service pages use the other way round) and then the project or work order itself.
  const related: ContextItem[] = [];
  const bindings = (await c.query("SELECT to_regclass('ppo.sales_delivery_bindings') AS r")).rows[0].r
    ? (
        await c.query(
          `SELECT b.handover_id,b.project_id,b.work_order_id FROM ppo.sales_delivery_bindings b
           JOIN ppo.sales_handovers h ON (h.workspace_id,h.id)=(b.workspace_id,b.handover_id)
           WHERE b.workspace_id=$1 AND h.opportunity_id=$2 ORDER BY b.recorded_at`,
          [p.workspace_id, o.id],
        )
      ).rows
    : [];
  for (const b of bindings) {
    if (!(await unlessHidden(() => handoverRecord(c, p, b.handover_id)))) continue;
    if (b.project_id) {
      const pj = (
        await c.query(
          `SELECT pj.id,pj.display_number,pj.title,pj.lifecycle FROM ppo.projects pj WHERE pj.workspace_id=$1 AND pj.id=$3 AND ${projectVisibility("pj")}`,
          [p.workspace_id, p.actor_id, b.project_id],
        )
      ).rows[0];
      if (pj)
        related.push({
          key: `Project:${pj.id}`,
          title: `Project ${pj.display_number} · ${pj.title}`,
          detail: pj.lifecycle,
          why: ["Delivered from the deal"],
          href: `/projects/${pj.id}`,
        });
    }
    if (b.work_order_id) {
      const w = await unlessHidden(() => visibleWorkOrder(c, p, b.work_order_id));
      if (w)
        related.push({
          key: `WorkOrder:${w.id}`,
          title: `Work order ${w.display_number}`,
          detail: w.status,
          why: ["Delivered from the deal"],
          href: `/service/work-orders/${w.id}`,
        });
    }
  }
  return { record, contacts, related };
}

async function projectSection(c: QueryClient, p: Principal, t: ThreadRow) {
  const pj = await projectRow(c, p, t.anchor_id);
  const record = {
    type: "Project" as const,
    id: pj.id,
    title: recordTitle("Project", pj.display_number, pj.title),
    href: `${recordHref.Project}/${pj.id}`,
    facts: recordFacts({
      type: "Project",
      state: pj.lifecycle ?? "Active",
      owner: pj.coordinator_name,
      customer: [pj.customer_name, pj.site_name].filter(Boolean).join(" · "),
      dates: [{ label: "Target date", value: pj.target_date ?? null }],
    }),
    why: "The record this thread is about",
  };
  const contacts: ContextItem[] = [
    { key: `User:${pj.coordinator_id}`, title: pj.coordinator_name, detail: "Project coordinator", why: ["On the project"], href: null },
  ];
  const site = (
    await c.query(
      `SELECT pe.id,pe.display_name,s.display_name AS site_name FROM ppo.sites s JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(s.workspace_id,s.primary_contact_id)
       WHERE s.workspace_id=$1 AND s.id=$2`,
      [p.workspace_id, pj.site_id],
    )
  ).rows[0];
  // The project page does not show the site's contact, so a reader who may not read the person sees no entry at all.
  const siteContact = site ? await contactDetails(c, p, site.id) : null;
  if (siteContact?.href)
    contacts.push({
      key: `Person:${site.id}`,
      title: site.display_name,
      detail: `Site contact · ${site.site_name}`,
      why: ["On the project's site"],
      ...siteContact,
    });
  // Task owners as the Project overview's team shows them: an external owner the reader cannot see is left out.
  const owners = new Map<string, { name: string; person: string | null; tasks: number }>();
  for (const task of await tasksFor(c, p, pj.id)) {
    const id = task.external_owner_id ?? task.owner_id;
    if (!id || task.owner_unavailable) continue;
    const key = `${task.external_owner_id ? "Person" : "User"}:${id}`;
    const seen = owners.get(key) ?? { name: task.owner_name ?? "", person: task.external_owner_id, tasks: 0 };
    seen.tasks += 1;
    owners.set(key, seen);
  }
  for (const [key, owner] of owners)
    contacts.push({
      key,
      title: owner.name,
      detail: `${owner.person ? "External task owner" : "Task owner"} · ${owner.tasks} ${owner.tasks === 1 ? "task" : "tasks"}`,
      why: ["Owns a task on the project"],
      ...(owner.person ? await contactDetails(c, p, owner.person) : { href: null }),
    });
  // The deals this project was delivered from, through the read the Project overview uses; restricted ones are left out.
  const related: ContextItem[] = [];
  for (const source of (await deliverySalesSourcesInSnapshot(c, p, "Projects", pj.id)).items)
    if (source.access === "Available")
      related.push({
        key: `Opportunity:${source.opportunity_id}`,
        title: `Deal ${source.opportunity_reference} · ${source.opportunity_title}`,
        detail: "Won deal",
        why: ["Handed over to the project"],
        href: `${recordHref.Opportunity}/${source.opportunity_id}`,
      });
  return { record, contacts, related };
}

// Files and documents for a deal: its quotations at each revision, through the read behind the deal page's "Deal
// documents" (estimating.read, then each quotation's own check). Each opens in Estimating, which owns it.
async function dealDocuments(p: Principal, deal: string): Promise<ContextItem[]> {
  const commercial = await unlessHidden(() => opportunityCommercial(p, deal));
  return (commercial?.quotes ?? []).map((q) => ({
    key: `Quotation:${q.id}`,
    title: `${q.display_number} · rev ${q.version}`,
    detail: `${q.release ? "Release quotation" : "Draft quotation"} · ${q.option_label ? `Option ${q.option_label}` : q.estimate_display_number}`,
    why: ["Linked on the deal"],
    href: `/estimating/quotes/${q.id}`,
  }));
}

// Files and documents for a project (DK-01): controlled documents linked to it, each at its linked revision, through the
// library's own access-checked read. It opens in the library, the owning system, at that exact revision.
async function projectDocuments(p: Principal, project: string): Promise<ContextItem[]> {
  const linked = await unlessHidden(() => linkedDocuments(p, { target_kind: "Project", target_id: project, limit: "25" }));
  return (linked?.items ?? []).map((x) => ({
    key: `Document:${x.document.id}:${x.revision.id}`,
    title: `${x.revision.title} · rev ${x.revision.revision}`,
    detail: `${x.document.display_number} · ${x.purpose}`,
    why: ["Linked on the project"],
    href: `/api/v1/document-library/${x.document.id}/content?revision_id=${x.revision.id}`,
  }));
}

export async function readThreadContext(p: Principal, id: string): Promise<ThreadContext> {
  const threadId = uuid(id, "thread_id");
  const context = await transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    // T1-1: the panel exists only for a reader of the thread; a refusal is the thread's own "unavailable".
    const t = await visibleThread(c, p, threadId);
    const anchor = t.anchor_type === "Opportunity" ? await dealSection(c, p, t) : await projectSection(c, p, t);

    // Records mentioned in the thread, drawn from the reader's own access (T1-4): one the reader cannot open is left out.
    const mentions = (
      await c.query(
        `SELECT mm.record_type,mm.record_id,array_agg(DISTINCT u.display_name ORDER BY u.display_name) AS authors
         FROM ppo.conversation_mentions mm JOIN ppo.conversation_messages m ON (m.workspace_id,m.id)=(mm.workspace_id,mm.message_id)
         JOIN ppo.users u ON (u.workspace_id,u.id)=(m.workspace_id,m.author_id)
         WHERE mm.workspace_id=$1 AND m.thread_id=$2 AND mm.kind='Record' GROUP BY mm.record_type,mm.record_id
         ORDER BY min(m.sequence),mm.record_type,mm.record_id`,
        [p.workspace_id, t.id],
      )
    ).rows as { record_type: AnchorType; record_id: string; authors: string[] }[];
    const mentioned: ContextItem[] = [];
    for (const m of mentions) {
      if (m.record_type === t.anchor_type && m.record_id === t.anchor_id) continue;
      if (!(await recordOpenable(c, p.workspace_id, p.actor_id, m.record_type, m.record_id))) continue;
      const row = (
        await c.query(
          `SELECT display_number,title FROM ppo.${m.record_type === "Opportunity" ? "opportunities" : "projects"} WHERE workspace_id=$1 AND id=$2`,
          [p.workspace_id, m.record_id],
        )
      ).rows[0];
      mentioned.push({
        key: `${m.record_type}:${m.record_id}`,
        title: recordTitle(m.record_type, row.display_number, row.title),
        detail: null,
        why: [mentionedBy(m.authors)],
        href: `${recordHref[m.record_type]}/${m.record_id}`,
      });
    }

    // This thread: who is in it and the questions still open, with who owes them.
    const people = (
      await c.query(
        `SELECT part.user_id,u.display_name FROM ppo.conversation_participants part JOIN ppo.users u ON (u.workspace_id,u.id)=(part.workspace_id,part.user_id)
         WHERE part.workspace_id=$1 AND part.thread_id=$2 ORDER BY part.added_at,part.user_id`,
        [p.workspace_id, t.id],
      )
    ).rows as { user_id: string; display_name: string }[];
    const creator = (await c.query("SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2", [p.workspace_id, t.created_by])).rows[0]
      ?.display_name as string;
    const asks = (
      await c.query(
        `SELECT k.id,k.question,k.reply_by::text AS reply_by,ar.display_name AS asker_name,ad.display_name AS asked_name
         FROM ppo.conversation_asks k JOIN ppo.users ar ON (ar.workspace_id,ar.id)=(k.workspace_id,k.asker_id)
         JOIN ppo.users ad ON (ad.workspace_id,ad.id)=(k.workspace_id,k.asked_id)
         WHERE k.workspace_id=$1 AND k.thread_id=$2 AND k.state='Open' ORDER BY k.created_at,k.id`,
        [p.workspace_id, t.id],
      )
    ).rows as { id: string; question: string; reply_by: string | null; asker_name: string; asked_name: string }[];
    const thread: ContextItem[] = [
      {
        key: `Participants:${t.id}`,
        title: nameList(people.map((x) => x.display_name)),
        detail: people.length === 1 ? "Participant" : `${people.length} participants`,
        why: [`Started by ${creator}`],
        href: null,
      },
      ...asks.map((k) => ({
        key: `Ask:${k.id}`,
        title: `${k.asked_name}: ${k.question}`,
        detail: `Open question${k.reply_by ? ` · reply by ${civilDate(k.reply_by)}` : ""}`,
        why: [`Asked by ${k.asker_name}`],
        href: null,
      })),
    ];
    return {
      thread_id: t.id,
      anchor,
      related: mergeItems([...anchor.related, ...mentioned]),
      thread,
      type: t.anchor_type,
      anchor_id: t.anchor_id,
    };
  });
  const documents = context.type === "Project" ? await projectDocuments(p, context.anchor_id) : await dealDocuments(p, context.anchor_id);
  return {
    thread_id: context.thread_id,
    observed_at: new Date().toISOString(),
    record: context.anchor.record,
    documents,
    contacts: mergeItems(context.anchor.contacts),
    related: context.related,
    thread: context.thread,
    noun: recordNoun[context.type],
  };
}
