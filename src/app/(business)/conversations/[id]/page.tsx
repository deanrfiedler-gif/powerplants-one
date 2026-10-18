"use client";
import { useParams } from "next/navigation";
import { ThreadComposer } from "../../../../conversations/components/composer";
import { ThreadView } from "../../../../conversations/components/thread-view";
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <ThreadView key={id} id={id} footer={(thread, reload) => <ThreadComposer thread={thread} reload={reload} />} />;
}
