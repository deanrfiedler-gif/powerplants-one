"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ErrorNotice } from "./business-ui";
import { lockLocal } from "../offline/store";
import { lockOtherBusinessViews, sessionReadyEvent } from "./session-signal";
import { HeaderContent } from "./header-content";
import { openShellPanel, shellPanelEvent } from "./shell-events";
import { ShellAccountProfile, accountInitials } from "./shell-account-profile";
import { ShellIcon } from "./shell-icon";
type Identity = {
  actor_id: string;
  workspace_id: string;
  display_name: string;
};
type HostedRole = "tester" | "pack-reviewer";
type HostedRoles = { current: HostedRole; available: HostedRole[] };
const Session = createContext<Identity | null>(null);
export function useIdentity() {
  const p = useContext(Session);
  if (!p) throw Error("Business session is required");
  return p;
}
export function BusinessSession({ children, hosted = false }: { children: React.ReactNode; hosted?: boolean }) {
  const router = useRouter();
  const account = useRef<HTMLElement>(null);
  const [showIdentity, setShowIdentity] = useState(false);
  const [p, setP] = useState<Identity | null>(null),
    [profile, setProfile] = useState("coordinator"),
    [error, setError] = useState<unknown>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [epoch, setEpoch] = useState(0),
    [hostedRoles, setHostedRoles] = useState<HostedRoles | null>(null),
    [hostedRole, setHostedRole] = useState<HostedRole>("tester");
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
  useEffect(() => { if (p) window.dispatchEvent(new Event(sessionReadyEvent)); }, [p]);
  useEffect(() => {
    if (!hosted || !p) return;
    let live = true;
    api<HostedRoles>("demo-role").then(value => {
      if (live) { setHostedRoles(value); setHostedRole(value.current); }
    }, e => { if (live) setError(e); });
    return () => { live = false; };
  }, [hosted, p]);
  useEffect(() => {
    const outside = (event: Event) => { if (!account.current?.contains(event.target as Node)) setShowIdentity(false); };
    const other = (event: Event) => { if ((event as CustomEvent).detail !== "account") setShowIdentity(false); };
    // A late page alert may move focus; keep the identity selector open until
    // an explicit outside click or Escape, especially while initial reads settle.
    document.addEventListener("pointerdown", outside);
    window.addEventListener(shellPanelEvent, other);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener(shellPanelEvent, other); };
  }, []);
  const toggleAccount = () => { openShellPanel("account"); setShowIdentity(!showIdentity); };
  const initials = accountInitials(p?.display_name);
  const closeAccount = () => { setShowIdentity(false); document.getElementById(hosted ? "hosted-account-toggle" : "identity-toggle")?.focus(); };
  const accountTitle = <div className="ppo-panel-titlebar"><h2>Account</h2><button className="ppo-top-action ppo-account-close" aria-label="Close account" onClick={closeAccount}><ShellIcon name="close" /></button></div>;
  const accountFooter = <footer className="ppo-panel-footer"><span className="ppo-preview-label">Powerplants One · r17</span></footer>;
  async function select() {
    if (hosted) return;
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
      lockOtherBusinessViews();
      setBusy(false);
    }
  }
  async function selectHostedRole() {
    if (!hosted || !hostedRoles || hostedRole === hostedRoles.current) return;
    lockOtherBusinessViews();
    setBusy(true);
    setError(null);
    try {
      const next = await api<Identity>("demo-role", { role: hostedRole });
      setP(next);
      setHostedRoles({ ...hostedRoles, current: hostedRole });
      setEpoch(x => x + 1);
      setShowIdentity(false);
      router.push(hostedRole === "pack-reviewer" ? "/service/packs" : "/schedule");
    } catch (e) {
      setError(e);
    } finally {
      lockOtherBusinessViews();
      setBusy(false);
    }
  }
  return (
    <>
      <HeaderContent slot="account">
      {hosted ? <section ref={account} className="identity-strip identity-compact identity-hosted" aria-label="Private demo account" onKeyDown={event => { if (event.key === "Escape") { setShowIdentity(false); document.getElementById("hosted-account-toggle")?.focus(); } }}>
        <div className="hosted-account-summary"><strong title={p?.display_name}>{p?.display_name ?? "Private prototype"}</strong><button id="hosted-account-toggle" className="ppo-account-toggle" aria-label="Account" aria-expanded={showIdentity} aria-controls="hosted-account-controls" onClick={toggleAccount}><span className="account-avatar" aria-hidden="true">{initials}</span></button></div>
        <div id="hosted-account-controls" className="ppo-hosted-account-controls ppo-account-panel" data-open={showIdentity} role="dialog" aria-label="Account">
          {accountTitle}<div className="ppo-panel-body">
          <ShellAccountProfile name={p?.display_name} />
          {p && hostedRoles && <div className="identity-choice">
            <label htmlFor="hosted-role">Demo role</label>
            <select id="hosted-role" value={hostedRole} onChange={event => setHostedRole(event.target.value as HostedRole)} disabled={busy}>
              {hostedRoles.available.map(role => <option key={role} value={role}>{role === "tester" ? "Booking tester" : "Pack reviewer"}</option>)}
            </select>
            <button type="button" onClick={selectHostedRole} disabled={busy || hostedRole === hostedRoles.current}>
              {busy ? "Switching…" : "Use this role"}
            </button>
            <p className="identity-explanation">Each role has separate permissions and an attributable synthetic actor. Switching clears displayed business records.</p>
          </div>}
          {p ? <form action="/auth/logout" method="post" onSubmit={() => lockOtherBusinessViews()}><button className="secondary">Sign out</button></form> : <a href="/login">Sign in with Microsoft</a>}
          </div>{accountFooter}
        </div>
      </section> : <>
      <section
        ref={account}
        className="identity-strip identity-compact"
        aria-label="Local demonstration identity"
        aria-busy={loading || busy}
        onKeyDown={(e) => { if (e.key === "Escape" && showIdentity) { setShowIdentity(false); document.getElementById("identity-toggle")?.focus(); } }}
      >
        <div>
          <strong>
            {p?.display_name ?? "Choose a demonstration identity"}
          </strong>
          {p && <button id="identity-toggle" className="secondary identity-toggle" aria-expanded={showIdentity} aria-controls="identity-controls" aria-label="Change identity" onClick={toggleAccount}><span className="ppo-identity-label">Change identity</span><span className="account-avatar ppo-local-avatar" aria-hidden="true">{initials}</span></button>}
        </div>
        <div id="identity-controls" className="identity-controls ppo-account-panel" hidden={!!(p && !showIdentity)} role="dialog" aria-label="Account">
        {accountTitle}<div className="ppo-panel-body">
        <ShellAccountProfile name={p?.display_name} />
        <p className="identity-explanation">Changing identity clears displayed records and unsaved forms. Saved offline originals stay locked to their original owner.</p>
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
              ["crm-receiver", "Sales receiver"],
              ["cs-reviewer", "Customer records reviewer"],
              ["observer", "Observer"],
              ["site-observer", "Site observer — Q01"],
              ["finance", "Finance preparer"],
              ["finance-reviewer", "Finance reviewer"],
              ["finance-processor", "Finance processor"],
              ["finance-reconciler", "Finance reconciler"],
              ["second-company", "Company B"],
              ["workspace-observer", "Workspace observer"],
              ["materials-author", "Alex Lee — materials author"],
              ["materials-engineer", "Sam Jordan — materials engineer"],
              ["materials-reviewer", "Casey — technical reviewer"],
              ["materials-release", "Drew — material release authority"],
              ["materials-supply", "Robin — Supply Chain coordinator"],
              ["materials-viewer", "Quinn — materials viewer"],
              ["changes-release-owner", "Riley — drawing issue owner"],
              ["changes-service", "Jamie — Service coordinator"],
              ["changes-verifier", "Taylor — commissioning verifier"],
              ["commissioning-equipment", "Morgan — Equipment records"],
              ["estimating-source-reviewer", "Synthetic source evidence reviewer"],
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
      {p && <button className="secondary" onClick={() => { lockOtherBusinessViews(); setP(null); setEpoch(x=>x+1); void (async()=>{try{if(localStorage.getItem("ppo-offline-marker"))await lockLocal();await api("local-session/sign-out",{});}catch(e){setError(e);}finally{lockOtherBusinessViews();}})();}}>Sign out</button>}
        </div>{accountFooter}</div>
      </section>
      </>}
      </HeaderContent>
      <ErrorNotice error={error} />
      {p ? (
        <Session.Provider value={p}>
          <div className="business-content" key={`${p.actor_id}:${epoch}`}>{children}</div>
        </Session.Provider>
      ) : (
        <p className="empty-state">
          {loading ? "Loading demonstration identity…" : hosted ? "Sign in with your invited Microsoft account." : "Select an identity to load its permitted business records."}
        </p>
      )}
    </>
  );
}
