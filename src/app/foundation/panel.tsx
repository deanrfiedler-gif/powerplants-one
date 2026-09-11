"use client";
import { useEffect, useState } from "react";
import type { DraftCommand, Receipt, TicketView } from "../../service/tickets";
import { lockOtherBusinessViews, sessionReadyEvent } from "../../components/session-signal";
import { lockLocal } from "../../offline/store";
const ticketId = "40000000-0000-4000-8000-000000000001";
type ApiFailure = {
  code: string;
  message: string;
  field_errors?: { field: string; message: string }[];
};
async function api<T>(path: string, body?: unknown): Promise<T> {
  const changingIdentity = path === "local-session" && !!body;
  if (changingIdentity) {
    lockOtherBusinessViews();
    if (localStorage.getItem("ppo-offline-marker")) await lockLocal();
  }
  try {
  const response = await fetch(`/api/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const value = await response.json();
  if (!response.ok) throw value;
  return value as T;
  } finally {
    if (changingIdentity) lockOtherBusinessViews();
  }
}
export function FoundationPanel() {
  const [profile, setProfile] = useState("coordinator"),
    [actor, setActor] = useState("No identity selected");
  const [health, setHealth] = useState("Checking connection…"),
    [ticket, setTicket] = useState<TicketView | null>(null);
  const [summary, setSummary] = useState(""),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(
      "Select an identity to read the demonstration request.",
    );
  const [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState<DraftCommand | null>(null);
  const [storage, setStorage] = useState(
    "Not checked. This experiment stores a synthetic marker only.",
  );
  const [shared, setShared] = useState<{
    site_name: string;
    assets: { id: string; description: string; identity_status: string }[];
    history: {
      id: string;
      summary: string;
      author_label: string;
      site_label: string;
    }[];
  } | null>(null);
  const [sharedMessage, setSharedMessage] = useState(
    "Select an identity, then inspect the shared synthetic context.",
  );
  const [sharedError, setSharedError] = useState(false);
  async function loadShared() {
    setBusy(true);
    setShared(null);
    setSharedError(false);
    try {
      const site = await api<{
        items: {
          display_name: string;
          assets: {
            items: {
              id: string;
              description: string;
              identity_status: string;
            }[];
          };
        }[];
      }>("sites/70000000-0000-4000-8000-000000000001");
      const history = await api<{
        items: {
          id: string;
          summary: string;
          author_label: string;
          site_label: string;
        }[];
      }>("assets/80000000-0000-4000-8000-000000000001/history");
      setShared({
        site_name: site.items[0].display_name,
        assets: site.items[0].assets.items,
        history: history.items,
      });
      setSharedMessage(
        "Shared context loaded from PostgreSQL. Only permitted records and history are shown.",
      );
    } catch (e) {
      setSharedError(true);
      setSharedMessage(
        (e as ApiFailure).message ??
          "Shared context could not be loaded. Check the connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function showError(e: unknown) {
    const f = e as ApiFailure;
    setError(true);
    setMessage(
      (f.message ??
        "The result could not be confirmed. Retry when the local application is available.") +
        (f.field_errors?.map((x) => ` ${x.field}: ${x.message}`).join("") ??
          ""),
    );
  }
  async function checkHealth() {
    try {
      await api("health");
      setHealth("PostgreSQL connected");
    } catch {
      setHealth("Database unavailable — check local setup");
    }
  }
  useEffect(() => {
    let active = true;
    void api("health").then(
      () => {
        if (active) setHealth("PostgreSQL connected");
      },
      () => {
        if (active) setHealth("Database unavailable — check local setup");
      },
    );
    return () => {
      active = false;
    };
  }, []);
  async function load(preserve = false) {
    const result = await api<{ items: TicketView[] }>(
      `service/tickets/${ticketId}`,
    );
    setTicket(result.items[0]);
    if (!preserve) setSummary(result.items[0].summary);
  }
  async function selectIdentity() {
    setBusy(true);
    setError(false);
    setTicket(null);
    setShared(null);
    setSharedMessage(
      "Identity changed. Load shared context to check its permissions.",
    );
    setSharedError(false);
    setAttempt(null);
    try {
      const p = await api<{ display_name: string }>("local-session", {
        profile,
      });
      setActor(p.display_name);
      window.dispatchEvent(new Event(sessionReadyEvent));
      await load();
      setMessage("Request loaded from PostgreSQL.");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!ticket) return;
    setBusy(true);
    setError(false);
    const command =
      attempt ??
      ({
        operation_id: crypto.randomUUID(),
        expected_version: ticket.version,
        schema_version: 1,
        summary,
        reason,
      } satisfies DraftCommand);
    setAttempt(command);
    setMessage("Saving to the local database…");
    try {
      const r = await api<Receipt>(
        `service/tickets/${ticketId}/save-draft`,
        command,
      );
      setAttempt(null);
      setTicket({
        ...ticket,
        summary: command.summary.trim(),
        version: r.record_version,
      });
      setReason("");
      setMessage(`Saved to PostgreSQL. Record version ${r.record_version}.`);
    } catch (e) {
      const f = e as ApiFailure;
      if (f.code && f.code !== "DependencyUnavailable") setAttempt(null);
      showError(e);
    } finally {
      setBusy(false);
    }
  }
  async function storageCheck() {
    setStorage("Checking browser storage…");
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("PPO-P01-feasibility", 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore("markers");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const previous = await new Promise<unknown>((resolve, reject) => {
        const tx = db.transaction("markers", "readonly"),
          request = tx.objectStore("markers").get("synthetic-marker");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("markers", "readwrite");
        tx.objectStore("markers").put(
          "SYN-PPO-P01-marker-v1",
          "synthetic-marker",
        );
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      db.close();
      const persistent = await navigator.storage.persist(),
        estimate = await navigator.storage.estimate();
      setStorage(
        `Synthetic marker committed. ${previous === "SYN-PPO-P01-marker-v1" ? "Previous marker recovered." : "Run again after reloading to check recovery."} Persistent storage: ${persistent ? "granted" : "not granted"}. Reported quota: ${estimate.quota ?? "unknown"} bytes. This does not prove offline or mobile readiness.`,
      );
    } catch {
      setStorage("Browser storage check failed. No durable save is claimed.");
    }
  }
  return (
    <div className="proof-grid">
      <section className="card">
        <h2>Local identity</h2>
        <p>
          Each choice uses a separate server identity and audit actor. These
          demonstration roles have no operational authority.
        </p>
        <label htmlFor="profile">Demonstration identity</label>
        <select
          id="profile"
          value={profile}
          disabled={busy || !!attempt}
          onChange={(e) => setProfile(e.target.value)}
        >
          <option value="coordinator">Coordinator · read and edit</option>
          <option value="observer">Observer · read only</option>
          <option value="site-observer">Site observer · Q01 only</option>
          <option value="technician">
            Technician · assignment unavailable
          </option>
          <option value="finance">Finance · permitted source context</option>
          <option value="second-company">Company B · separate scope</option>
          <option value="systems">Systems · no business grants</option>
          <option value="other-workspace">
            Other workspace · separate scope
          </option>
        </select>
        <button onClick={selectIdentity} disabled={busy || !!attempt}>
          Use this identity
        </button>
        <dl>
          <dt>Current actor</dt>
          <dd>{actor}</dd>
          <dt>Database</dt>
          <dd>{health}</dd>
        </dl>
        <button className="secondary" onClick={checkHealth} disabled={busy}>
          Check connection
        </button>
      </section>
      <section className="card">
        <div className="section-heading">
          <h2>Demonstration request</h2>
          <span className="badge">Synthetic</span>
        </div>
        <p
          className={error ? "message error" : "message"}
          role={error ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
        {ticket ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <p className="reference">
              {ticket.display_number} · {ticket.status} · Version{" "}
              {ticket.version}
            </p>
            <label htmlFor="summary">Request summary</label>
            <input
              id="summary"
              required
              maxLength={200}
              value={summary}
              disabled={!ticket.can_edit || busy || !!attempt}
              onChange={(e) => setSummary(e.target.value)}
            />
            <label htmlFor="reason">Reason for change</label>
            <input
              id="reason"
              required
              maxLength={1000}
              value={reason}
              disabled={!ticket.can_edit || busy || !!attempt}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="actions">
              <button type="submit" disabled={!ticket.can_edit || busy}>
                {busy
                  ? "Saving…"
                  : attempt
                    ? "Retry the same save"
                    : "Save draft"}
              </button>
              <button
                className="secondary"
                type="button"
                disabled={busy || !!attempt}
                onClick={async () => {
                  try {
                    await load(true);
                    setError(false);
                    setMessage(
                      "Current version loaded. Your proposed text is retained for review.",
                    );
                  } catch (e) {
                    showError(e);
                  }
                }}
              >
                Reload current version
              </button>
            </div>
            {!ticket.can_edit && (
              <p>This identity can read the request but cannot save changes.</p>
            )}
            {attempt && !busy && (
              <p>
                The outcome is unconfirmed. Retry sends the same operation and
                content to prevent duplicate effects.
              </p>
            )}
          </form>
        ) : (
          <p className="empty-state">
            A permitted identity and an available database are required to load
            this request.
          </p>
        )}
      </section>
      <section className="card storage" aria-labelledby="shared-heading">
        <h2 id="shared-heading">Shared data checks</h2>
        <p>
          Inspect the P02 foundation using synthetic fixtures. Customer and
          service-intake screens are planned for P03.
        </p>
        <button onClick={loadShared} disabled={busy || !!attempt}>
          Load shared context
        </button>
        <p
          role={sharedError ? "alert" : "status"}
          className={sharedError ? "message error" : "message"}
        >
          {sharedMessage}
        </p>
        {shared && (
          <div>
            <h3>{shared.site_name}</h3>
            <ul>
              {shared.assets.map((a) => (
                <li key={a.id}>
                  {a.description} · Identity: {a.identity_status}
                </li>
              ))}
            </ul>
            <h3>Permitted attributed history</h3>
            {shared.history.length ? (
              shared.history.map((h) => (
                <article key={h.id}>
                  <p>{h.summary}</p>
                  <p className="reference">
                    {h.author_label} · {h.site_label}
                  </p>
                </article>
              ))
            ) : (
              <p>No history is available within this identity’s scope.</p>
            )}
          </div>
        )}
      </section>
      <details className="card storage">
        <summary>Browser-storage experiment</summary>
        <p>
          This bounded check writes one synthetic marker to IndexedDB. Reload
          this page and run it again to check that the marker can be recovered.
        </p>
        <button onClick={storageCheck}>Check browser storage</button>
        <p role="status">{storage}</p>
      </details>
    </div>
  );
}
