import { randomUUID } from "node:crypto";
import { database } from "../platform/database";
import {
  ChannelOutcomeUnknown,
  type ChannelObservation,
  type ChannelSubmission,
  type CustomerMessageChannel,
  type OutboundCustomerMessage,
} from "./contracts";

// The only customer email channel in the prototype (D-025 R9, ADR-0058). It sends nothing: it keeps
// a simulated Sent Items copy in ppo.synthetic_mailbox_messages so PPO can search for its own
// identifier before any retry. A tag in the synthetic address's local part chooses the simulated
// provider behaviour, so every outcome can be proved: name+bounce@example.invalid.
export type SyntheticBehaviour =
  | "Sent"
  | "Delivered"
  | "Bounced"
  | "Rejected"
  | "LostBeforeAcceptance"
  | "LostAfterAcceptance";
export function syntheticBehaviour(address: string): SyntheticBehaviour {
  switch (/^[^@+]*\+([a-z-]+)@/i.exec(address)?.[1]?.toLowerCase()) {
    case "delivered":
      return "Delivered";
    case "bounce":
      return "Bounced";
    case "reject":
      return "Rejected";
    case "lost-request":
      return "LostBeforeAcceptance";
    case "lost-response":
      return "LostAfterAcceptance";
    default:
      return "Sent";
  }
}
export class SyntheticMailboxChannel implements CustomerMessageChannel {
  readonly name = "Synthetic" as const;
  async submit(m: OutboundCustomerMessage): Promise<ChannelSubmission> {
    const behaviour = syntheticBehaviour(m.to.address);
    if (behaviour === "Rejected")
      return {
        outcome: "Failed",
        error_code: "RecipientRejected",
        detail: "The synthetic provider refused this recipient address.",
      };
    if (behaviour === "LostBeforeAcceptance")
      throw new ChannelOutcomeUnknown(
        "The synthetic hand-over was interrupted before the provider received it.",
      );
    const provider_message_id = `synthetic-${randomUUID()}`;
    // A second copy for the same message is refused: PPO must reconcile, never retry blind (R8).
    await database().query(
      "INSERT INTO ppo.synthetic_mailbox_messages(workspace_id,communication_id,provider_message_id,recipient_address,subject,content_hash,simulated_outcome) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [
        m.workspace_id,
        m.communication_id,
        provider_message_id,
        m.to.address,
        m.subject,
        m.content_hash,
        behaviour === "LostAfterAcceptance" ? "Sent" : behaviour,
      ],
    );
    if (behaviour === "LostAfterAcceptance")
      throw new ChannelOutcomeUnknown(
        "The synthetic provider accepted the message but its response was lost.",
      );
    return { outcome: "Submitted", provider_message_id };
  }
  async observe(
    workspace_id: string,
    communication_id: string,
  ): Promise<ChannelObservation> {
    const row = (
      await database().query(
        "SELECT provider_message_id,simulated_outcome FROM ppo.synthetic_mailbox_messages WHERE workspace_id=$1 AND communication_id=$2",
        [workspace_id, communication_id],
      )
    ).rows[0];
    if (!row) return { found: false };
    return {
      found: true,
      provider_message_id: row.provider_message_id,
      sent: true,
      failed:
        row.simulated_outcome === "Bounced"
          ? { detail: "Synthetic non-delivery report: the recipient's mailbox is unavailable." }
          : null,
      delivered: row.simulated_outcome === "Delivered",
    };
  }
}
export const customerMessageChannel = (): CustomerMessageChannel =>
  new SyntheticMailboxChannel();
