import Link from "next/link";
export default function NotFound() {
  return (
    <section className="card">
      <h1>This page is unavailable</h1>
      <p>The address may be incorrect, the record may be unavailable, or your access may have changed. Use Home to open a permitted workspace, or check the original link.</p>
      <Link className="button" href="/">
        Return to Home
      </Link>
    </section>
  );
}
