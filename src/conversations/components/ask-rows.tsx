// One ask row per tagged person (PPO-CONV-T1C-DESIGN 5.4): an Ask switch, off by default; when on, a required short
// question and an optional reply-by date, both sent with the message.
import type { Draft, DraftAsk } from "../composition";

const todayCivil = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function AskRows({ draft, onChange }: { draft: Draft; onChange: (asks: DraftAsk[]) => void }) {
  if (!draft.asks.length) return null;
  const nameOf = (personId: string) => {
    const m = draft.mentions.find((x) => x.kind === "Person" && x.person_id === personId);
    return m?.kind === "Person" ? m.display_name : "";
  };
  const update = (personId: string, change: Partial<DraftAsk>) =>
    onChange(draft.asks.map((a) => (a.person_id === personId ? { ...a, ...change } : a)));
  return (
    <div className="cv-ask-rows">
      {draft.asks.map((a) => {
        const name = nameOf(a.person_id);
        return (
          <div key={a.person_id} className="cv-ask-row">
            <button
              type="button"
              role="switch"
              aria-checked={a.on}
              className="cv-switch"
              onClick={() => update(a.person_id, { on: !a.on })}
            >
              <span className="cv-switch-track" aria-hidden="true" />
              Ask {name}
            </button>
            {a.on && (
              <>
                <input
                  aria-label={`Question for ${name}`}
                  placeholder="Short question, for example delivery date"
                  maxLength={500}
                  value={a.question}
                  onChange={(e) => update(a.person_id, { question: e.target.value })}
                />
                <label className="cv-reply-by">
                  <span>Reply by</span>
                  <input
                    type="date"
                    aria-label={`Reply by for ${name}`}
                    min={todayCivil()}
                    value={a.reply_by ?? ""}
                    onChange={(e) => update(a.person_id, { reply_by: e.target.value || null })}
                  />
                </label>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
