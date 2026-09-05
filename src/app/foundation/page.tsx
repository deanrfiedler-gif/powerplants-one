import { FoundationPanel } from "./panel";
export default function Foundation() {
  return (
    <>
      <p className="eyebrow">P01 / Local demonstration</p>
      <h1>Foundation checks</h1>
      <p className="lede">
        Explore one synthetic request using a server-controlled demonstration
        identity.
      </p>
      <p className="notice">
        This is an architecture proof. Saving a draft does not authorise work,
        book a technician or contact a customer.
      </p>
      <FoundationPanel />
    </>
  );
}
