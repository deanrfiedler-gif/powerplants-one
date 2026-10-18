// The /conversations page body (PPO-CONV-T1C-DESIGN 5.3, 5.6): the drawn empty page when the viewer has no
// conversations. With conversations, the phone shows the sidebar list and the desktop opens a thread.
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { useConversationList } from "./conversations-workspace";

export function ConversationsHome() {
  const { items } = useConversationList();
  const router = useRouter();
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
