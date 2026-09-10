"use client";

// Carries no identity, role, record or credential. It can only remove displayed context.
let channel: BroadcastChannel | undefined;
export const sessionLockEvent = "ppo-session-lock";
export const sessionReadyEvent = "ppo-session-ready";
export function businessViewChannel() {
  // Sharing one instance within this tab prevents a switch from locking its sender.
  return channel ??= new BroadcastChannel("ppo-session-lock-v1");
}
export function lockOtherBusinessViews() {
  window.dispatchEvent(new Event(sessionLockEvent));
  businessViewChannel().postMessage("Lock");
}
