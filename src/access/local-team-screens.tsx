"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
  type Failure,
  isDenied,
  ReadState,
  Stamp,
  useResource,
} from "../components/business-ui";

type Team = {
  id: string;
  name: string;
  purpose: string;
  lead_id: string;
  lead_name: string;
  lead_active: boolean;
  created_at: string;
  creator_name: string;
  member_count: number;
};
type Detail = {
  team: Omit<Team, "member_count">;
  members: { user_id: string; display_name: string; active: boolean }[];
  history: {
    operation_id: string;
    actor_name: string;
    reason: string;
    occurred_at: string;
  }[];
};

export function SavedLocalTeams({
  onDenied,
}: {
  onDenied: (error: unknown) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [inspectedTeams, setInspectedTeams] = useState<
    Record<string, Omit<Team, "member_count">>
  >({});
  const list = useResource<{ items: Team[]; has_more: boolean }>(
    `admin/access/teams?offset=${offset}`,
  );
  const detail = useResource<Detail>(
    selected ? `admin/access/teams/${selected}` : null,
  );
  // Preserve a newer inspected identity label when its roster is closed. A
  // collection refresh or page change clears these per-record snapshots.
  const visibleTeams = list.data?.items.map((team) => ({
    ...team,
    ...inspectedTeams[team.id],
    ...(selected === team.id && detail.data && !detail.loading
      ? detail.data.team
      : {}),
  }));
  const error = list.error || detail.error;
  const failure = error as Failure | null;
  const denied =
    failure?.code !== "LocalOnly" &&
    (isDenied(error) || failure?.code === "WorkingCompanySelected");
  useEffect(() => {
    if (denied) onDenied(error);
  }, [denied, error, onDenied]);
  const refresh = () => {
    setSelected(null);
    setInspectedTeams({});
    list.reload();
  };
  return (
    <section id="saved-local-teams" aria-labelledby="saved-local-teams-heading">
      <h2 id="saved-local-teams-heading">Saved local teams</h2>
      <p className="callout">
        These synthetic records preserve an initial roster. Membership and the
        lead label grant no access or review duty. Current identity activity is
        shown separately; roster changes and review routing are not available.
      </p>
      <ReadState
        loading={list.loading || detail.loading}
        error={error}
        retry={refresh}
      />
      {!list.loading && !error && list.data && (
        <>
          {list.data.items.length === 0 && (
            <p>No local teams have been recorded.</p>
          )}
          <div className="record-grid">
            {visibleTeams!.map((team) => (
              <article
                className="record-card"
                key={team.id}
                aria-label={`${team.name} saved team`}
              >
                <h3>{team.name}</h3>
                <p>{team.purpose}</p>
                <p className="narrative">Team ID: {team.id}</p>
                <p>
                  Recorded <Stamp value={team.created_at} /> by{" "}
                  {team.creator_name}.
                </p>
                <p>
                  Lead: {team.lead_name} ·{" "}
                  {team.lead_active ? "Active identity" : "Inactive identity"}
                </p>
                <p className="narrative">Lead ID: {team.lead_id}</p>
                <p>
                  {team.member_count}{" "}
                  {team.member_count === 1 ? "person" : "people"} in the initial
                  roster.
                </p>
                <Button
                  variant="quiet"
                  aria-expanded={selected === team.id}
                  onClick={() => {
                    if (
                      selected &&
                      detail.data &&
                      !detail.loading &&
                      !detail.error
                    )
                      setInspectedTeams((current) => ({
                        ...current,
                        [selected]: detail.data!.team,
                      }));
                    detail.reload();
                    setSelected(selected === team.id ? null : team.id);
                  }}
                >
                  {selected === team.id ? "Close" : "Inspect"} roster for{" "}
                  {team.name}
                </Button>
                {selected === team.id && detail.data && !detail.loading && (
                  <div>
                    <h4>Initial roster</h4>
                    <ul>
                      {detail.data.members.map((member) => (
                        <li key={member.user_id} className="narrative">
                          {member.display_name} ·{" "}
                          {member.active
                            ? "Active identity"
                            : "Inactive identity"}
                          <br />
                          Person ID: {member.user_id}
                        </li>
                      ))}
                    </ul>
                    <h4>Creation history</h4>
                    {detail.data.history.map((event) => (
                      <div key={event.operation_id}>
                        <p>
                          Recorded by {event.actor_name} ·{" "}
                          <Stamp value={event.occurred_at} />
                        </p>
                        <p>{event.reason}</p>
                        <p className="narrative">
                          Operation ID: {event.operation_id}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
          <div className="actions">
            <Button
              disabled={offset === 0}
              onClick={() => {
                setSelected(null);
                setInspectedTeams({});
                setOffset(offset - 50);
              }}
            >
              Previous teams
            </Button>
            <Button
              disabled={!list.data.has_more}
              onClick={() => {
                setSelected(null);
                setInspectedTeams({});
                setOffset(offset + 50);
              }}
            >
              Next teams
            </Button>
            <Button onClick={refresh}>Refresh saved teams</Button>
          </div>
        </>
      )}
    </section>
  );
}
