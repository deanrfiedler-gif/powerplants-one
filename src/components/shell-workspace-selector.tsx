"use client";
import { useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { availableWorkspaces, workspaceLanding, workspaceForLocation, departmentHref, workspaces, type WorkspaceId } from "../shell/navigation";
import { useShell } from "./shell-provider";
import { navigateWithReview } from "./navigation-intent";

export function WorkspacePicker() {
  const shell = useShell(), router = useRouter(), path = usePathname(), query = useSearchParams();
  const id = useId(), [notice, setNotice] = useState("");
  const permitted = shell.context?.navigation ?? [];
  const choices = availableWorkspaces(permitted, shell.hosted);
  if (!shell.context || !choices.length) return null;
  const selected = workspaceForLocation(path, new URLSearchParams(query), shell.preview, permitted);
  return <section className="ppo-workspace-picker" aria-label="Workspace choice">
    <label htmlFor={id}>Workspace</label>
    <select id={id} value={choices.some(w => w.id === selected) ? selected : choices[0].id} onChange={event => {
      const next = event.target.value as WorkspaceId, landing = workspaceLanding(next, permitted, shell.hosted);
      if (!landing) return;
      navigateWithReview(() => {
        const saved = shell.selectWorkspace(next);
        setNotice(saved ? "" : "Workspace remembered for this visit; browser storage is unavailable.");
        router.push(departmentHref(landing.href!, next));
      });
    }}>{choices.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}</select>
    {notice && <p role="status">{notice}</p>}
  </section>;
}

// Presentation-only preview is distinct from operational workspace selection.
export function ShellWorkspaceSelector() {
  const shell = useShell(), id = useId();
  if (!shell.development || !shell.context?.can_preview) return null;
  return <section className="ppo-development" aria-label="Development preview"><h3>Development · Shell preview</h3>
    <label htmlFor={id}>Preview workspace</label><select id={id} value={shell.preview} onChange={event => shell.selectPreview(event.target.value as WorkspaceId)}>
      {workspaces.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
    </select><p>Presentation preference only. Operational access remains unchanged.</p>
    <button onClick={shell.resetPreview}>Reset preview preference</button>
  </section>;
}
