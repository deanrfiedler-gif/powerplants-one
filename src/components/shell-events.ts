"use client";
export const shellPanelEvent = "ppo-shell-panel-open";
export function openShellPanel(owner: string) {
  window.dispatchEvent(new CustomEvent(shellPanelEvent, { detail: owner }));
}
