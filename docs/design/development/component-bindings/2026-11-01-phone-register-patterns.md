# Phone register patterns: consumer note

The accepted [Phone register patterns amendment](../../../decisions/phone-register-patterns-amendment.md) changes no application component yet. This binding records what the shell, the register table and the dialog must gain when a build is requested, so the gap stays visible in the catalogue.

## Where the application stands

The shared phone header has no list More and no selection state. Work orders has its own long press and selection aside; Leads shows a count and Clear selection; `notifications/state` changes all or nothing. Desktop is unchanged by this amendment. Adoption order is Q4 in the decision.

## New Figma parts

On Components `1:4` › Shell and navigation since the named version was saved; drawn on page `3036:32928`:

| Part | Node |
|---|---|
| Shell / Phone header · selection, Width=390 and 320 | `3036:38343` |
| Phone action bar | `3036:38353` |
| Phone action bar / Item, Default and Disabled | `3036:38352` |
| Phone row checkbox, Off and On | `3047:24512` |
| Phone sheet heading | `3047:24513` |
| Phone status line | `3047:24519` |
| Phone result row | `3036:38374` |
| Phone menu row | `3036:38381` |

## Fixture and state examples

Synthetic records from the accepted Leads, Work orders and My Work frames. The states are in the [captures](../../../reference/ui/application-shell/phone-register-patterns-r01/README.md): 03–05 for the flows, 06 for Open in sequence and export finished, and 10–11 for S1–S13.

## Reference only

Nothing here is built. Visual review of the application, functional proof, device testing and deployment are separate and haven't happened.
