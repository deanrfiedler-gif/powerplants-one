import { ConversationsWorkspace } from "../../../conversations/components/conversations-workspace";
import "../../../conversations/components/conversations.css";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ConversationsWorkspace>{children}</ConversationsWorkspace>;
}
