"use client";
import { useCallback, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { emptyDraft, type Draft } from "../../../../conversations/composition";
import { ThreadComposer } from "../../../../conversations/components/composer";
import { ContextAside, ContextButton, ContextOverlay, useContextDocked } from "../../../../conversations/components/context-panel";
import { ThreadView } from "../../../../conversations/components/thread-view";
export default function Page() {
  const { id } = useParams<{ id: string }>();
  // Drafts are kept per thread above the thread's own read (PPO-CONV-T1C-DESIGN 5.7).
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const draft = drafts[id] ?? emptyDraft();
  const onDraft = (d: Draft) => setDrafts((all) => ({ ...all, [id]: d }));
  // The context panel (11): docked open on wide screens until closed; elsewhere opened from the Context button.
  const docked = useContextDocked();
  const [dockedClosed, setDockedClosed] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const focusButton = useRef(false);
  const showDocked = docked === true && !dockedClosed;
  const open = useCallback(() => (docked ? setDockedClosed(false) : setOverlayOpen(true)), [docked]);
  const closeOverlay = useCallback(() => setOverlayOpen(false), []);
  return (
    <div className="cv-thread-layout" data-context={showDocked ? "docked" : "closed"}>
      <ThreadView
        key={id}
        id={id}
        headerAction={docked !== null && !showDocked ? <ContextButton onOpen={open} focusOnMount={focusButton} /> : undefined}
        footer={(thread, reload) => <ThreadComposer thread={thread} reload={reload} draft={draft} onDraft={onDraft} />}
      />
      {showDocked && (
        <ContextAside
          key={id}
          threadId={id}
          onClose={() => {
            focusButton.current = true;
            setDockedClosed(true);
          }}
        />
      )}
      {docked === false && overlayOpen && <ContextOverlay key={id} threadId={id} onClose={closeOverlay} />}
    </div>
  );
}
