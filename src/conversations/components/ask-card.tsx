// A tracked ask under the message that made it (PPO-CONV-T1C-DESIGN 5.3).
import { Button } from "../../components/ui/button";
import { askText, type ThreadAsk } from "../ask-model";

export function AskCard({
  ask,
  viewerId,
  busy,
  onDecline,
}: {
  ask: ThreadAsk;
  viewerId: string;
  busy: boolean;
  onDecline: (ask: ThreadAsk) => void;
}) {
  const text = askText(ask, viewerId);
  return (
    <div className="cv-ask" data-closed={text.closed ? "true" : undefined}>
      <div>
        <p className="cv-ask-lead">{text.lead}</p>
        <p className="cv-ask-detail">{text.detail}</p>
      </div>
      {text.canDecline && (
        <Button variant="quiet" busy={busy} onClick={() => onDecline(ask)}>
          No answer needed
        </Button>
      )}
    </div>
  );
}
