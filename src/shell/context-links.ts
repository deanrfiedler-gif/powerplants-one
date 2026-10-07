// Bounded source returns, not a caller-controlled redirect or authorization check.
const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export function surveyReturn(value: string | null) {
  return value && new RegExp(`^/surveys/${uuid}(?:\\?view=overview)?$`, "i").test(value) ? value : null;
}
export function acceptanceReturn(value: string | null) {
  return value && new RegExp(`^/projects/acceptance/stages/${uuid}#obligation-${uuid}$`, "i").test(value) ? value : null;
}
export function equipmentHref(id: string, surveyId?: string) {
  const source = surveyId ? surveyReturn(`/surveys/${surveyId}`) : null;
  return `/equipment/${encodeURIComponent(id)}${source ? `?returnTo=${encodeURIComponent(source)}` : ""}`;
}
export function activityHref(id: string, stageId?: string, obligationId?: string) {
  const source = stageId && obligationId ? acceptanceReturn(`/projects/acceptance/stages/${stageId}#obligation-${obligationId}`) : null;
  return `/work/${encodeURIComponent(id)}${source ? `?returnTo=${encodeURIComponent(source)}` : ""}`;
}
