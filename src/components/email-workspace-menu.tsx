"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import type { PhoneHeaderConfig } from "../shell/phone-header";
import { messageViews, type MessageView } from "../communications/ui-model";
import "./customer-messages.css";
export function EmailWorkspaceFrame({
  children,
  view,
  counts,
  phoneHeader,
  inbox = false,
}: {
  children: ReactNode;
  view?: MessageView;
  counts?: Partial<Record<MessageView, number>>;
  phoneHeader?: Omit<PhoneHeaderConfig, "chooseView">;
  inbox?: boolean;
}) {
  const [open, setOpen] = useState(true),
    menu = useSecondaryMenu(open, setOpen);
  return (
    <SecondaryMenuFrame
      state={menu}
      id={inbox ? "ppo-email-inbox" : "ppo-customer-messages"}
      name="Email"
      menuId="email-workspace-menu"
      contentId="email-workspace-content"
      attributes={{ "data-ppo-workspace": "shared" }}
      message=""
      phoneHeader={phoneHeader}
      menu={
        <nav aria-label="Email views">
          <h2 className="mw-menu-heading">Mailbox</h2>
          <Link
            className="mw-menu-item"
            aria-current={inbox ? "page" : undefined}
            href="/email"
            onClick={() => menu.closeOverlay()}
          >
            <span>Inbox</span>
          </Link>
          <h2 className="mw-menu-heading">Customer messages</h2>
          {messageViews.map((v) => (
            <Link
              key={v.id}
              className="mw-menu-item"
              aria-current={!inbox && view === v.id ? "page" : undefined}
              href={`/email/customer-messages?view=${v.id}`}
              onClick={() => menu.closeOverlay()}
            >
              <span>{v.label}</span>
              {counts?.[v.id] !== undefined && (
                <span className="cm-menu-count">{counts[v.id]}</span>
              )}
            </Link>
          ))}
          {inbox && (
            <p className="cm-mailbox-status">
              Personal mailbox · synthetic only. Microsoft is not connected.
            </p>
          )}
        </nav>
      }
    >
      {children}
    </SecondaryMenuFrame>
  );
}
