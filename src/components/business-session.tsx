"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api, ErrorNotice } from "./business-ui";
import { usePathname } from "next/navigation";
import { lockLocal } from "../offline/store";
import { lockOtherBusinessViews } from "./session-signal";
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
  const compact = usePathname() === "/crm/opportunities";
  const [showIdentity, setShowIdentity] = useState(false);
  const [p, setP] = useState<Identity | null>(null),
    [profile, setProfile] = useState("coordinator"),
    [error, setError] = useState<unknown>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [epoch, setEpoch] = useState(0);
  useEffect(() => {
    let live = true;
    api<Identity>("local-session").then(
      (v) => {
        if (live) { setP(v); setLoading(false); }
      },
      (e) => {
        if (live) { if (e.status !== 401) setError(e); setLoading(false); }
      },
    );
    return () => {
      live = false;
    };
  }, []);
  async function select() {
    lockOtherBusinessViews();
    setP(null);
    setEpoch((x) => x + 1);
    setBusy(true);
    setError(null);
    try {
      if (localStorage.getItem("ppo-offline-marker")) await lockLocal();
      setP(await api<Identity>("local-session", { profile }));
      setShowIdentity(false);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section
        className={`identity-strip${compact ? " identity-compact" : ""}`}
        aria-label="Local demonstration identity"
        aria-busy={loading || busy}
      >
        <div>
          <strong>
            {p?.display_name ?? "Choose a demonstration identity"}
          </strong>
          {compact && p && <button className="secondary identity-toggle" aria-expanded={showIdentity} aria-controls="identity-controls" onClick={() => setShowIdentity(!showIdentity)}>Change identity</button>}
          <details className="identity-help"><summary>Identity information</summary><small>Changing identity clears displayed records and unsaved forms. Saved offline originals stay locked to their original owner.</small></details>
        </div>
        <div id="identity-controls" className="identity-controls" hidden={!!(compact && p && !showIdentity)}>
        <div className="identity-choice">
          <label htmlFor="business-profile">Identity</label>
          <select
            id="business-profile"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            disabled={loading || busy}
          >
            {[
              ["coordinator", "Coordinator"],
              ["observer", "Observer"],
              ["site-observer", "Site observer — Q01"],
              ["finance", "Finance preparer"],
              ["finance-reviewer", "Finance reviewer"],
              ["finance-processor", "Finance processor"],
              ["finance-reconciler", "Finance reconciler"],
              ["second-company", "Company B"],
              ["workspace-observer", "Workspace observer"],
              ["other-workspace", "Other workspace"],
              ["technician", "Technician — assignment unavailable"],
              ["second-technician", "Morgan — assigned technician"],
              ["assigned-technician", "Riley — assigned technician"],
              ["systems", "Systems — no business access"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <button onClick={select} disabled={loading || busy}>
          {busy ? "Selecting…" : "Use this identity"}
        </button>
      {p && <button className="secondary" onClick={() => { lockOtherBusinessViews(); setP(null); setEpoch(x=>x+1); void (async()=>{try{if(localStorage.getItem("ppo-offline-marker"))await lockLocal();await api("local-session/sign-out",{});}catch(e){setError(e);}})();}}>Sign out</button>}
        </div>
      </section>
      <ErrorNotice error={error} />
      {p ? (
        <Session.Provider value={p}>
          <div key={`${p.actor_id}:${epoch}`}>{children}</div>
        </Session.Provider>
      ) : (
        <p className="empty-state">
          {loading ? "Loading demonstration identity…" : "Select an identity to load its permitted business records."}
        </p>
      )}
    </>
  );
}
