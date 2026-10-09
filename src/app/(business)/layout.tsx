import type { Metadata } from "next";
import { BusinessSession } from "../../components/business-session";
export const dynamic = "force-dynamic";
// NR-17: the shell header names each page; the root default title would otherwise come first.
export const metadata: Metadata = { title: null };
export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BusinessSession hosted={process.env.PPO_ENV === "azure-demo"}>{children}</BusinessSession>;
}
