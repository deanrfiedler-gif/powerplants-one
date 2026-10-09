"use client";
import Link from "next/link";
import { ErrorNotice } from "./business-ui";
import { usePlatformResource } from "./platform-resource";
import type { notificationInbox } from "../notifications/service";

type Inbox = Awaited<ReturnType<typeof notificationInbox>>;

export function NotificationBell({ close }: { close: () => void }) {
  const read = usePlatformResource<Inbox>("notifications");
  return (
    <div>
      {read.loading && <p role="status">Loading updates…</p>}
      <ErrorNotice error={read.error} />
      {read.error && <button onClick={read.reload}>Retry notifications</button>}
      {read.data && (
        <>
          {read.data.state !== "unavailable" && (
            <p>
              {read.data.unread}
              {read.data.bounded || read.data.state === "partial"
                ? "+"
                : ""}{" "}
              unread · {read.data.owned} owned activities
            </p>
          )}
          {read.data.state !== "complete" && (
            <p role="alert">Some updates could not be checked.</p>
          )}
          <ul className="sh-bell-list">
            {read.data.items
              .filter((n) => !n.archived || n.required)
              .slice(0, 5)
              .map((n) => (
                <li key={n.id}>
                  <Link href={`/work/updates?notice=${n.id}`} onClick={close}>
                    {!n.is_read && "Unread · "}
                    {n.title}
                  </Link>
                  <small>{new Date(n.event_at).toLocaleString("en-AU")}</small>
                </li>
              ))}
          </ul>
          {!read.data.items.length && read.data.state === "complete" && (
            <p>No permitted updates yet.</p>
          )}
        </>
      )}
      <Link className="ppo-account-link" href="/work/updates" onClick={close}>
        Open Notifications
      </Link>
    </div>
  );
}
