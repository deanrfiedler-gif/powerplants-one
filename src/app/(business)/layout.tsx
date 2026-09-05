import { BusinessSession } from "../../components/business-session";
export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BusinessSession>{children}</BusinessSession>;
}
