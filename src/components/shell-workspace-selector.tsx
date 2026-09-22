"use client";
import { useId, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  canOpen,
  pageForPath, departmentHref, railDestinations, workspaceIcons,
  destination,
  workspaces,
  type WorkspaceId,
} from "../shell/navigation";
import { useShell } from "./shell-provider";
import { openShellPanel } from "./shell-events";
import { ShellIcon } from "./shell-icon";

export function ShellWorkspaceSelector() {
  const shell = useShell(),
    router = useRouter(), path = usePathname();
  const [notice, setNotice] = useState("");
  const selectId = useId();
  if (!shell.context?.can_preview) return null;
  return (
    <section className="ppo-development" aria-label="Development preview">
      <div className="ppo-development-title">
        <h3>Development</h3>
        <span>Shell preview</span>
      </div>
      <label htmlFor={selectId}>Preview workspace</label>
      <div className="ppo-workspace-choice"><ShellIcon name={workspaceIcons[shell.preview]} /><select
        id={selectId}
        value={shell.preview}
        onChange={(event) => {
          const id = event.target.value as WorkspaceId,
            workspace = workspaces.find((w) => w.id === id);
          if (!workspace) return;
          const saved = shell.selectPreview(id),
            item = (id === "sales" ? railDestinations(id, shell.context?.navigation ?? [], shell.hosted)[0] : undefined) ?? destination(workspace.primary);
          if (canOpen(item, shell.context?.navigation ?? [], shell.hosted)) {
            openShellPanel("navigation");
            router.push(!pageForPath(path)?.workspace ? departmentHref(path + window.location.search, id) : item.href!);
          }
          else if (railDestinations(id, shell.context?.navigation ?? [], shell.hosted).length) {
            openShellPanel("navigation");
            router.push(departmentHref("/work", id));
          }
          setNotice(
            `${workspace.label} selected${saved ? "." : " for this visit; browser storage is unavailable."}${!railDestinations(id, shell.context?.navigation ?? [], shell.hosted).length ? " No department pages are available for this identity." : ""}`,
          );
        }}
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.label}
          </option>
        ))}
      </select><ShellIcon name="down" /></div>
      <p>
        Your last workspace is remembered on this browser.
      </p>
      <button className="ppo-reset-preview" onClick={() => setNotice(shell.resetPreview() ? "Preview preference reset to Sales. Your current page stays open." : "Preview reset for this visit; browser storage is unavailable.")}>Reset preview preference</button>
      <p role="status">{notice}</p>
    </section>
  );
}
