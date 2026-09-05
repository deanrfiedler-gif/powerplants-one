"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="card" role="alert">
      <h1>This page could not load</h1>
      <p>Your last confirmed save is unaffected. Try loading the page again.</p>
      <button onClick={reset}>Try again</button>
    </section>
  );
}
