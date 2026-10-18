"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { emptyDraft, type Draft } from "../../../../conversations/composition";
import { ThreadComposer } from "../../../../conversations/components/composer";
import { ThreadView } from "../../../../conversations/components/thread-view";
export default function Page() {
  const { id } = useParams<{ id: string }>();
  // Drafts are kept per thread above the thread's own read (PPO-CONV-T1C-DESIGN 5.7).
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const draft = drafts[id] ?? emptyDraft();
  const onDraft = (d: Draft) => setDrafts((all) => ({ ...all, [id]: d }));
  return (
    <ThreadView
      key={id}
      id={id}
      footer={(thread, reload) => <ThreadComposer thread={thread} reload={reload} draft={draft} onDraft={onDraft} />}
    />
  );
}
