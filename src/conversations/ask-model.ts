// Ask cards (PPO-CONV-T1C-DESIGN 5.3): the person asked sees "Waiting on you" and may say no answer is needed; everyone
// else sees who the ask waits on. Closed asks are muted.
export type ThreadAsk = {
  id: string;
  message_id: string;
  ordinal: number;
  asker_id: string;
  asker_name: string;
  asked_id: string;
  asked_name: string;
  question: string;
  reply_by: string | null;
  state: "Open" | "Answered" | "NoAnswerNeeded";
  version: number;
  closed_at: string | null;
  closing_message_id: string | null;
  reminded_at: string | null;
  asker_told_at: string | null;
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// A reply-by date is a civil day, so it is shown as written, with no time zone conversion.
const civilDay = (day: string) => {
  const [, m, d] = day.split("-").map(Number);
  return `${d} ${months[m - 1]}`;
};

export function askText(ask: ThreadAsk, viewerId: string) {
  if (ask.state === "Answered") return { lead: `Answered by ${ask.asked_name}`, detail: `Asked by ${ask.asker_name}`, canDecline: false, closed: true };
  if (ask.state === "NoAnswerNeeded") return { lead: "No answer needed", detail: `Asked by ${ask.asker_name}`, canDecline: false, closed: true };
  const mine = ask.asked_id === viewerId;
  return {
    lead: `Waiting on ${mine ? "you" : ask.asked_name} · ${ask.question}`,
    detail: `Asked by ${ask.asker_name}${ask.reply_by ? ` · reply by ${civilDay(ask.reply_by)}` : ""}`,
    canDecline: mine,
    closed: false,
  };
}
