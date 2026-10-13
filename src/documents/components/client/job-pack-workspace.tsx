"use client";
import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { useIdentity } from "../../../components/business-session";
import {
  SecondaryMenuFrame,
  useSecondaryMenu,
} from "../../../shell/secondary-menu";

export function usePackPreference(name: string, fallback = true) {
  const identity = useIdentity();
  const key = `ppo:job-pack:${identity.workspace_id}:${identity.actor_id}:${name}`;
  const memory = useRef<Record<string, boolean>>({});
  const value = useSyncExternalStore(
    (listener) => {
      window.addEventListener("storage", listener);
      window.addEventListener("ppo:pack-layout", listener);
      return () => {
        window.removeEventListener("storage", listener);
        window.removeEventListener("ppo:pack-layout", listener);
      };
    },
    () => {
      try {
        const raw = localStorage.getItem(key);
        return raw === null
          ? (memory.current[key] ?? fallback)
          : raw === "true";
      } catch {
        return memory.current[key] ?? fallback;
      }
    },
    () => fallback,
  );
  return [
    value,
    (next: boolean) => {
      memory.current[key] = next;
      try {
        localStorage.setItem(key, String(next));
      } catch {
        /* Display preference only. */
      }
      window.dispatchEvent(new Event("ppo:pack-layout"));
    },
  ] as const;
}
export function JobPackWorkspace({
  menu,
  children,
  register = false,
}: {
  menu: ReactNode;
  children: ReactNode;
  register?: boolean;
}) {
  const [open, remember] = usePackPreference("menu");
  const state = useSecondaryMenu(open, remember);
  const id = register ? "ppo-pack-register" : "ppo-job-pack";
  return (
    <SecondaryMenuFrame
      id={id}
      name="Job packs"
      state={state}
      menuId={`${id}-menu`}
      contentId={`${id}-content`}
      attributes={{ "data-pack-design": "figma" }}
      message=""
      menu={
        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a,button[data-pack-view]"))
              state.closeOverlay(false);
          }}
        >
          {menu}
        </div>
      }
    >
      {children}
    </SecondaryMenuFrame>
  );
}
