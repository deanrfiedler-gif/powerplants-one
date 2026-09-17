export function ShellPageGuide({ page }: { page: string }) {
  const shell = page === "Application shell";
  return (
    <div className="ppo-page-guide">
      <p className="ppo-guide-eyebrow">USER GUIDE & JOURNEY MAP</p>
      <h3>{shell ? "Your workspace in Powerplants One" : page}</h3>
      {!shell && (
        <p className="ppo-guide-status">
          The detailed {page} guide is being prepared. The shared navigation
          guide below is available now.
        </p>
      )}
      <section>
        <h4>What the application shell does</h4>
        <p>
          The shell keeps navigation, record search, Quick add and your account
          together while you work across Powerplants One. Your page and its
          records stay open behind this guide.
        </p>
      </section>
      <section>
        <h4>How to get started</h4>
        <ol className="ppo-journey">
          <li>
            <strong>Choose your destination</strong>
            <p>
              Open More and search for a workspace or shared page. Sales
              contains Deals and Leads; Customers and Contacts are shared
              records. Planned destinations are not yet available.
            </p>
          </li>
          <li>
            <strong>Find the record you need</strong>
            <p>
              Use global search for records you can access. Type at least two
              characters, then select a result. A page’s own search and filters
              apply to that page only.
            </p>
          </li>
          <li>
            <strong>Create or continue work</strong>
            <p>
              Quick add opens the existing creation form for a record type.
              Available actions depend on your signed-in identity. Review the
              form and save there.
            </p>
          </li>
          <li>
            <strong>Follow the page’s workflow</strong>
            <p>
              The heading identifies your current page. Its controls, required
              fields and status messages guide the work. This shell does not
              save changes made inside a page.
            </p>
          </li>
        </ol>
      </section>
      <section>
        <h4>Helpful controls</h4>
        <dl>
          <dt>Page guide · information icon</dt>
          <dd>
            Opens guidance for the current page. Each module’s detailed journey
            will be added with its approved workflow.
          </dd>
          <dt>Quick Help · question mark</dt>
          <dd>A short reference for navigation and keyboard shortcuts.</dd>
          <dt>Account</dt>
          <dd>
            Shows your signed-in identity and sign-out control. In this
            development preview, Preview workspace remembers a workspace on this
            browser; it does not change your access.
          </dd>
          <dt>On a phone</dt>
          <dd>
            The bottom bar follows the current workspace. Open More for the
            complete menu, Quick add and Notifications. Global search and this
            guide remain in the header.
          </dd>
        </dl>
      </section>
      <section>
        <h4>Keyboard and access</h4>
        <p>
          Ctrl or Command + K opens global search. Arrow keys select a result,
          Enter opens it and Escape closes a panel. Tab moves between controls.
          A page marked No access requires permission; choosing a preview
          workspace does not grant it.
        </p>
      </section>
    </div>
  );
}
