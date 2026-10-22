import type { Principal } from "../platform/identity";
import { unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import { authoriseActivityInput, insertActivity, parseLinks, type ActivityInput } from "../activities/activities";
import { visible } from "../shared/reads";
import { choice, common, commonKeys, instant, invalid, narrative, object, optionalId, optionalText, uuid } from "../shared/validation";
import { ownEvent, openEvent } from "./events";
import { companyRegion } from "./legacy-phone";
import { callDirections, callResults, readPhoneNumber } from "./numbers";

const accessClasses = ["Internal", "RestrictedService", "RestrictedFinance"] as const;

function duration(value: unknown) {
  if (value === undefined || value === null) return null;
  if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > 86400)
    invalid("duration_seconds", "Enter a duration of 0 to 86,400 seconds.");
  return Number(value);
}

// R1/R2: the only way a call becomes a completed Call activity. Planning the next activity stays a
// separate command, exactly as Record outcome plans it, so a failure there never undoes the call.
export async function logCall(p: Principal, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "activity_id", "call_event_id", "company_id", "site_id", "person_id", "number_entered",
    "direction", "result", "started_at", "duration_seconds", "summary", "outcome", "links", "access_class",
  ]);
  const command = {
    ...common(r),
    activity_id: uuid(r.activity_id, "activity_id"),
    call_event_id: optionalId(r.call_event_id, "call_event_id"),
    company_id: uuid(r.company_id, "company_id"),
    site_id: optionalId(r.site_id, "site_id"),
    person_id: optionalId(r.person_id, "person_id"),
    number_entered: optionalText(r.number_entered, "number_entered"),
    direction: choice(r.direction, "direction", callDirections),
    result: choice(r.result, "result", callResults),
    started_at: instant(r.started_at, "started_at"),
    duration_seconds: duration(r.duration_seconds),
    summary: narrative(r.summary, "summary", 2000),
    outcome: narrative(r.outcome, "outcome"),
    links: parseLinks(r.links),
    access_class: choice(r.access_class, "access_class", accessClasses),
  };
  const activity: ActivityInput = {
    id: command.activity_id,
    company_id: command.company_id,
    site_id: command.site_id,
    kind: "CustomerContact",
    owner_id: p.actor_id,
    summary: command.summary,
    due_at: command.started_at,
    due_needed: false,
    activity_type: "Call",
    access_class: command.access_class,
    links: command.links,
  };
  return sharedOperation(
    p,
    command,
    "LogCall",
    async (c) => {
      await authoriseActivityInput(c, p, activity);
      if (command.person_id) {
        await visible(c, p, "Person", command.person_id);
        const inCompany = await c.query(
          "SELECT 1 FROM ppo.person_company_contexts WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3",
          [p.workspace_id, command.company_id, command.person_id],
        );
        if (!inCompany.rowCount) throw unavailable();
      }
      const event = command.call_event_id ? await ownEvent(c, p, command.call_event_id) : null;
      return { event, region: await companyRegion(c, p.workspace_id, command.company_id) };
    },
    async (c, { event, region }) => {
      if (event) {
        openEvent(event);
        if (event.direction !== command.direction) invalid("direction", "Keep the direction the call was recorded with.");
      }
      const number = event
        ? { entered: command.number_entered ?? event.number_e164, e164: event.number_e164 as string }
        : command.number_entered
          ? readPhoneNumber(command.number_entered, region)
          : { entered: null, e164: null };
      // insertActivity writes each given column; a logged call is created already Completed.
      const row = await insertActivity(c, p, { ...activity, status: "Completed", outcome: command.outcome } as ActivityInput);
      await c.query(
        `INSERT INTO ppo.call_details(activity_id,workspace_id,direction,result,number_entered,number_e164,person_id,started_at,duration_seconds,call_event_id,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          command.activity_id, p.workspace_id, command.direction, command.result, number.entered, number.e164,
          command.person_id, command.started_at, command.duration_seconds, event?.id ?? null, p.actor_id,
        ],
      );
      if (event)
        await c.query(
          "UPDATE ppo.call_events SET state='Logged',activity_id=$3,resolved_at=clock_timestamp(),resolved_by=$4,version=version+1 WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, event.id, command.activity_id, p.actor_id],
        );
      return {
        ...row,
        audit_details: {
          call_event_id: event?.id ?? null,
          direction: command.direction,
          result: command.result,
          person_id: command.person_id,
          number_e164: number.e164,
        },
      };
    },
    "Activity",
    "CallLogged",
  );
}
