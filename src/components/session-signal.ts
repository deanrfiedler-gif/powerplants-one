"use client";

// Carries no identity, role, record or credential. It can only remove displayed context.
let channel: BroadcastChannel | undefined;
export const sessionLockEvent = "ppo-session-lock";
export const sessionReadyEvent = "ppo-session-ready";
function clearOnlineRecovery() {
  try { sessionStorage.removeItem("ppo-pl01-command-v1"); sessionStorage.removeItem("ppo-pl01-command-v1:accepted"); } catch { /* Storage may already be unavailable. */ }
}
export function businessViewChannel() {
  // Sharing one instance within this tab prevents a switch from locking its sender.
  if (!channel) {
    channel = new BroadcastChannel("ppo-session-lock-v1");
    channel.addEventListener("message", event => { if (event.data === "Lock") { clearOnlineRecovery(); window.dispatchEvent(new Event(sessionLockEvent)); } });
  }
  return channel;
}
export function lockOtherBusinessViews() {
  clearOnlineRecovery();
  window.dispatchEvent(new Event(sessionLockEvent));
  businessViewChannel().postMessage("Lock");
}
