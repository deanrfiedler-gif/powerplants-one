"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api, ErrorNotice } from "./business-ui";
type Identity = {
  actor_id: string;
  workspace_id: string;
  display_name: string;
};
const Session = createContext<Identity | null>(null);
export function useIdentity() {
  const p = useContext(Session);
  if (!p) throw Error("Business session is required");
  return p;
}
export function BusinessSession({ children }: { children: React.ReactNode }) {
  const [p, setP] = useState<Identity | null>(null),
    [profile, setProfile] = useState("coordinator"),
    [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false),
    [epoch, setEpoch] = useState(0);
  useEffect(() => {
    let live = true;
    api<Identity>("local-session").then(
      (v) => {
        if (live) setP(v);
      },
      (e) => {
        if (live && e.status !== 401) setError(e);
      },
    );
    return () => {
      live = false;
    };
  }, []);
  async function select() {
    setP(null);
    setEpoch((x) => x + 1);
    setBusy(true);
    setError(null);
    try {
      setP(await api<Identity>("local-session", { profile }));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section
        className="identity-strip"
        aria-label="Local demonstration identity"
      >
        <div>
          <strong>
            {p?.display_name ?? "Choose a demonstration identity"}
          </strong>
          <small>
            Changing identity clears the displayed records and unsaved forms.
          </small>
        </div>
        <div className="identity-choice">
          <label htmlFor="business-profile">Identity</label>
          <select
            id="business-profile"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            disabled={busy}
          >
            {[
              ["coordinator", "Coordinator"],
              ["observer", "Observer"],
              ["site-observer", "Site observer — Q01"],
              ["finance", "Finance context"],
              ["second-company", "Company B"],
              ["workspace-observer", "Workspace observer"],
              ["other-workspace", "Other workspace"],
              ["technician", "Technician — assignment unavailable"],
              ["systems", "Systems — no business access"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <button onClick={select} disabled={busy}>
          {busy ? "Selecting…" : "Use this identity"}
        </button>
      </section>
      <ErrorNotice error={error} />
      {p ? (
        <Session.Provider value={p}>
          <div key={`${p.actor_id}:${epoch}`}>{children}</div>
        </Session.Provider>
      ) : (
        <p className="empty-state">
          Select an identity to load its permitted business records.
        </p>
      )}
    </>
  );
}
