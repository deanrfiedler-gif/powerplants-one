import { database } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import { hasPermission } from "../platform/permissions";
import {
  choice,
  common,
  commonKeys,
  instant,
  invalid,
  label,
  narrative,
  object,
  uuid,
  version,
} from "../shared/validation";
import { visibleTicket } from "./tickets";

// Customer words are retained evidence. Recording them cannot change the assessment.
export async function recordTicketStatement(p: Principal, id: string, input: unknown) {
  const r = object(input, [...commonKeys, "id", "expected_version", "body", "source_label", "occurred_at", "channel"]);
  const command = {
    ...common(r),
    ticket_id: uuid(id, "ticket_id"),
    id: uuid(r.id, "id"),
    expected_version: version(r.expected_version),
    body: narrative(r.body, "body"),
    source_label: label(r.source_label, "source_label", 200),
    occurred_at: instant(r.occurred_at, "occurred_at"),
    channel: choice(r.channel, "channel", ["Phone", "Email", "Manual", "PlannedMaintenance", "Other"]),
  };
  if (Date.parse(command.occurred_at) > Date.now() + 300000)
    invalid("occurred_at", "Statement time cannot be in the future (five-minute clock tolerance).");
  return sharedOperation(
    p,
    command,
    "RecordTicketStatement",
    async (c) => {
      const t = await visibleTicket(c, p, id, true);
      if (!(await hasPermission(c, p, "service.ticket.edit", t.company_id, t.site_id ?? undefined)))
        throw new AppError(403, "Forbidden", "This identity cannot record customer statements.");
      return t;
    },
    async (c, t) => {
      if (t.version !== command.expected_version)
        throw new AppError(
          409,
          "VersionConflict",
          "This request changed. Keep your statement and compare the current revision.",
        );
      if (!["New", "NeedsInformation", "Triaged"].includes(t.status))
        throw new AppError(
          422,
          "TICKET_STATE_INVALID",
          "Customer statement capture is available during intake and triage.",
        );
      const row = (
        await c.query(
          "UPDATE ppo.tickets SET version=version+1,updated_at=clock_timestamp(),updated_by=$1 WHERE workspace_id=$2 AND id=$3 RETURNING *,status AS state",
          [p.actor_id, p.workspace_id, id],
        )
      ).rows[0];
      await c.query(
        "INSERT INTO ppo.ticket_statements(id,workspace_id,company_id,ticket_id,ticket_version,body,source_label,occurred_at,channel,recorded_by,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [
          command.id,
          p.workspace_id,
          t.company_id,
          id,
          row.version,
          command.body,
          command.source_label,
          command.occurred_at,
          command.channel,
          p.actor_id,
          command.operation_id,
        ],
      );
      return {
        ...row,
        audit_details: {
          previous_version: t.version,
          statement_id: command.id,
          basis: "ReportedSymptom",
          assessment_changed: false,
        },
      };
    },
    "Ticket",
    "TicketStatementRecorded",
  );
}
export async function ticketStatements(p: Principal, id: string) {
  const c = database();
  await visibleTicket(c, p, uuid(id, "id"));
  const rows = (
    await c.query<{
      id: string;
      body: string;
      source_label: string;
      occurred_at: Date;
      channel: string;
      recorded_at: Date;
      recorded_by: string;
      recorded_by_name: string;
      ticket_version: number;
      basis: "ReportedSymptom";
    }>(
      "SELECT s.id,s.body,s.source_label,s.occurred_at,s.channel,s.recorded_at,s.recorded_by,u.display_name AS recorded_by_name,s.ticket_version,s.basis FROM ppo.ticket_statements s JOIN ppo.users u ON (u.workspace_id,u.id)=(s.workspace_id,s.recorded_by) WHERE s.workspace_id=$1 AND s.ticket_id=$2 ORDER BY s.ticket_version DESC LIMIT 101",
      [p.workspace_id, id],
    )
  ).rows;
  return {
    items: rows.slice(0, 100).map((r) => ({
      ...r,
      occurred_at: r.occurred_at.toISOString(),
      recorded_at: r.recorded_at.toISOString(),
    })),
    partial: rows.length > 100,
  };
}
