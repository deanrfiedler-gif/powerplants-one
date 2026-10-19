import "../../styles/organisations.css";
import "../../styles/customers.css";
import { Suspense } from "react";
import { OrganisationRegister } from "../../../components/organisation-register";
export default function Page() {
  return <Suspense fallback={<p>Loading organisations…</p>}><OrganisationRegister /></Suspense>;
}
