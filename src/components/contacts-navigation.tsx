"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIdentity } from "./business-session";
import { useShell } from "./shell-provider";
import { CrmDirectory } from "./crm-directory";
import { departmentHref } from "../shell/navigation";
import { ShellIcon } from "./shell-icon";

export function ContactsNavigation({ view }: { view?: string }) {
  const identity = useIdentity(), shell = useShell(), router = useRouter();
  const selected = view === "people" || view === "organisations" ? view : null;
  const key = `ppo.contacts.view.r01:${identity.workspace_id}:${identity.actor_id}`;
  const permitted = shell.context?.navigation.includes("contacts");
  useEffect(() => {
    if (!permitted) return;
    if (selected) {
      try { localStorage.setItem(key, selected); } catch { /* URL remains authoritative. */ }
    } else {
      let saved = "people";
      try { if (localStorage.getItem(key) === "organisations") saved = "organisations"; } catch { /* deterministic permitted default */ }
      router.replace(departmentHref(`/contacts?view=${saved}`, shell.preview));
    }
  }, [key, permitted, selected, router, shell.preview]);
  if (!shell.context) return <p role="status">Loading Contacts access…</p>;
  if (!permitted) return <p role="alert">Contacts is outside your access.</p>;
  return <section>
    <nav className="module-navigation" aria-label="Contacts views">
      {(["people", "organisations"] as const).map(kind => <Link key={kind} href={departmentHref(`/contacts?view=${kind}`, shell.preview)} aria-current={selected === kind ? "page" : undefined}>
        <ShellIcon name={kind === "people" ? "nav-people" : "nav-organisations"}/>{kind === "people" ? "People" : "Organisations"}
      </Link>)}
    </nav>
    {selected ? <CrmDirectory key={selected} kind={selected}/> : <p role="status">Opening your Contacts view…</p>}
  </section>;
}
