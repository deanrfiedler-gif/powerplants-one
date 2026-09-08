"use client";

// Carries no identity, role, record or credential. It can only remove displayed context.
let channel: BroadcastChannel | undefined;
export function businessViewChannel() {
  // Sharing one instance within this tab prevents a switch from locking its sender.
  return channel ??= new BroadcastChannel("ppo-session-lock-v1");
}
export function lockOtherBusinessViews() {
  businessViewChannel().postMessage("Lock");
}
