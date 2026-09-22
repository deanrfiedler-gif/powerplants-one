import { ContactsNavigation } from "../../../components/contacts-navigation";
export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  return <ContactsNavigation view={(await searchParams).view}/>;
}
