import { randomUUID } from "node:crypto";
import { sharedOperation } from "../../platform/operations";
import { unavailable } from "../../platform/errors";
import type { Principal } from "../../platform/identity";
import {
  choice,
  label,
  narrative,
  optionalId,
  optionalText,
  uuid,
} from "../../shared/validation";
import {
  access,
  authority,
  dutyFor,
  expected,
  hash,
  person,
  receiptAuthority,
  requireDuty,
  requireSources,
  row,
  tables,
  refuse,
  type Duty,
} from "./context";
import {
  sourceIds,
  type ControlRecord,
  type ControlKind,
  type ContentByKind,
} from "./model";
import {
  changeLink,
  commonRecord,
  insert,
  publishSource,
  state,
  validateLinks,
  nativeSourceIds,
} from "./records";
import { createIssue, decideReview, submitReview } from "./reviews";
import {
  date,
  list,
  parseContent,
  parseControlCommand,
  type Action,
} from "./validation";

const actionKinds: Record<Action, readonly ControlKind[]> = {
  save: ["basis", "document", "query", "submittal", "deliverable"],
  confirm_interface: ["basis"],
  submit_basis: ["basis"],
  revise_document: ["document"],
  respond: ["query"],
  dispose: ["query", "submittal"],
  submit_review: ["review"],
  finding: ["review"],
  respond_finding: ["review"],
  accept_finding: ["review"],
  decide_review: ["review"],
  issue: ["issue"],
  distribution: ["issue"],
  withdraw: ["issue"],
};
export async function controlCommand(
  p: Principal,
  packageId: string,
  value: unknown,
) {
  const command = parseControlCommand(value),
    { action, kind, id, fields: r } = command;
  if (!actionKinds[action].includes(kind))
    throw refuse(
      "InvalidAction",
      "This action belongs to another Engineering record type.",
    );
  const requiredDuty: Duty =
    action === "distribution" && r.evidence_kind !== "Acknowledged"
      ? "distribute"
      : dutyFor(action);
  const original = { ...command, package_id: packageId };
  return sharedOperation(
    p,
    original,
    `EngineeringControl:${kind}:${action}`,
    async (c) => {
      const a = await access(c, p, packageId);
      requireDuty(a, requiredDuty);
      // Replays still re-check every exact source and duty, including after a source becomes restricted.
      const prior = await c.query(
        "SELECT 1 FROM ppo.engineering_control_events WHERE workspace_id=$1 AND recorded_by=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, command.operation_id],
      );
      if (prior.rowCount)
        await receiptAuthority(c, p, packageId, command.operation_id);
      return a;
    },
    async (c, a) => {
      let record: ControlRecord;
      let evidence: Record<string, unknown> = {};
      if (action === "save") {
        const content = parseContent(kind, r.content),
          common = commonRecord(r),
          dueDate = date(r.due_date, "due_date");
        await person(c, p, a, common.owner_id, "author");
        await validateLinks(c, p, a, kind, content);
        if (command.expected_version !== null) {
          const before = await row(c, p, a, kind, id);
          expected(before.version, command.expected_version);
          if (
            (kind === "basis" && before.state !== "Draft") ||
            (kind === "query" && before.state !== "Open") ||
            kind === "submittal"
          )
            throw refuse(
              "FrozenRecord",
              "This content is frozen. Start an explicit successor.",
            );
          if (
            common.reference !== before.reference ||
            common.predecessor_id !== before.predecessor_id
          )
            throw refuse(
              "ImmutableIdentity",
              "Keep the original record reference and predecessor.",
            );
          record = (
            await c.query<ControlRecord>(
              `UPDATE ppo.${tables[kind]} SET title=$3,owner_id=$4,due_date=$5,content=$6,version=version+1,updated_by=$7,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *,due_date::text`,
              [
                p.workspace_id,
                id,
                common.title,
                common.owner_id,
                dueDate,
                content,
                p.actor_id,
              ],
            )
          ).rows[0];
        } else {
          const predecessor = common.predecessor_id
            ? await row(c, p, a, kind, common.predecessor_id)
            : null;
          if (
            predecessor &&
            ![
              "Returned",
              "Reviewed",
              "Withdrawn",
              "Rejected",
              "Accepted",
              "Resolved",
            ].includes(predecessor.state)
          )
            throw refuse(
              "InvalidPredecessor",
              "The prior record must be decided or withdrawn before a successor is prepared.",
            );
          const initial = {
            basis: "Draft",
            document: "Current",
            query: "Open",
            submittal: "Submitted",
            deliverable: "Planned",
            review: "Submitted",
            issue: "Issued",
          }[kind];
          record = await insert(c, p, a, kind, {
            ...common,
            id,
            due_date: dueDate,
            content,
            state: initial,
            revision: predecessor ? predecessor.revision + 1 : 1,
          });
          if (
            kind === "submittal" &&
            predecessor &&
            predecessor.state === "Accepted"
          )
            await state(c, p, kind, predecessor.id, "Superseded");
        }
      } else if (action === "confirm_interface") {
        const basis = await row(c, p, a, "basis", id);
        expected(basis.version, command.expected_version);
        if (basis.state !== "Draft")
          throw refuse(
            "FrozenRecord",
            "Confirm interfaces in the editable draft before submission.",
          );
        const item = basis.content.interfaces.find(
          (i) => i.id === uuid(r.interface_id, "interface_id"),
        );
        if (!item || ![item.provider_id, item.receiver_id].includes(p.actor_id))
          throw refuse(
            "Forbidden",
            "Only the named provider or receiver can confirm their side.",
            403,
          );
        await requireSources(c, p, a, sourceIds(basis.content), true);
        record = await state(c, p, kind, id, basis.state);
        evidence = {
          interface_id: item.id,
          interface_hash: hash({ item, sources: sourceIds(basis.content) }),
          basis_revision: basis.revision,
        };
      } else if (action === "submit_basis") {
        const basis = await row(c, p, a, "basis", id);
        expected(basis.version, command.expected_version);
        if (basis.state !== "Draft")
          throw refuse(
            "FrozenRecord",
            "Start a successor before submitting changed basis content.",
          );
        const review = await submitReview(c, p, a, r, basis);
        record = await row(c, p, a, "basis", id);
        evidence = {
          review_id: review.id,
          submission_hash: review.content.submission_hash,
        };
      } else if (action === "revise_document") {
        const document = await row(c, p, a, "document", id);
        expected(document.version, command.expected_version);
        if (document.state !== "Current")
          throw refuse(
            "InvalidState",
            "A withdrawn or superseded document cannot receive a current revision.",
          );
        const revisionId = uuid(r.revision_id, "revision_id"),
          engineeringRevision = label(
            r.engineering_revision,
            "engineering_revision",
            12,
          );
        if (!/^[A-Za-z0-9.]+$/.test(engineeringRevision))
          throw refuse(
            "InvalidRevision",
            "Use the retained engineering revision scheme with letters, digits and full stops.",
          );
        const native_system = label(r.native_system, "native_system", 100),
          native_reference = label(
            r.native_reference,
            "native_reference",
            2000,
          ),
          native_version = label(r.native_version, "native_version", 40),
          configuration = optionalText(r.configuration, "configuration", 300),
          basisId = optionalId(r.basis_id, "basis_id");
        const affectedBasis = basisId
          ? await row(c, p, a, "basis", basisId)
          : null;
        if (affectedBasis && affectedBasis.state !== "Reviewed")
          throw refuse(
            "BasisNotReviewed",
            "Select an exact reviewed design basis.",
          );
        const outputs = list(r.outputs, "outputs", (value) => {
          const output = value as Record<string, unknown>;
          if (
            !output ||
            typeof output !== "object" ||
            Object.keys(output).some(
              (k) => !["reference", "version", "content_hash"].includes(k),
            )
          )
            throw refuse(
              "InvalidOutput",
              "Provide only the exact published reference, version and hash.",
            );
          const contentHash = label(output.content_hash, "content_hash", 64);
          if (!/^[a-f0-9]{64}$/.test(contentHash))
            throw refuse(
              "InvalidHash",
              "Provide a SHA-256 identity for the synthetic published output.",
            );
          return {
            reference: label(output.reference, "reference", 2000),
            version: label(output.version, "version", 100),
            content_hash: contentHash,
          };
        });
        if (!outputs.length)
          throw refuse(
            "OutputRequired",
            "Retain at least one exact published-output reference.",
          );
        const previous = (
          await c.query<{ id: string; source_id: string }>(
            "SELECT id,source_id FROM ppo.engineering_document_revisions WHERE workspace_id=$1 AND document_id=$2 ORDER BY created_at DESC LIMIT 1",
            [p.workspace_id, id],
          )
        ).rows[0];
        const selected = await requireSources(
          c,
          p,
          a,
          [
            ...document.content.source_ids,
            ...(affectedBasis
              ? [
                  ...sourceIds(affectedBasis.content),
                  ...(await nativeSourceIds(
                    c,
                    p,
                    a,
                    "basis",
                    affectedBasis.id,
                  )),
                ]
              : []),
          ],
          true,
        );
        const sourceId = await publishSource(c, p, a, command, {
          kind: "DrawingIssue",
          reference: document.reference,
          title: document.title,
          revision: engineeringRevision,
          file_version: native_version,
          purpose: "DesignPreparation",
          content: {
            document_id: id,
            discipline: document.content.discipline,
            document_reference: document.reference,
            document_title: document.title,
            engineering_revision: engineeringRevision,
            native_system,
            native_reference,
            native_version,
            configuration,
            outputs,
            basis_id: basisId,
          },
          predecessor_id: previous?.source_id,
          dependencies: selected.map((s) => s.id),
          restricted: selected.some((s) => s.restricted),
        });
        await c.query(
          "INSERT INTO ppo.engineering_document_revisions(id,workspace_id,package_id,document_id,source_id,engineering_revision,native_system,native_reference,native_version,configuration,outputs,basis_id,predecessor_id,created_by,discipline,document_reference,document_title) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)",
          [
            revisionId,
            p.workspace_id,
            a.pkg.id,
            id,
            sourceId,
            engineeringRevision,
            native_system,
            native_reference,
            native_version,
            configuration,
            JSON.stringify(outputs),
            basisId,
            previous?.id ?? null,
            p.actor_id,
            document.content.discipline,
            document.reference,
            document.title,
          ],
        );
        await c.query(
          "INSERT INTO ppo.engineering_source_lineage(workspace_id,package_id,source_id,document_revision_id) VALUES($1,$2,$3,$4)",
          [p.workspace_id, a.pkg.id, sourceId, revisionId],
        );
        record = await state(c, p, kind, id, "Current");
        evidence = {
          document_revision_id: revisionId,
          source_id: sourceId,
          engineering_revision: engineeringRevision,
          native_version,
          source_ids: [...selected.map((s) => s.id), sourceId],
        };
      } else if (action === "respond") {
        const query = await row(c, p, a, "query", id);
        expected(query.version, command.expected_version);
        if (!["Open", "Returned"].includes(query.state))
          throw refuse(
            "InvalidState",
            "This query already has a formal answer.",
          );
        if (query.owner_id !== p.actor_id)
          throw refuse(
            "Forbidden",
            "Only the responsible query owner records its formal answer.",
            403,
          );
        const changeId = optionalId(r.change_id, "change_id");
        await changeLink(c, p, a, changeId);
        const content: ContentByKind["query"] = {
          ...query.content,
          response: narrative(r.response, "response"),
          response_by: p.actor_id,
          response_at: new Date().toISOString(),
          actions: narrative(r.actions, "actions"),
          change_id: changeId,
        };
        record = (
          await c.query<ControlRecord>(
            "UPDATE ppo.engineering_queries SET content=$3,state=$4,version=version+1,updated_by=$5,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *,due_date::text",
            [
              p.workspace_id,
              id,
              content,
              query.content.review_required ? "Answered" : "Resolved",
              p.actor_id,
            ],
          )
        ).rows[0];
      } else if (action === "dispose") {
        const subject = await row(c, p, a, kind, id);
        expected(subject.version, command.expected_version);
        authority(a, p, "review", "DesignPreparation");
        if (
          p.actor_id === subject.created_by ||
          p.actor_id === subject.owner_id
        )
          throw refuse(
            "IndependentReviewerRequired",
            "A separate technical reviewer must record this disposition.",
            403,
          );
        if (
          (kind === "query" && subject.state !== "Answered") ||
          (kind === "submittal" && subject.state !== "Submitted")
        )
          throw refuse(
            "InvalidState",
            "This record is not awaiting disposition.",
          );
        if (
          kind === "submittal" &&
          (subject.content as ContentByKind["submittal"]).reviewer_id !==
            p.actor_id
        )
          throw refuse(
            "Forbidden",
            "Only the assigned submittal reviewer may decide.",
            403,
          );
        const outcome = choice(
          r.outcome,
          "outcome",
          kind === "query"
            ? ["Resolved", "Returned"]
            : ["Accepted", "Returned", "Rejected"],
        );
        if (["Resolved", "Accepted"].includes(outcome))
          await requireSources(c, p, a, sourceIds(subject.content), true);
        record = await state(c, p, kind, id, outcome);
        evidence = { outcome, rationale: narrative(r.rationale, "rationale") };
      } else if (action === "submit_review")
        record = await submitReview(c, p, a, r);
      else if (action === "decide_review")
        ({ record, evidence } = await decideReview(
          c,
          p,
          a,
          id,
          command.expected_version,
          r,
        ));
      else if (
        ["finding", "respond_finding", "accept_finding"].includes(action)
      ) {
        const review = await row(c, p, a, "review", id);
        expected(review.version, command.expected_version);
        if (!["Submitted", "Returned"].includes(review.state))
          throw refuse(
            "FrozenRecord",
            "Findings belong to an open or returned review.",
          );
        const findingId = uuid(r.finding_id, "finding_id");
        if (action !== "respond_finding") {
          authority(a, p, "review", review.content.purpose);
          if (review.owner_id !== p.actor_id)
            throw refuse(
              "Forbidden",
              "The assigned reviewer owns findings and closure.",
              403,
            );
        }
        if (action === "finding") {
          if (review.state !== "Submitted")
            throw refuse("InvalidState", "Raise findings during review.");
          const ownerId = uuid(r.owner_id, "owner_id");
          await person(c, p, a, ownerId, "author");
          await c.query(
            "INSERT INTO ppo.engineering_findings(id,workspace_id,package_id,review_id,owner_id,due_date,finding,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
            [
              findingId,
              p.workspace_id,
              a.pkg.id,
              id,
              ownerId,
              date(r.due_date, "due_date"),
              narrative(r.finding, "finding"),
              p.actor_id,
            ],
          );
        } else {
          const finding = (
            await c.query<{ owner_id: string; state: string }>(
              "SELECT owner_id,state FROM ppo.engineering_findings WHERE workspace_id=$1 AND package_id=$2 AND review_id=$3 AND id=$4",
              [p.workspace_id, a.pkg.id, id, findingId],
            )
          ).rows[0];
          if (!finding) throw unavailable();
          if (action === "respond_finding") {
            if (finding.owner_id !== p.actor_id || finding.state === "Accepted")
              throw refuse(
                "Forbidden",
                "Only the finding owner may respond to an unaccepted finding.",
                403,
              );
            await c.query(
              "UPDATE ppo.engineering_findings SET response=$3,state='ResponseReceived',version=version+1,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
              [p.workspace_id, findingId, narrative(r.response, "response")],
            );
          } else {
            if (
              finding.state !== "ResponseReceived" ||
              finding.owner_id === p.actor_id
            )
              throw refuse(
                "FindingResponseRequired",
                "Inspect a separate owner's response before accepting closure.",
              );
            await c.query(
              "UPDATE ppo.engineering_findings SET accepted_by=$3,state='Accepted',version=version+1,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
              [p.workspace_id, findingId, p.actor_id],
            );
          }
        }
        record = await state(c, p, kind, id, review.state);
        evidence = {
          finding_id: findingId,
          finding: (
            await c.query(
              "SELECT * FROM ppo.engineering_findings WHERE workspace_id=$1 AND id=$2",
              [p.workspace_id, findingId],
            )
          ).rows[0],
        };
      } else if (action === "issue")
        record = await createIssue(c, p, a, r, command.expected_version);
      else if (action === "distribution") {
        const issue = await row(c, p, a, "issue", id);
        expected(issue.version, command.expected_version);
        if (issue.state !== "Issued")
          throw refuse(
            "InvalidState",
            "A withdrawn or superseded issue cannot be distributed or newly acknowledged.",
          );
        await requireSources(c, p, a, issue.content.source_ids, true);
        await nativeSourceIds(c, p, a, "issue", issue.id);
        const transmittalId = uuid(r.transmittal_id, "transmittal_id"),
          evidenceKind = choice(r.evidence_kind, "evidence_kind", [
            "Sent",
            "Delivered",
            "Acknowledged",
          ] as const);
        const transmittal = (
          await c.query<{ recipient_id: string }>(
            "SELECT recipient_id FROM ppo.engineering_transmittals WHERE workspace_id=$1 AND package_id=$2 AND issue_id=$3 AND id=$4",
            [p.workspace_id, a.pkg.id, id, transmittalId],
          )
        ).rows[0];
        if (!transmittal) throw unavailable();
        if (evidenceKind === "Acknowledged") {
          if (transmittal.recipient_id !== p.actor_id)
            throw refuse(
              "Forbidden",
              "Only this exact recipient may acknowledge this issue.",
              403,
            );
        } else authority(a, p, "distribute", issue.content.purpose);
        if (
          evidenceKind !== "Sent" &&
          !(
            await c.query(
              "SELECT 1 FROM ppo.engineering_distribution_evidence WHERE workspace_id=$1 AND transmittal_id=$2 AND kind=$3",
              [
                p.workspace_id,
                transmittalId,
                evidenceKind === "Delivered" ? "Sent" : "Delivered",
              ],
            )
          ).rowCount
        )
          throw refuse(
            "DeliveryEvidenceRequired",
            "Record the preceding sent or delivery evidence separately first.",
          );
        await c.query(
          "INSERT INTO ppo.engineering_distribution_evidence(id,workspace_id,transmittal_id,kind,evidence,issue_hash,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            randomUUID(),
            p.workspace_id,
            transmittalId,
            evidenceKind,
            narrative(r.evidence, "evidence"),
            issue.content.manifest_hash,
            p.actor_id,
          ],
        );
        record = await state(c, p, kind, id, issue.state);
        evidence = {
          transmittal_id: transmittalId,
          evidence_kind: evidenceKind,
          manifest_hash: issue.content.manifest_hash,
        };
      } else if (action === "withdraw") {
        const issue = await row(c, p, a, "issue", id);
        expected(issue.version, command.expected_version);
        authority(a, p, "issue", issue.content.purpose);
        if (issue.state !== "Issued")
          throw refuse(
            "InvalidState",
            "This issue is already unavailable for current use.",
          );
        record = await state(c, p, kind, id, "Withdrawn");
        const retained = (
          await c.query<{ source_id: string }>(
            "SELECT source_id FROM ppo.engineering_source_lineage WHERE workspace_id=$1 AND issue_id=$2",
            [p.workspace_id, id],
          )
        ).rows;
        for (const source of retained)
          await c.query(
            "INSERT INTO ppo.material_source_changes(workspace_id,company_id,source_id,change,reason,operation_id,created_by) VALUES($1,$2,$3,'Withdrawn',$4,$5,$6) ON CONFLICT(workspace_id,source_id) DO NOTHING",
            [
              p.workspace_id,
              a.pkg.company_id,
              source.source_id,
              command.reason,
              command.operation_id,
              p.actor_id,
            ],
          );
      } else throw refuse("InvalidAction", "Unsupported Engineering action.");
      const eventContent = {
        record,
        ...evidence,
        source_ids: [
          ...new Set([
            ...sourceIds(record.content),
            ...((evidence.source_ids as string[] | undefined) ?? []),
          ]),
        ],
        required_duty: requiredDuty,
      };
      await c.query(
        "INSERT INTO ppo.engineering_control_events(id,workspace_id,package_id,subject_id,subject_kind,operation_id,action,version,content,content_hash,recorded_by,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [
          randomUUID(),
          p.workspace_id,
          a.pkg.id,
          record.id,
          kind,
          command.operation_id,
          action,
          record.version,
          eventContent,
          hash(eventContent),
          p.actor_id,
          command.reason,
        ],
      );
      return {
        id: a.pkg.id,
        version: record.version,
        state: record.state,
        updated_at: new Date(),
        audit_details: {
          subject_id: record.id,
          subject_kind: kind,
          source_ids: sourceIds(record.content),
        },
      };
    },
    "EngineeringPackage",
    "EngineeringControlSaved",
  );
}
