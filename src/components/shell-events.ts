"use client";
export const shellPanelEvent = "ppo-shell-panel-open";
export function openShellPanel(owner: string) {
  window.dispatchEvent(new CustomEvent(shellPanelEvent, { detail: owner }));
}
// Phone header amendment P4: on phones the account opens from the header menu, so focus returns to the menu button.
export function focusAccountOpener(toggleId: string) {
  const phoneMenu = window.innerWidth <= 780 ? document.getElementById("shell-phone-menu") : null;
  (phoneMenu ?? document.getElementById(toggleId))?.focus();
}
