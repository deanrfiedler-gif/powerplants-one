import type { EscalationRecord } from "../../src/components/service-escalations-command";
import { findingRows, findingsClock } from "./findings-fixture";
import {
  caseActions,
  allowedAction,
  type CaseState,
} from "../../src/service/escalations/states";
export const escalationId = "90000000-0000-4000-8000-000000000201";
export function escalationRecord(
  state: CaseState = "ReplyToActOn",
): EscalationRecord {
  const finding = structuredClone(findingRows[0]);
  finding.state = "Open";
  finding.native_state = "Open";
  const owner = finding.action!.owner_id,
    pack = "90000000-0000-4000-8000-000000000202",
    sent = "90000000-0000-4000-8000-000000000203",
    reply = "90000000-0000-4000-8000-000000000204";
  return {
    record: {
      id: escalationId,
      workspace_id: "10000000-0000-4000-8000-000000000001",
      company_id: finding.company_id,
      site_id: finding.site.id,
      asset_id: finding.equipment!.id,
      display_number: "SYN-ESC-000002",
      finding_key: finding.id,
      owner_id: owner,
      owner_name: "SYN Morgan Lee",
      fault: "Boiler controller BC-2 shows fault E-17",
      fault_type: "Controller fault",
      state,
      version: 7,
      content_version: 3,
      current_configuration_id: pack,
      latest_pack_id: pack,
      reviewed_pack_id: state === "Diagnosing" ? null : pack,
      last_sent_id: state === "Diagnosing" ? null : sent,
      last_reply_id: state === "ReplyToActOn" ? reply : null,
      chase_activity_id: null,
      next_action_id: null,
      next_action_reply_id: null,
      outcome: null,
      created_at: findingsClock,
      created_by: owner,
      updated_at: findingsClock,
      updated_by: owner,
    },
    equipment: {
      id: finding.equipment!.id,
      company_id: finding.company_id,
      site_id: finding.site.id,
      version: 1,
      description: "SYN boiler controller BC-2",
      display_number: "SYN-EQ-000012",
      manufacturer: "SYN Boiler Controls",
      model: "BC-200",
      serial: "SYN-BC-201",
      warranty_end: "2027-03-31",
    },
    site: finding.site,
    finding,
    source_token: "a".repeat(64),
    expected_finding_version: 1,
    configuration: {
      id: pack,
      source_id: pack,
      revision: 1,
      description:
        "SYN controller observation: firmware 4.1; no settings changed",
      sha256: "b".repeat(64),
      created_at: findingsClock,
    },
    configuration_current: true,
    support_route: {
      version: 1,
      manufacturer: "SYN Boiler Controls",
      method: "Email",
      recipient: "support@example.invalid",
    },
    events: [
      {
        id: "diag",
        kind: "Diagnostic",
        occurred_at: findingsClock,
        created_at: findingsClock,
        recorded_by: "SYN Morgan Lee",
        details: {
          diagnostic: "Checked the external fault indicator",
          result: "E-17 remains visible; no settings changed",
          source_reference: "SYN technical observation",
        },
      },
      ...(state !== "Diagnosing"
        ? [
            {
              id: sent,
              kind: "Sent",
              occurred_at: findingsClock,
              created_at: findingsClock,
              recorded_by: "SYN Morgan Lee",
              details: {
                method: "Email",
                recipient: "support@example.invalid",
                manufacturer_reference: "SYN CASE-17",
                reply_expected_at: "2026-10-19T01:00:00Z",
                pdf_sha256: "d".repeat(64),
              },
            },
          ]
        : []),
      ...(state === "ReplyToActOn"
        ? [
            {
              id: reply,
              kind: "Reply",
              occurred_at: findingsClock,
              created_at: findingsClock,
              recorded_by: "SYN Morgan Lee",
              details: {
                reply:
                  "SYN E-17 means the outlet sensor reads open circuit. Check the sensor plug, then review firmware 4.2.",
                advice:
                  "Check the sensor plug and wiring. A firmware change requires the grower’s approval first.",
                settings_change: true,
              },
            },
          ]
        : []),
    ],
    packs: [
      {
        id: pack,
        revision: 1,
        content_version: 3,
        html_sha256: "c".repeat(64),
        pdf_sha256: "d".repeat(64),
        evidence_sha256: "e".repeat(64),
        renderer_version: "SV08 fixture",
        created_at: findingsClock,
        reviewed_at: state === "Diagnosing" ? null : findingsClock,
      },
    ],
    files: [],
    history: [
      {
        id: "history",
        occurred_at: findingsClock,
        reason: "SYN reply recorded",
        command: "ServiceEscalation:record_reply",
        record_version: 7,
        actor: "SYN Morgan Lee",
      },
    ],
    owners: [{ id: owner, display_name: "SYN Morgan Lee" }],
    allowed_actions: caseActions.filter((a) => allowedAction(state, a)),
    synthetic: true,
  };
}
export function escalationRegister() {
  const d = escalationRecord();
  return {
    items: [
      {
        id: escalationId,
        display_number: d.record.display_number,
        fault: d.record.fault,
        state: d.record.state,
        owner_id: d.record.owner_id,
        owner_name: d.record.owner_name,
        manufacturer: d.equipment.manufacturer,
        site: d.site.name,
        updated_at: findingsClock,
        sent_at: findingsClock,
        reply_expected_at: "2026-10-19T01:00:00Z",
        chase_due: false,
      },
    ],
    count: 1,
    offset: 0,
    limit: 25,
    read_at: findingsClock,
    completeness: "Complete",
    owners: d.owners,
    manufacturers: [d.equipment.manufacturer],
    synthetic: true,
  };
}
