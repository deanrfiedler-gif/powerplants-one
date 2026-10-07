"use client";
import { useShell } from "./shell-provider";
export function OfflineEntry({ children, newTab = false }: { children: React.ReactNode; newTab?: boolean }) {
  const { hosted } = useShell();
  return hosted ? <span>Offline originals and recovery are available in the local field workspace. This hosted demo supports online work.</span> :
    <a href="/offline/index.html" target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined}>{children}</a>;
}
