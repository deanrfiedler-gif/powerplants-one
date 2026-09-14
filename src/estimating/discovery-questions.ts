import type { Answer, Definition, DiscoveryScope } from "./discovery";
// Browser and server use the same declared visibility predicate. The browser
// receives the immutable published definition; only the server validates it.
export function applicableQuestions(
  scope: DiscoveryScope,
  answers: readonly Answer[],
  definition: Definition,
) {
  return definition.questions.filter(
    (q) =>
      (!q.system || scope.systems.some((s) => s.tag === q.system)) &&
      (!q.when ||
        answers.some(
          (a) =>
            a.question_id === q.when!.question_id && a.value === q.when!.equals,
        )),
  );
}
