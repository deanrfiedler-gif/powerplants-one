"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Field, Stamp } from "../../../components/business-ui";
import { formatRange } from "../../../shell/date-format";
import { appointmentHref, safePlannerReturn } from "../../navigation";
import {
  siteCheckKeys,
  type SiteCheck,
  type SitePreparation,
} from "../../site-readiness-model";
import { BookingRecovery, useBookingCommand } from "./booking-recovery.client";
import type { Appointment } from "./planner-screens.client";

type CheckKey = (typeof siteCheckKeys)[number];
type CheckChoice = SiteCheck["status"] | "";

// Labels and help follow the accepted SV-04 dialog (Figma 1195:266625) and
// field readiness gate P4: four checks, each Confirmed, Not ready or Not applicable.
export const siteCheckLabels: Record<
  CheckKey,
  { label: string; hint: string }
> = {
  access: {
    label: "Access arranged",
    hint: "Gates, doors and sign-in arranged for the crew's arrival.",
  },
  power_water: {
    label: "Power and water available",
    hint: "Supply the crew needs is on, or not needed for this job.",
  },
  equipment: {
    label: "Equipment accessible",
    hint: "Plant, panels and work areas clear for the crew.",
  },
  isolation: {
    label: "Isolation arrangements agreed",
    hint: "Who isolates what, and when, on arrival.",
  },
};
const statusWords: Record<SiteCheck["status"], string> = {
  Confirmed: "Confirmed",
  NotReady: "Not ready",
  NotApplicable: "Not applicable",
};
export const siteCheckStatusWords = statusWords;

// The saved appointment facts an unsaved draft was entered against. The draft is
// held apart from the read version, so refreshing after a stale refusal keeps it.
type DraftBasis = Pick<
  Appointment,
  "version" | "schedule_version" | "start_at" | "end_at"
>;
const basisOf = (a: Appointment): DraftBasis => ({
  version: a.version,
  schedule_version: a.schedule_version,
  start_at: a.start_at,
  end_at: a.end_at,
});

