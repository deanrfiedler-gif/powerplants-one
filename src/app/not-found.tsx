import Link from "next/link";
export default function NotFound() {
  return (
    <section className="card">
      <h1>This page is unavailable</h1>
      <p>The requested page may belong to a later increment.</p>
      <Link className="button" href="/">
        Return to overview
      </Link>
    </section>
  );
}
