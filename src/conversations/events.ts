// Raised after every Conversations command, so the workspace and the shell's top-bar badge re-read (PPO-CONV-T1C-DESIGN
// 5.7, 10.1). Kept apart from the workspace so the shell can listen without loading the page's components.
export const conversationsChanged = "ppo-conversations-changed";
export const announceConversationsChanged = () => window.dispatchEvent(new Event(conversationsChanged));
