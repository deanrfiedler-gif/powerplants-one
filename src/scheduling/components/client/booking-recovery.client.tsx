"use client";
import Link from "next/link";
import { api, ErrorNotice } from "../../../components/business-ui";
import { useIdentity } from "../../../components/business-session";
import { useRecoverableCommand } from "../../../shared/ui/use-recoverable-command";
import { bookingJournalKey, acceptsBookingEntry } from "../../booking-journal";
export function useBookingCommand(enabled = true) {
  const scope = useIdentity();
  return useRecoverableCommand({ key: bookingJournalKey, scope, accepts: acceptsBookingEntry, transport: api, enabled });
}
export function BookingRecovery({ command }: { command: ReturnType<typeof useBookingCommand> }) {
  const entry = command.pending;
  return <>
    <ErrorNotice error={command.error} />
    {entry && <section className="planner-warning" aria-label="Original operation recovery">
      <h3>{entry.label}: {command.busy ? "checking saved outcome…" : "outcome not yet resolved"}</h3>
      <p>The exact original is retained in this tab. An unavailable receipt does not prove that saving failed. Closing the tab or clearing its session removes this recovery copy.</p>
      <div className="button-row">
        <button className="secondary" disabled={command.busy} onClick={() => void command.recover()}>Check original receipt</button>
        <button disabled={command.busy} onClick={() => void command.retry()}>Retry unchanged original</button>
        <Link href={entry.target}>Inspect original appointment</Link>
      </div>
    </section>}
    {command.accepted && <section className="save-notice" aria-label="Saved booking step">
      <p role="status">{command.accepted.entry.label} saved. Each later booking step is saved separately.</p>
      <Link className="button" href={command.accepted.entry.target}>Continue booking / View appointment</Link>
    </section>}
  </>;
}
