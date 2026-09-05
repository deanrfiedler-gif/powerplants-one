import Link from "next/link";
export default function Overview() {
  return (
    <>
      <p className="eyebrow">Application foundation / P01</p>
      <section className="hero">
        <div>
          <h1>
            A connected view
            <br />
            of the work ahead.
          </h1>
          <p className="lede">
            A foundation for clearer coordination, prepared service visits and a
            dependable history of work.
          </p>
          <Link className="button" href="/foundation">
            Open foundation checks <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="hero-note">
          <span className="number">01</span>
          <p>Start with a reliable foundation.</p>
          <small>
            Local application · Synthetic records
            <br />
            Server permissions · Database integrity
          </small>
        </div>
      </section>
      <div className="section-heading">
        <h2>The first service journey</h2>
        <span className="muted">Planned through P02–P12</span>
      </div>
      <div className="cards">
        <article className="card">
          <span className="step">01 / Prepare</span>
          <h3>
            Know the customer.
            <br />
            Prepare the work.
          </h3>
          <p>
            Customer, site and equipment context. A clear request, authorised
            scope and checked job pack.
          </p>
          <span className="status-planned">Workflow planned</span>
        </article>
        <article className="card">
          <span className="step">02 / Coordinate</span>
          <h3>
            Make the visit
            <br />
            ready to happen.
          </h3>
          <p>
            Technician commitments, readiness and controlled changes, with the
            right information for the field.
          </p>
          <span className="status-planned">Workflow planned</span>
        </article>
        <article className="card">
          <span className="step">03 / Complete</span>
          <h3>
            Leave a useful
            <br />
            record behind.
          </h3>
          <p>
            Field evidence, customer acknowledgement, reviewed reports and a
            controlled Finance handoff.
          </p>
          <span className="status-planned">Workflow planned</span>
        </article>
      </div>
      <section className="scope-note">
        <div>
          <h2>What you can explore today</h2>
          <p>
            A local demonstration identity and one synthetic draft request.
            Foundation checks exercise the first database-backed read and save.
          </p>
        </div>
        <p>
          Business workflows, scheduling, documents, offline work and Finance
          processing follow in later increments.
        </p>
      </section>
    </>
  );
}
