// The composer's mode (PPO-CONV-T1C-DESIGN 5.4). The client is not sent the viewer's capabilities, and seed 108 always
// grants conversation.read and conversation.post together, so a read-only reader is recognised by a refused send.
export type ComposerMode = "post" | "resolved" | "read-only";

export function composerMode(state: "Open" | "Resolved", lastSendError: { status?: number } | null): ComposerMode {
  if (state === "Resolved") return "resolved";
  return lastSendError?.status === 403 ? "read-only" : "post";
}