export function SiteReadinessForm({
  a,
  preparation,
  onSaved,
  onClose,
  onRefresh,
}: {
  a: Appointment;
  preparation: SitePreparation;
  onSaved: () => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [channel, setChannel] = useState("ManualPhone"),
    [choices, setChoices] = useState<Record<CheckKey, CheckChoice>>({
      access: "",
      power_water: "",
      equipment: "",
      isolation: "",
    }),
    [checkNotes, setCheckNotes] = useState<Record<CheckKey, string>>({
      access: "",
      power_water: "",
      equipment: "",
      isolation: "",
    }),
    [notes, setNotes] = useState(""),
    [missing, setMissing] = useState(false),
    [basis, setBasis] = useState(() => basisOf(a)),
    [reconfirmed, setReconfirmed] = useState(false),
    [reconfirmMissing, setReconfirmMissing] = useState(false),
    command = useBookingCommand(),
    id = useRef(crypto.randomUUID()),
    occurred = useRef<string | null>(null);
  const target = appointmentHref(
    a.id,
    safePlannerReturn(useSearchParams().get("returnTo")),
  );
  const notReady = siteCheckKeys.filter((key) => choices[key] === "NotReady");
  const hasDraft =
    siteCheckKeys.some((key) => choices[key] || checkNotes[key]) || !!notes;
  // A newer saved version keeps the draft for review; a moved visit also needs
  // the answers confirmed again for the new time before they can be recorded.
  const refreshed = hasDraft && a.version !== basis.version;
  const moved =
    hasDraft &&
    (a.schedule_version !== basis.schedule_version ||
      a.start_at !== basis.start_at ||
      a.end_at !== basis.end_at);
  // A refusal notice belongs to the version it refused; the review notice replaces it.
  const clearRefusal = useRef(command.clear);
  useEffect(() => {
    clearRefusal.current = command.clear;
  });
  useEffect(() => {
    clearRefusal.current();
  }, [a.version]);
  async function save(outcome: "Confirmed" | "NoResponse") {
    if (outcome === "Confirmed" && siteCheckKeys.some((key) => !choices[key])) {
      setMissing(true);
      return;
    }
    setMissing(false);
    if (outcome === "Confirmed" && moved && !reconfirmed) {
      setReconfirmMissing(true);
      return;
    }
    setReconfirmMissing(false);
    // A fresh submission against a newer version is a new contact record: the
    // refused original changed nothing, and its time preceded the newer version.
    if (a.version !== basis.version) {
      id.current = crypto.randomUUID();
      occurred.current = null;
    }
    setBasis(basisOf(a));
    setReconfirmed(false);
    occurred.current ??= new Date().toISOString();
    // A no-answer contact asked nothing, so each check is recorded as Not applicable
    // with that reason; the NoResponse outcome keeps the criterion Unknown (P4 table).
    const site_checks = Object.fromEntries(
      siteCheckKeys.map((key) => [
        key,
        outcome === "NoResponse"
          ? { status: "NotApplicable", note: "Not asked: no answer." }
          : { status: choices[key], note: checkNotes[key] },
      ]),
    );
    const result = await command.send(
      `appointments/${a.id}/contacts`,
      {
        id: id.current,
        expected_version: a.version,
        recipient_id: a.primary_contact_id,
        purpose: "SiteReadiness",
        site_checks,
        channel,
        outcome,
        occurred_at: occurred.current,
        notes,
        reason: "Record customer site readiness",
      },
      target,
      "Customer site readiness",
      id.current,
    );
    if (result) {
      id.current = crypto.randomUUID();
      occurred.current = null;
      onSaved();
    }
  }
  const disabled =
    command.busy ||
    !!command.pending ||
    !command.ready ||
    !a.primary_contact_id;
  return (
    <section
      className="planner-form sv04-site-readiness"
      aria-label="Record customer site readiness"
    >
      <h2>Record customer site readiness</h2>
      <p>
        {a.display_number} · schedule v{preparation.schedule_version}. Record
        what the site contact confirmed. This is the appointment&apos;s contact
        record; Powerplants One sends nothing to the customer.
      </p>
      <BookingRecovery command={command} />
      {(command.error as { code?: string } | null)?.code ===
        "VersionConflict" && (
        <div className="save-notice" role="note">
          <p>
            Your entries are kept. Refresh the saved appointment, review your
            entries against it, then record again.
          </p>
          <button type="button" className="secondary" onClick={onRefresh}>
            Refresh saved appointment
          </button>
        </div>
      )}
      {moved ? (
        <section
          className="planner-warning"
          role="status"
          aria-label="Visit moved: reconfirm site readiness"
        >
          <h3>The visit moved after these entries were made</h3>
          <p>
            Your entries are kept and nothing has been saved. They were for{" "}
            {formatRange(basis.start_at, basis.end_at, a.site_timezone)}; the
            visit is now {formatRange(a.start_at, a.end_at, a.site_timezone)}.
            Confirm each check again with the site contact for the new time and
            change any answer that differs before recording.
          </p>
        </section>
      ) : (
        refreshed && (
          <section
            className="planner-warning"
            role="status"
            aria-label="Review entries against the saved appointment"
          >
            <h3>Review your entries against the saved appointment</h3>
            <p>
              The appointment was refreshed to its saved version after these
              entries were made. Your entries are kept and nothing has been
              saved; the visit time has not changed. Review them, then choose
              Record confirmation or Record no answer to save them.
            </p>
          </section>
        )
      )}
      {command.saved &&
        command.accepted?.entry.label === "Customer site readiness" && (
          <p role="status" className="save-notice">
            Site readiness saved.
          </p>
        )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save("Confirmed");
        }}
      >
        <fieldset disabled={disabled}>
          <legend>Contact</legend>
          <p>
            {a.primary_contact_name ??
              (a.primary_contact_id
                ? "Site contact name unavailable."
                : "No current site contact — resolve site context first.")}{" "}
            · primary site contact
          </p>
          <div className="field">
            <label htmlFor="site-readiness-channel">Contact channel</label>
            <select
              id="site-readiness-channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="ManualPhone">Phone call</option>
              <option value="ManualEmail">Email</option>
              <option value="InPerson">In person</option>
              <option value="Simulated">Simulated</option>
            </select>
          </div>
        </fieldset>
        <fieldset disabled={disabled} aria-describedby="site-readiness-help">
          <legend>The customer confirmed · choose one for each check</legend>
          <p id="site-readiness-help">
            Not ready on any check holds dispatch and gives the service owner a
            follow-up task.
          </p>
          {missing && (
            <p role="alert" className="field-error">
              Choose Confirmed, Not ready or Not applicable for every check.
            </p>
          )}
          {siteCheckKeys.map((key) => (
            <div className="sv04-site-check" key={key}>
              <div className="field">
                <label htmlFor={`site-check-${key}`}>
                  {siteCheckLabels[key].label}
                </label>
                <small>{siteCheckLabels[key].hint}</small>
                <select
                  id={`site-check-${key}`}
                  value={choices[key]}
                  aria-invalid={missing && !choices[key]}
                  onChange={(e) =>
                    setChoices((now) => ({
                      ...now,
                      [key]: e.target.value as CheckChoice,
                    }))
                  }
                >
                  <option value="">Choose…</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="NotReady">Not ready</option>
                  <option value="NotApplicable">Not applicable</option>
                </select>
              </div>
              <Field
                name={`site-check-${key}-note`}
                label={`${siteCheckLabels[key].label} note`}
                value={checkNotes[key]}
                onChange={(value) =>
                  setCheckNotes((now) => ({ ...now, [key]: value }))
                }
                maxLength={1000}
              />
            </div>
          ))}
          <p className="sv04-note" role="note">
            Window for this visit:{" "}
            <Stamp value={preparation.opens_at} timezone={a.site_timezone} /> to{" "}
            <Stamp
              value={preparation.confirmation_due_at}
              timezone={a.site_timezone}
            />
            . A confirmation before the window opens does not count; a later one
            still passes and is marked late. Moving the visit needs a new
            confirmation.
          </p>
          <Field
            name="site-readiness-notes"
            label="Note"
            hint="Optional. Shown on the appointment and in the job pack readiness."
            multiline
            maxLength={2000}
            value={notes}
            onChange={setNotes}
          />
          {moved && (
            <div className="field sv04-reconfirm">
              <label>
                <input
                  type="checkbox"
                  checked={reconfirmed}
                  aria-invalid={reconfirmMissing && !reconfirmed}
                  aria-describedby={
                    reconfirmMissing ? "site-readiness-reconfirm" : undefined
                  }
                  onChange={(e) => {
                    setReconfirmed(e.target.checked);
                    if (e.target.checked) setReconfirmMissing(false);
                  }}
                />{" "}
                I have confirmed these answers again with the site contact for
                the new visit time
              </label>
              {reconfirmMissing && (
                <p
                  id="site-readiness-reconfirm"
                  role="alert"
                  className="field-error"
                >
                  Confirm the answers again for the new visit time before
                  recording them.
                </p>
              )}
            </div>
          )}
          {notReady.length > 0 && (
            <p role="status">
              {notReady.length} check{notReady.length === 1 ? "" : "s"} not
              ready: dispatch stays held.
            </p>
          )}
          <div className="button-row">
            <button
              type="button"
              className="secondary"
              onClick={() => void save("NoResponse")}
            >
              Record no answer
            </button>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button>{command.busy ? "Saving…" : "Record confirmation"}</button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
