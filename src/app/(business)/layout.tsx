import { BusinessSession } from "../../components/business-session";
export const dynamic = "force-dynamic";
export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BusinessSession hosted={process.env.PPO_ENV === "azure-demo"}>{children}</BusinessSession>;
}
