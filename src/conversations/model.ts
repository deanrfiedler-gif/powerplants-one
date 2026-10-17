// Conversations T1b (PPO-CONV-T1-SCOPE). People-only threads on deals and projects; no AI, no Carl.
export const anchorTypes = ["Opportunity", "Project"] as const;
export type AnchorType = (typeof anchorTypes)[number];
export const threadFilters = ["All", "WaitingOnYou", "Mentions"] as const;
export type ThreadFilter = (typeof threadFilters)[number];
// The anchor record's own read capability decides who may read its threads (T1-1).
export const anchorReadCapability = {
  Opportunity: "crm.opportunity.read",
  Project: "project.read",
} as const;
export const maxMentions = 20;
export const maxAsks = 10;
export const askSteps = ["Remind", "TellAsker"] as const;
export type AskStep = (typeof askSteps)[number];
export type MentionInput =
  | { ordinal: number; kind: "Person"; person_id: string }
  | { ordinal: number; kind: "Record"; record_type: AnchorType; record_id: string };
export type AskInput = {
  ordinal: number;
  question: string;
  reply_by: string | null;
};
// The audit object types that name a conversation record, in one place for the receipt reader.
export const conversationObjectTypes = [
  "ConversationThread",
  "ConversationMessage",
  "ConversationAsk",
] as const;
export const conversationOutboxKind = "ConversationChanged";
