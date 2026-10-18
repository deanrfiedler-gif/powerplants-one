"use client";
import { useId } from "react";
import { workspaces, type WorkspaceId } from "../shell/navigation";
import { useShell } from "./shell-provider";

// Operational department choice is the Workspaces group in More (product-navigation.tsx); the
// separate Workspace dropdown was removed on 18 October 2026 because Figma does not draw it.
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
