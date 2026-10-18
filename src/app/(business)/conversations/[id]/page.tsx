"use client";
import { useParams } from "next/navigation";
import { ThreadView } from "../../../../conversations/components/thread-view";
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <ThreadView key={id} id={id} />;
}
