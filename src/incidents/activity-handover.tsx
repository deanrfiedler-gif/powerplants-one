import Link from "next/link";
export function IncidentActivityHandover({ href }: { href: string }) {
  return (
    <p>
      <Link href={href}>Return to incident and corrective evidence</Link>.
      Completing this Activity does not accept evidence, close the incident or
      remove its hold.
    </p>
  );
}
