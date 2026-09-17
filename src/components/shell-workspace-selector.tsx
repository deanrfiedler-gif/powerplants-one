"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  canOpen,
  destination,
  workspaces,
  type WorkspaceId,
} from "../shell/navigation";
import { useShell } from "./shell-provider";
import { openShellPanel } from "./shell-events";

export function ShellWorkspaceSelector() {
  const shell = useShell(),
    router = useRouter();
  const [notice, setNotice] = useState("");
  const selectId = useId();
  if (!shell.context?.can_preview) return null;
  return (
    <section className="ppo-development" aria-label="Development preview">
      <div className="ppo-development-title">
        <h3>Development</h3>
        <span>Preview</span>
      </div>
      <label htmlFor={selectId}>Preview workspace</label>
      <select
        id={selectId}
        value={shell.preview}
        onChange={(event) => {
          const id = event.target.value as WorkspaceId,
            workspace = workspaces.find((w) => w.id === id);
          if (!workspace) return;
          const saved = shell.selectPreview(id),
            item = destination(workspace.primary);
          if (canOpen(item, shell.context?.navigation ?? [], shell.hosted)) {
            openShellPanel("navigation");
            router.push(item.href!);
          }
          setNotice(
            `${workspace.label} selected${saved ? "." : " for this visit; browser storage is unavailable."}${!item.href ? " This workspace is planned; your current page stays open." : !canOpen(item, shell.context?.navigation ?? [], shell.hosted) ? " This identity cannot open that workspace." : ""}`,
          );
        }}
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.label}
          </option>
        ))}
      </select>
      <p>
        Remembered on this browser. Available workspaces open with your current
        access.
      </p>
      <p role="status">{notice}</p>
    </section>
  );
}
