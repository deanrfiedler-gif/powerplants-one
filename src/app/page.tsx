import Link from "next/link";
export default function Overview() {
  return (
    <>
      <p className="eyebrow">
        Synthetic service workflow / Integrated verification
      </p>
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
          <Link className="button" href="/work">
            Open My Work <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="hero-note">
          <span className="number">01</span>
          <p>Give the next action a clear owner.</p>
          <small>
            Local application · Synthetic records
            <br />
            Customer context · Intake & follow-up
          </small>
        </div>
      </section>
      <div className="section-heading">
        <h2>The first service journey</h2>
        <span className="muted">Delivered in increments P01–P12</span>
      </div>
      <div className="cards">
        <article className="card">
          <span className="step">01 / Prepare</span>
          <h3>
            Know the customer.
            <br /> Prepare the work.
          </h3>
          <p>
            Customer, site and equipment context. A clear request, authorised
            scope and checked job pack.
          </p>
          <Link href="/service/work-orders">Explore work preparation</Link>
        </article>
        <article className="card">
          <span className="step">02 / Coordinate</span>
          <h3>
            Make the visit
            <br /> ready to happen.
          </h3>
          <p>
            Technician commitments, readiness and controlled changes, with the
            right information for the field.
          </p>
          <Link href="/schedule">Open the service planner</Link>
        </article>
        <article className="card">
          <span className="step">03 / Complete</span>
          <h3>
            Leave a useful
            <br /> record behind.
          </h3>
          <p>
            Field evidence, customer acknowledgement, reviewed reports and a
            controlled Finance handoff.
          </p>
          <Link href="/my-jobs">Open assigned field work</Link>
        </article>
      </div>
      <section className="scope-note">
        <div>
          <h2>What you can explore today</h2>
          <p>
            Scoped customer, contact, site and equipment views; service intake
            and triage; owned follow-up, controlled booking, exact issued packs,
            personal field evidence and offline recovery. Service review and
            synthetic Finance handoffs use separate permissions.{" "}
            <Link href="/foundation">Open foundation checks</Link> for
            diagnostics.
          </p>
        </div>
        <p>
          Integrated verification is in progress. The complete prototype remains
          subject to its delivery and recovery acceptance after P12.
        </p>
      </section>
    </>
  );
}
