// The /conversations page body (PPO-CONV-T1C-DESIGN 5.3, 5.6): the drawn empty page when the viewer has no
// conversations. With conversations, the phone shows the sidebar list and the desktop opens a thread.
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../components/ui/button";
import { preferredThread } from "../sidebar-model";
import { useConversationList } from "./conversations-workspace";

// Matches the shell's phone breakpoint (shared-layout.css): wider screens show the sidebar and a thread together.
const wide = () => window.matchMedia("(min-width: 781px)").matches;

export function ConversationsHome() {
  const { items } = useConversationList();
  const router = useRouter();
  const creating = useSearchParams().get("new") === "1";
  const open = items?.length && !creating ? preferredThread(items) : null;
  useEffect(() => {
    if (open && wide()) router.replace(`/conversations/${open}`);
  }, [open, router]);
  if (!items || items.length) return null;
  return (
    <div className="cv-empty">
      <h1>Start a conversation about a deal or project</h1>
      <p>
        Ask a colleague, link a record with #, and the question is tracked until they reply. Every conversation belongs
        to one record.
      </p>
      <Button variant="primary" onClick={() => router.push("/conversations?new=1")}>
        New thread
      </Button>
    </div>
  );
}
