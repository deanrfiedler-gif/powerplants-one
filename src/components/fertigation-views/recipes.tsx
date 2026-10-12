"use client";
import { withLabels } from "../../estimating/fertigation/guidance";
import { InjectionRequirement } from "../fertigation-charts";
import { viewEyebrow } from "../fertigation-frame";
import { Notice, PageHead, Panel } from "../fertigation-ui";
import { RegisterTabs } from "./registers";
import type { ViewContext } from "./context";

/* 04 · Recipes, stock tanks & dosing. */

export function RecipesView({ ctx }: { ctx: ViewContext }) {
  const { proposal: s, calculation: calc } = ctx;
  const failureFor = (channelId: string) => {
    if (!calc) return null;
    const channel = s.channels.find((c) => c.id === channelId);
    if (!channel) return null;
    for (const c of calc.candidates)
      for (const f of c.failures)
        if (f.includes(channel.id) || f.includes(channel.label)) return withLabels(s, f);
    return null;
  };
  return (
    <>
      <PageHead
        eyebrow={viewEyebrow("recipes")}
        title="Recipes, stock tanks & dosing"
        lede="Connect each programme to its actual stock concentration and injection requirements."
      />
      <Notice tone="info">
        Feed pH and EC are agronomic inputs. The workbench does not invent crop targets, synthesise recipes or
        estimate acid injection from a pH difference.
      </Notice>
      <RegisterTabs ctx={ctx} view="recipes" />
      {calc && calc.injection.length > 0 && (
        <Panel
          title="Injection requirement by operating group"
          subtitle="Required injection = dosing-unit flow × required stock dose · every recipe and group combination is assessed"
          foot="Entered channel ranges are hypothetical inputs, not Priva product ratings. Manufacturer pressure, suction and concentration conditions still apply."
        >
          <InjectionRequirement scope={s} calculation={calc} candidateFailureFor={failureFor} />
        </Panel>
      )}
      {!calc && (
        <Notice tone="warning">Recalculate the draft to assess injection against the entered channel ranges.</Notice>
      )}
    </>
  );
}
