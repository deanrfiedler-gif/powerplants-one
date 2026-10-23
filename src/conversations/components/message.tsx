// One message (PPO-CONV-T1C-DESIGN 5.3): `@` tags drawn as names, `#` links drawn from the reader's own access (T1-4).
import { RecordLink } from "../../components/business-ui";
import Link from "next/link";
import {
  agentName,
  agentLabel,
  type AdapterLabel,
  type TurnReason,
  type TurnState,
} from "../../assistant/model";
import type { ReaderClaim, ReaderSource } from "../../assistant/reader-view";
import { formatTimestamp } from "../../shell/date-format";
import { segments, type DrawnMention } from "../composition";
import { AgentAvatar } from "./agent-avatar";

export type ThreadMessage = {
  id: string;
  sequence: number;
  author_kind?: "Person" | "Agent";
  author_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
  mentions: DrawnMention[];
  acted_for?: { user_id: string; display_name: string };
  agent?: {
    outcome: "Answered" | "CannotAnswer";
    adapter: AdapterLabel;
    label: string;
    claims: ReaderClaim[];
    sources: ReaderSource[];
    left_out: number;
  };
};

export type ThreadTurn = {
  id: string;
  trigger_message_id: string;
  state: TurnState;
  acted_for_id: string;
  reason: TurnReason | null;
};
const reasons: Record<TurnReason, string> = {
  FeatureOff: `${agentName} is switched off.`,
  BudgetSpent: "This month's AI budget is spent.",
  PriceMissing: "Pricing is not available.",
  CreditExhausted: "Provider credit is exhausted.",
  ProviderUnavailable: "The provider is unavailable.",
  Declined: `${agentName} could not help with that request.`,
  NoEvidence: "No permitted evidence was available.",
  InvalidCitation: "The answer's sources could not be validated.",
  UnsafeOutput: "The answer could not be safely displayed.",
  TurnLimit: "The answer reached its limit.",
  Timeout: "The answer reached its time limit.",
  Interrupted: "The answer was interrupted.",
  AccessChanged:
    "Access to the evidence changed before the answer could be posted.",
  ThreadResolved:
    "The conversation was resolved before the answer could be posted.",
  ActorLostAccess: "Your access changed before the answer could be posted.",
  RateLimited: "The provider is temporarily limiting requests.",
  MalformedOutput: "The answer could not be validated.",
  InternalError: "The answer could not be completed.",
};

// P3: only the server can disclose a reason, and it projects one solely for the tagger.
export function AssistantTurnStatus({
  turn,
  actedFor,
}: {
  turn: ThreadTurn;
  actedFor: string;
}) {
  if (turn.state === "Answered" || turn.state === "CannotAnswer") return null;
  const lead =
    turn.state === "Queued"
      ? `${agentName} is queued for ${actedFor}`
      : turn.state === "Answering"
        ? `${agentName} is answering for ${actedFor}`
        : turn.state === "Unavailable"
          ? `${agentName} is unavailable`
          : turn.state === "Discarded"
            ? `${agentName}'s answer was discarded`
            : `${agentName} could not complete this answer`;
  return (
    <div className="cv-turn" data-state={turn.state} role="status">
      <AgentAvatar />
      <div>
        <strong>{lead}</strong>
        {turn.reason && <p>{reasons[turn.reason]}</p>}
        {turn.state !== "Queued" && turn.state !== "Answering" && (
          <p>
            The message is still posted. People can continue the conversation.
          </p>
        )}
      </div>
    </div>
  );
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toLocaleUpperCase("en-AU"))
    .join("");

export function Message({ message }: { message: ThreadMessage }) {
  if (message.author_kind === "Agent")
    return (
      <article
        className="cv-message cv-agent-message"
        aria-label={`${agentLabel}, ${formatTimestamp(message.created_at)}`}
      >
        <AgentAvatar />
        <div className="cv-message-content">
          <p className="cv-message-header">
            <strong>{agentLabel}</strong>
            <span>
              Acting for {message.acted_for?.display_name} ·{" "}
              {formatTimestamp(message.created_at)}
            </span>
          </p>
          {message.agent?.adapter === "Simulated" && (
            <span className="cv-simulated">Simulated</span>
          )}
          <p className="cv-message-body">{message.body}</p>
          {!!message.agent?.sources.length && (
            <div className="cv-agent-sources" aria-label="Sources">
              <span className="cv-source-heading">Sources</span>
              {message.agent.sources.map((s) =>
                s.can_open ? (
                  <Link
                    key={s.number}
                    href={s.route}
                    className="cv-record-link cv-source"
                  >
                    <span className="cv-source-number">[{s.number}]</span>
                    <span className="cv-source-label">{s.label}</span>
                  </Link>
                ) : (
                  <span key={s.number} className="cv-record-hidden cv-source">
                    [{s.number}] A record you can&apos;t open
                  </span>
                ),
              )}
            </div>
          )}
        </div>
      </article>
    );
  return (
    <article
      className="cv-message"
      aria-label={`${message.author_name}, ${formatTimestamp(message.created_at)}`}
    >
      <span className="cv-avatar" aria-hidden="true">
        {initials(message.author_name)}
      </span>
      <div className="cv-message-content">
        <p className="cv-message-header">
          <strong>{message.author_name}</strong>
          <span>{formatTimestamp(message.created_at)}</span>
        </p>
        <p className="cv-message-body">
          {segments(message.body, message.mentions).map((s, i) =>
            s.kind === "text" ? (
              <span key={i}>{s.text}</span>
            ) : s.kind === "person" || s.kind === "agent" ? (
              <span
                key={i}
                className={
                  s.kind === "agent"
                    ? "cv-mention cv-agent-mention"
                    : "cv-mention"
                }
              >
                {s.name}
              </span>
            ) : s.mention.kind === "Record" && s.mention.can_open ? (
              <RecordLink
                key={i}
                type={s.mention.record_type}
                id={s.mention.record_id}
              >
                <span className="cv-record-link">
                  {s.mention.display_number} · {s.mention.title}
                </span>
              </RecordLink>
            ) : (
              <span key={i} className="cv-record-hidden">
                A record you can&apos;t open
              </span>
            ),
          )}
        </p>
      </div>
    </article>
  );
}
