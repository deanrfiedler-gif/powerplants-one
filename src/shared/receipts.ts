import { fieldReadinessReceiptAuthority } from "../field/readiness";
import { aftercareReceiptAuthority } from "../sales/aftercare-service";
import { handoverReceiptAuthority } from "../sales/handover-service";
import { personEditAuthority } from "./contacts/commands";
import { sourceReceiptAuthority } from "../estimating/sources/context";
import { readEquipmentChange } from "../equipment/changes";
import { equipmentEvidenceRecord, calibrationAuthority } from "../equipment/evidence";
import { csRecord } from "./cs/service";
import { companyContext } from "./authority";
import { createResolutionAuthority } from "../estimating/specialist/recovery";
import { acceptedAuthority as fertigationAcceptedAuthority } from "../estimating/fertigation/context";
import { createResolutionAuthority as fertigationCreateResolutionAuthority } from "../estimating/fertigation/recovery";
import { acceptedAuthority as specialistAcceptedAuthority } from "../estimating/specialist/context";
import { receiptAuthority as acceptanceReceiptAuthority } from "../projects/acceptance/commands";
import { engineeringRow } from "../engineering/service";
import { receiptAuthority as engineeringControlReceiptAuthority } from "../engineering/control/context";
import { materialReceiptAuthority } from "../engineering/materials/commands";
import { changeReceiptAuthority } from "../engineering/changes/commands";
import { commissioningReceiptAuthority } from "../engineering/commissioning/commands";
import { emailContext } from "../email/service";
import { leadReceiptAuthority } from "../crm/leads/receipt-authority";
import { acceptedOpportunityOriginal } from "../crm/receipt-authority";
import { financeContext, financeAccount, receiptCapability } from "../finance/context";
import { acceptedEstimateContext, quoteContext } from "../estimating/context";
import { discoveryReceiptAuthority } from "../estimating/discovery-workspace-context";
import { authoriseProjectReceipt } from "../projects/service";
import { reportContext, ownReport } from "../reports/context";
import {
  fieldContext,
  entryContext,
  attachmentContext,
} from "../field/context";
import { packContext } from "../documents/context";
import { visibleAppointment, visibleRequest } from "../scheduling/planner";
import { visibleWorkOrder } from "../service/work-orders";
import { database, transaction } from "../platform/database";
import { unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import type { OperationReceipt } from "../platform/operations";
import { hasPermission, type Capability } from "../platform/permissions";
import { visibleTicket } from "../service/tickets";
import { visibleActivity } from "../activities/activities";
import { visible } from "./reads";
import { uuid } from "./validation";
export async function readOperation(
  p: Principal,
  operation_id: string,
): Promise<OperationReceipt> {
  const client = database();
  const result = await client.query(
    `SELECT r.result,r.record_id,i.object_type,a.details->>'command' AS command,a.details->>'configuration_id' AS specialist_id FROM ppo.operation_receipts r JOIN ppo.business_identities i ON (i.workspace_id,i.id)=(r.workspace_id,r.record_id)
    JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
    WHERE r.workspace_id=$1 AND r.actor_id=$2 AND r.operation_id=$3`,
    [p.workspace_id, p.actor_id, uuid(operation_id, "operation_id")],
  );
  const r = result.rows[0];
  if (!r) throw unavailable();
  if (r.object_type === "CostSource") {
    await sourceReceiptAuthority(client,p,r.record_id,r.command);
  } else if (r.object_type === "AftercareRecord") {
    await aftercareReceiptAuthority(client,p,r.record_id,r.command);
  } else if (r.object_type === "SalesHandover") {
    await handoverReceiptAuthority(client,p,r.record_id,r.command);
  } else if (r.command === "FieldReadinessAcknowledge" && r.object_type === "SiteReadiness") {
    await fieldReadinessReceiptAuthority(client,p,r.record_id,operation_id);
  } else if (["SiteReadiness","SiteSurvey","AccountPlan"].includes(r.object_type)) {
    const row=await csRecord(client,p,r.object_type==="SiteReadiness"?"Readiness":r.object_type==="SiteSurvey"?"Survey":"AccountPlan",r.record_id,true);
    if(r.command?.startsWith("CsCreate:"))await companyContext(client,p,row.company_id,row.site_id,"shared.create");
  } else if (r.command === "RevisePerson") {
    await personEditAuthority(client, p, r.record_id);
  } else if (r.command === "EndAffiliation" || r.command === "SetSitePrimaryContact") {
    const row = await visible(client,p,r.command === "EndAffiliation" ? "Organisation" : "Site",r.record_id);
    await companyContext(client,p,row.company_id,r.command === "SetSitePrimaryContact" ? row.id : null,"shared.edit");
  } else if (r.command?.startsWith("Acceptance:")) {
    await acceptanceReceiptAuthority(client,p,r.record_id,r.command);
  } else if (r.object_type === "EmailMessage") {
    const message = await emailContext(client,p,r.record_id,true);
    if (r.command === "CreateEmailFollowUp") {
      if (!message.followup_id) throw unavailable();
      const activity = await visibleActivity(client,p,message.followup_id);
      if (!(await hasPermission(client,p,"activity.edit",activity.company_id,activity.site_id ?? undefined))) throw unavailable();
    }
  } else if (r.object_type === "Lead") {
    await leadReceiptAuthority(client,p,r.record_id,r.command);
  } else if (r.object_type === "FinancialHandoff") {
    await financeContext(client,p,r.record_id,receiptCapability(r.command));
  } else if (r.object_type === "FinanceAccount") {
    await financeAccount(client,p,r.record_id);
  } else if (r.object_type === "EstimatingWorkspace") {
    return transaction(async c=>{
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE",[p.workspace_id]);
      if (r.command === "ResolveFertigationCreate") await fertigationCreateResolutionAuthority(c,p,r.record_id,operation_id);
      else if (r.command === "ResolveSpecialistCreate") await createResolutionAuthority(c,p,r.record_id,operation_id);
      else await discoveryReceiptAuthority(c,p,r.record_id,operation_id);
      return r.result as OperationReceipt;
    });
  } else if (r.object_type === "FertigationScope") {
    if (!await fertigationAcceptedAuthority(client,p,r.record_id,operation_id)) throw unavailable();
  } else if (r.object_type === "SpecialistConfiguration") {
    if (!await specialistAcceptedAuthority(client,p,r.record_id,operation_id)) throw unavailable();
  } else if (r.object_type === "Estimate") {
    if (r.command === "ApplySpecialistConfiguration" && (!r.specialist_id || !await specialistAcceptedAuthority(client,p,r.specialist_id,operation_id))) throw unavailable();
    if(!(await acceptedEstimateContext(client,p,r.record_id,operation_id)))throw unavailable();
  } else if (r.object_type === "DraftQuoteRevision") {
    await quoteContext(client,p,r.record_id,"estimating.quote.prepare");
    await quoteContext(client,p,r.record_id);
  } else if (r.object_type === "EquipmentChange") {
    if (!["ProposeEquipmentChange", "ReviewEquipmentChange"].includes(r.command)) throw unavailable();
    await readEquipmentChange(client, p, r.record_id, true);
  } else if (["EquipmentBackup", "EquipmentBulletin", "EquipmentSupport"].includes(r.object_type)) {
    const kind = r.object_type === "EquipmentBackup" ? "backups" : r.object_type === "EquipmentBulletin" ? "bulletins" : "support";
    const commands = {backups:["CreateEquipmentbackups","ReviewEquipmentBackup"],bulletins:["CreateEquipmentbulletins","ReviewEquipmentBulletin","CloseEquipmentBulletin"],support:["CreateEquipmentsupport"]};
    if (!commands[kind].includes(r.command)) throw unavailable();
    await equipmentEvidenceRecord(client,p,kind,r.record_id,true);
  } else if (r.object_type === "CalibrationEvidence") {
    if (r.command !== "RecordEquipmentCalibration") throw unavailable();
    await calibrationAuthority(client,p,r.record_id,true);
  } else if (r.object_type === "EngineeringPackage") {
    if (r.command?.startsWith("EngineeringControl:")) await engineeringControlReceiptAuthority(client,p,r.record_id,operation_id);
    else await engineeringRow(client, p, r.record_id, r.command === "CreateEngineeringRequest" ? "engineering.create" : "engineering.edit");
  } else if (r.object_type === "EngineeringChange") {
    // EN-07 originals: present scope and the same duty the command needed, before the receipt is disclosed.
    await changeReceiptAuthority(client, p, r.record_id, r.command);
  } else if (r.object_type === "CommissioningPackage") {
    // EN-08 originals: present scope and the same duty the command needed, before the receipt is disclosed.
    await commissioningReceiptAuthority(client, p, r.record_id, r.command);
  } else if (r.object_type.startsWith("Material")) {
    // EN-06 originals: present scope and the same duty the command needed, before the receipt is disclosed.
    await materialReceiptAuthority(client, p, r.object_type, r.record_id, r.command);
  } else if (r.object_type === "Project") {
    await authoriseProjectReceipt(client, p, r.record_id, r.command);
  } else if (r.object_type === "Opportunity") {
    return transaction(async c=>{
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE",[p.workspace_id]);
      const accepted=await acceptedOpportunityOriginal(c,p,r.record_id,operation_id,r.command);
      if(!accepted)throw unavailable();
      return accepted.receipt;
    });
  } else if (r.object_type === "ServiceReport") {
    if (r.command === "SubmitCompletion" || r.command === "AmendReport")
      await ownReport(client, p, r.record_id);
    else
      await reportContext(
        client,
        p,
        r.record_id,
        r.command === "ReviewReport" ? "report.review" : "report.issue",
      );
  } else if (r.object_type === "CustomerResponse") {
    const response = (
      await client.query(
        "SELECT report_id FROM ppo.customer_responses WHERE workspace_id=$1 AND actor_id=$2 AND id=$3",
        [p.workspace_id, p.actor_id, r.record_id],
      )
    ).rows[0];
    if (!response) throw unavailable();
    await reportContext(client, p, response.report_id, "report.respond");
  } else if (r.object_type === "FieldEntry") {
    await entryContext(
      client,
      p,
      r.record_id,
      r.command === "CorrectFieldEntry"
        ? "field.correct.own"
        : "field.capture.own",
    );
  } else if (r.object_type === "Attachment") {
    await attachmentContext(client, p, r.record_id, true);
  } else if (r.object_type === "CompletionDraft") {
    const draft = (
      await client.query(
        "SELECT appointment_id,actor_id FROM ppo.completion_drafts WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, r.record_id],
      )
    ).rows[0];
    if (!draft || draft.actor_id !== p.actor_id) throw unavailable();
    await fieldContext(client, p, draft.appointment_id, "field.completion.own");
  } else if (
    r.object_type === "Appointment" &&
    r.command === "StartAttendance"
  ) {
    await fieldContext(client, p, r.record_id, "field.start.own");
  } else if (r.object_type === "Pack") {
    const cap =
      r.command === "AcknowledgePack"
        ? "pack.acknowledge"
        : r.command === "CheckPack"
          ? "pack.check"
          : ["CreatePack", "RevisePack"].includes(r.command)
            ? "pack.prepare"
            : "pack.issue";
    await packContext(client, p, r.record_id, cap);
  } else if (r.object_type === "ScheduleChangeRequest") {
    await visibleRequest(
      client,
      p,
      r.record_id,
      r.command === "CreateScheduleChangeRequest" ||
        r.command === "DecideScheduleChangeRequest:cancel"
        ? "schedule.request"
        : "schedule.manage",
    );
  } else if (r.object_type === "ContactOutcome") {
    const contact = (
      await client.query(
        "SELECT appointment_id,recipient_id FROM ppo.contact_outcomes WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, r.record_id],
      )
    ).rows[0];
    if (!contact) throw unavailable();
    await visibleAppointment(
      client,
      p,
      contact.appointment_id,
      "schedule.contact",
    );
    await visible(client, p, "Person", contact.recipient_id);
  } else if (
    r.object_type === "Appointment" &&
    ["ConfirmAppointment", "MoveAppointment", "CancelAppointment"].includes(
      r.command,
    )
  ) {
    await visibleAppointment(client, p, r.record_id, "schedule.manage");
  } else if (r.object_type === "WorkOrder" || r.object_type === "Appointment") {
    const cap =
      r.command === "AuthoriseWorkOrder"
        ? "service.scope.authorise"
        : r.command === "AssessWorkReadiness"
          ? "service.readiness.assess"
          : "service.work_order.edit";
    let id = r.record_id;
    if (r.object_type === "Appointment") {
      const v = (
        await client.query(
          "SELECT work_order_id FROM ppo.appointments WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, id],
        )
      ).rows[0];
      if (!v) throw unavailable();
      id = v.work_order_id;
    }
    await visibleWorkOrder(client, p, id, cap);
  } else if (r.object_type === "Ticket") {
    const t = await visibleTicket(client, p, r.record_id);
    if (
      !(await hasPermission(
        client,
        p,
        "service.ticket.edit",
        t.company_id,
        t.site_id ?? undefined,
      ))
    )
      throw unavailable();
    if (
      r.command === "RequestTicketInformation" &&
      t.clarification_activity_id
    ) {
      const a = await visibleActivity(client, p, t.clarification_activity_id);
      if (
        !(await hasPermission(
          client,
          p,
          "activity.edit",
          a.company_id,
          a.site_id ?? undefined,
        ))
      )
        throw unavailable();
    }
  } else if (r.object_type === "Activity") {
    const a = await visibleActivity(client, p, r.record_id);
    if (
      !(await hasPermission(
        client,
        p,
        "activity.edit",
        a.company_id,
        a.site_id ?? undefined,
      ))
    )
      throw unavailable();
    if (
      ["StartActivity", "CompleteActivity", "CancelActivity"].includes(
        r.command,
      ) &&
      a.owner_id !== p.actor_id
    )
      throw unavailable();
  } else {
    // Unknown shared commands never inherit create authority. CS-05 edits and
    // Equipment service membership originals need the same current edit duty.
    if (!["RecordSharedHistory", "ReviseOrganisationIdentity", "ReviseAssetIdentity",
      "AddAffiliation", "AddSiteParty", "ProposeMapping", "CreateOrganisation", "CreatePerson",
      "CreateSite", "CreateFacility", "CreateAsset", "CreateFacilityDetails", "ReviseFacilityDetails",
      "SetFacilityPin", "RemoveFacilityPin", "AddAssetServedFacility", "EndAssetServedFacility"].includes(r.command)) throw unavailable();
    const cap: Capability =
      r.command === "RecordSharedHistory"
        ? "shared.history.record"
        : [
              "ReviseOrganisationIdentity",
              "ReviseAssetIdentity",
              "AddAffiliation",
              "AddSiteParty",
              "ProposeMapping",
              "ReviseFacilityDetails", "SetFacilityPin", "RemoveFacilityPin",
              "AddAssetServedFacility", "EndAssetServedFacility",
            ].includes(r.command)
          ? "shared.edit"
          : "shared.create";
    if (r.object_type === "Person") {
      await visible(client, p, "Person", r.record_id);
      const companies = await client.query(
        "SELECT company_id FROM ppo.person_company_contexts WHERE workspace_id=$1 AND person_id=$2",
        [p.workspace_id, r.record_id],
      );
      for (const c of companies.rows)
        if (!(await hasPermission(client, p, cap, c.company_id)))
          throw unavailable();
    } else {
      let row;
      if (["Organisation", "Site", "Asset", "Facility"].includes(r.object_type))
        row = await visible(client, p, r.object_type, r.record_id);
      else {
        const table = (
          {
            Relationship: "relationships",
            SiteParty: "site_parties",
            ErpAccountMapping: "erp_account_mappings",
            HistoryRecord: "history_records",
          } as Record<string, string>
        )[r.object_type];
        if (!table) throw unavailable();
        row = (
          await client.query(
            `SELECT * FROM ppo.${table} WHERE workspace_id=$1 AND id=$2`,
            [p.workspace_id, r.record_id],
          )
        ).rows[0];
        await visible(
          client,
          p,
          row.site_id ? "Site" : "Organisation",
          row.site_id ?? row.organisation_id,
        );
        if (
          row.access_class === "RestrictedFinance" &&
          !(await hasPermission(
            client,
            p,
            "shared.finance.read",
            row.company_id,
            row.site_id,
          ))
        )
          throw unavailable();
      }
      if (
        !(await hasPermission(
          client,
          p,
          cap,
          row.company_id,
          r.object_type === "Site" ? row.id : row.site_id,
        ))
      )
        throw unavailable();
    }
  }
  return r.result as OperationReceipt;
}
