// One message (PPO-CONV-T1C-DESIGN 5.3): `@` tags drawn as names, `#` links drawn from the reader's own access (T1-4).
import { RecordLink } from "../../components/business-ui";
import { formatTimestamp } from "../../shell/date-format";
import { segments, type DrawnMention } from "../composition";

export type ThreadMessage = {
  id: string;
  sequence: number;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
  mentions: DrawnMention[];
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toLocaleUpperCase("en-AU"))
    .join("");

export function Message({ message }: { message: ThreadMessage }) {
  return (
    <article className="cv-message" aria-label={`${message.author_name}, ${formatTimestamp(message.created_at)}`}>
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
            ) : s.kind === "person" ? (
              <span key={i} className="cv-mention">
                {s.name}
              </span>
            ) : s.mention.kind === "Record" && s.mention.can_open ? (
              <RecordLink key={i} type={s.mention.record_type} id={s.mention.record_id}>
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
