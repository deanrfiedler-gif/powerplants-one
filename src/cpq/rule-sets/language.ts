// The rule set formula language (ADR-0066): parsed and type-checked when a rule set is saved.
// Only the grammar below is accepted; there are no loops, user functions, files or network.
import { LIMITS, DECIMAL, type RuleSetTable, type ValueType } from "./model";

export type CompareOp = "=" | "<>" | "<" | "<=" | ">" | ">=";
export type FunctionName =
  | "if"
  | "ceil"
  | "floor"
  | "round"
  | "min"
  | "max"
  | "lookup"
  | "qty"
  | "minutes";

export type Node =
  | { readonly k: "number"; readonly value: string }
  | { readonly k: "text"; readonly value: string }
  | { readonly k: "yesno"; readonly value: boolean }
  | { readonly k: "name"; readonly name: string }
  | { readonly k: "negate"; readonly a: Node }
  | { readonly k: "arith"; readonly op: "+" | "-" | "*" | "/"; readonly a: Node; readonly b: Node }
  | { readonly k: "compare"; readonly op: CompareOp; readonly a: Node; readonly b: Node }
  | { readonly k: "and" | "or"; readonly a: Node; readonly b: Node }
  | { readonly k: "not"; readonly a: Node }
  | { readonly k: "call"; readonly fn: FunctionName; readonly args: readonly Node[] };

export type Compiled = Readonly<{
  source: string;
  tree: Node;
  type: ValueType;
  names: readonly string[];
  tables: readonly string[];
}>;

/** A formula that cannot be saved, with a code and a reason an engineer can act on. */
export class FormulaError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "FormulaError";
  }
}

const fail = (code: string, message: string): never => {
  throw new FormulaError(code, message);
};

/** What a formula may refer to where it is written. */
export type Scope = {
  /** Names visible here, with their types. */
  names: ReadonlyMap<string, ValueType>;
  /** Names that exist but are worked out later, so referring to them is a forward or circular reference. */
  later: ReadonlySet<string>;
  /** Choice inputs and their options, to refuse a comparison with an option that does not exist. */
  choices: ReadonlyMap<string, ReadonlySet<string>>;
  tables: ReadonlyMap<string, RuleSetTable>;
  parts: ReadonlySet<string>;
  groups: ReadonlySet<string>;
  /** qty() and minutes() are allowed only in Labour rules. */
  labour: boolean;
};

type Token = { kind: "number" | "text" | "word" | "symbol"; text: string; at: number };

const FUNCTIONS = new Set<FunctionName>([
  "if",
  "ceil",
  "floor",
  "round",
  "min",
  "max",
  "lookup",
  "qty",
  "minutes",
]);

function tokenise(source: string): Token[] {
  if (typeof source !== "string" || source.length === 0)
    fail("FORMULA_EMPTY", "Enter a formula");
  if (source.length > LIMITS.formulaCharacters)
    fail("FORMULA_LIMIT", `A formula can have at most ${LIMITS.formulaCharacters} characters`);
  const tokens: Token[] = [];
  const pattern =
    /\s+|(\d+(?:\.\d+)?)|"([^"\x00-\x1f]*)"|([A-Za-z_][A-Za-z0-9_]*)|(<=|>=|<>|[=<>+\-*/(),])/y;
  let at = 0;
  while (at < source.length) {
    pattern.lastIndex = at;
    const m = pattern.exec(source);
    if (!m) {
      if (source[at] === '"') fail("FORMULA_SYNTAX", `Text starting at character ${at + 1} has no closing quote`);
      fail("FORMULA_SYNTAX", `“${source[at]}” at character ${at + 1} is not allowed in a formula`);
    }
    const [text, num, str, word, symbol] = m!;
    if (num !== undefined) tokens.push({ kind: "number", text: num, at });
    else if (str !== undefined) tokens.push({ kind: "text", text: str, at });
    else if (word !== undefined) tokens.push({ kind: "word", text: word, at });
    else if (symbol !== undefined) tokens.push({ kind: "symbol", text: symbol, at });
    at += text.length;
    if (tokens.length > LIMITS.formulaTokens)
      fail("FORMULA_LIMIT", `A formula can have at most ${LIMITS.formulaTokens} parts`);
  }
  return tokens;
}

/** Parses a formula into a frozen tree. Types are checked separately by compile(). */
export function parse(source: string): Node {
  const tokens = tokenise(source);
  let i = 0;
  const peek = () => tokens[i];
  const isSymbol = (s: string) => peek()?.kind === "symbol" && peek()!.text === s;
  const isWord = (w: string) => peek()?.kind === "word" && peek()!.text === w;
  const expect = (s: string) => {
    if (!isSymbol(s)) {
      const t = peek();
      fail("FORMULA_SYNTAX", t ? `Expected “${s}” at character ${t.at + 1}` : `Expected “${s}” at the end`);
    }
    i++;
  };
  const guard = (depth: number) => {
    if (depth > LIMITS.formulaDepth) fail("FORMULA_LIMIT", `A formula can nest at most ${LIMITS.formulaDepth} deep`);
  };

  // Depth counts brackets, function arguments, minus signs and "not", not grammar levels.
  const or = (d: number): Node => {
    guard(d);
    let a = and(d);
    while (isWord("or")) {
      i++;
      a = { k: "or", a, b: and(d) };
    }
    return a;
  };
  const and = (d: number): Node => {
    guard(d);
    let a = not(d);
    while (isWord("and")) {
      i++;
      a = { k: "and", a, b: not(d) };
    }
    return a;
  };
  const not = (d: number): Node => {
    guard(d);
    if (isWord("not")) {
      i++;
      return { k: "not", a: not(d + 1) };
    }
    return compare(d);
  };
  const compare = (d: number): Node => {
    guard(d);
    const a = sum(d);
    const t = peek();
    if (t?.kind === "symbol" && ["=", "<>", "<", "<=", ">", ">="].includes(t.text)) {
      i++;
      const node: Node = { k: "compare", op: t.text as CompareOp, a, b: sum(d) };
      const after = peek();
      if (after?.kind === "symbol" && ["=", "<>", "<", "<=", ">", ">="].includes(after.text))
        fail("FORMULA_SYNTAX", `Comparisons cannot be chained; use “and” (character ${after.at + 1})`);
      return node;
    }
    return a;
  };
  const sum = (d: number): Node => {
    guard(d);
    let a = product(d);
    while (isSymbol("+") || isSymbol("-")) {
      const op = tokens[i++].text as "+" | "-";
      a = { k: "arith", op, a, b: product(d) };
    }
    return a;
  };
  const product = (d: number): Node => {
    guard(d);
    let a = unary(d);
    while (isSymbol("*") || isSymbol("/")) {
      const op = tokens[i++].text as "*" | "/";
      a = { k: "arith", op, a, b: unary(d) };
    }
    return a;
  };
  const unary = (d: number): Node => {
    guard(d);
    if (isSymbol("-")) {
      i++;
      return { k: "negate", a: unary(d + 1) };
    }
    return primary(d);
  };
  const primary = (d: number): Node => {
    guard(d);
    const t = peek();
    if (!t) return fail("FORMULA_SYNTAX", "The formula ends too early");
    if (t.kind === "number") {
      i++;
      if (!DECIMAL.test(t.text))
        fail("FORMULA_NUMBER", `${t.text} has too many digits (at most 18 before and 12 after the point)`);
      return { k: "number", value: t.text };
    }
    if (t.kind === "text") {
      i++;
      if (t.text.length > LIMITS.text) fail("FORMULA_LIMIT", `Text can have at most ${LIMITS.text} characters`);
      return { k: "text", value: t.text };
    }
    if (isSymbol("(")) {
      i++;
      const inner = or(d + 1);
      expect(")");
      return inner;
    }
    if (t.kind === "word") {
      i++;
      if (t.text === "true" || t.text === "false") return { k: "yesno", value: t.text === "true" };
      if (["and", "or", "not"].includes(t.text))
        fail("FORMULA_SYNTAX", `“${t.text}” at character ${t.at + 1} needs a value before it`);
      if (isSymbol("(")) {
        if (!FUNCTIONS.has(t.text as FunctionName))
          fail("FORMULA_FUNCTION", `“${t.text}” is not a function. Use if, ceil, floor, round, min, max, lookup, qty or minutes`);
        i++;
        const args: Node[] = [];
        if (!isSymbol(")")) {
          args.push(or(d + 1));
          while (isSymbol(",")) {
            i++;
            args.push(or(d + 1));
          }
        }
        expect(")");
        return { k: "call", fn: t.text as FunctionName, args };
      }
      return { k: "name", name: t.text };
    }
    return fail("FORMULA_SYNTAX", `“${t.text}” at character ${t.at + 1} is not expected here`);
  };

  const tree = or(0);
  if (i < tokens.length) fail("FORMULA_SYNTAX", `Unexpected “${tokens[i].text}” at character ${tokens[i].at + 1}`);
  return deepFreeze(tree);
}

function deepFreeze(n: Node): Node {
  if ("a" in n) deepFreeze(n.a);
  if ("b" in n) deepFreeze(n.b);
  if (n.k === "call") {
    n.args.forEach(deepFreeze);
    Object.freeze(n.args);
  }
  return Object.freeze(n);
}

const typeName = (t: ValueType) => (t === "YesNo" ? "Yes/No" : t.toLowerCase());

/** Parses and type-checks a formula against what is visible where it is written. */
export function compile(source: string, scope: Scope, expected?: ValueType): Compiled {
  const tree = parse(source);
  const names = new Set<string>();
  const tables = new Set<string>();
  let count = 0;

  const textLiteral = (n: Node, what: string): string => {
    if (n.k !== "text") fail("FORMULA_ARGUMENT", `${what} must be written in quotes`);
    return (n as { value: string }).value;
  };
  const need = (n: Node, t: ValueType, what: string) => {
    const got = check(n);
    if (got !== t) fail("FORMULA_TYPE", `${what} must be ${typeName(t)}, but this is ${typeName(got)}`);
  };

  function check(n: Node): ValueType {
    if (++count > LIMITS.formulaTokens * 2) fail("FORMULA_LIMIT", "The formula is too large");
    switch (n.k) {
      case "number":
        return "Number";
      case "text":
        return "Text";
      case "yesno":
        return "YesNo";
      case "name": {
        const t = scope.names.get(n.name);
        if (t) {
          names.add(n.name);
          return t;
        }
        if (scope.later.has(n.name))
          fail("FORMULA_FORWARD", `“${n.name}” is worked out later in the order, so it cannot be used here (a forward or circular reference)`);
        return fail("FORMULA_NAME", `“${n.name}” is not an input or derived value`);
      }
      case "negate":
        need(n.a, "Number", "A minus sign");
        return "Number";
      case "arith":
        need(n.a, "Number", `The left side of “${n.op}”`);
        need(n.b, "Number", `The right side of “${n.op}”`);
        return "Number";
      case "compare": {
        const a = check(n.a);
        const b = check(n.b);
        if (n.op === "=" || n.op === "<>") {
          if (a !== b) fail("FORMULA_TYPE", `“${n.op}” compares ${typeName(a)} with ${typeName(b)}`);
          checkChoice(n.a, n.b);
          checkChoice(n.b, n.a);
        } else if (a !== "Number" || b !== "Number") {
          fail("FORMULA_TYPE", `“${n.op}” needs numbers on both sides`);
        }
        return "YesNo";
      }
      case "and":
      case "or":
        need(n.a, "YesNo", `The left side of “${n.k}”`);
        need(n.b, "YesNo", `The right side of “${n.k}”`);
        return "YesNo";
      case "not":
        need(n.a, "YesNo", "“not”");
        return "YesNo";
      case "call":
        return call(n.fn, n.args);
    }
  }

  function checkChoice(name: Node, literal: Node) {
    if (name.k !== "name" || literal.k !== "text") return;
    const options = scope.choices.get(name.name);
    if (options && !options.has(literal.value))
      fail("FORMULA_CHOICE", `“${literal.value}” is not an option of “${name.name}”`);
  }

  function call(fn: FunctionName, args: readonly Node[]): ValueType {
    const arity = (min: number, max: number, usage: string) => {
      if (args.length < min || args.length > max) fail("FORMULA_ARGUMENT", `Use ${usage}`);
    };
    switch (fn) {
      case "if": {
        arity(3, 3, "if(condition, value when true, value when false)");
        need(args[0], "YesNo", "The condition of if()");
        const a = check(args[1]);
        const b = check(args[2]);
        if (a !== b) fail("FORMULA_TYPE", `Both values of if() must be the same kind, not ${typeName(a)} and ${typeName(b)}`);
        return a;
      }
      case "ceil":
      case "floor":
        arity(1, 1, `${fn}(number)`);
        need(args[0], "Number", `The value of ${fn}()`);
        return "Number";
      case "round":
        arity(1, 2, "round(number) or round(number, places)");
        args.forEach((a) => need(a, "Number", "The values of round()"));
        return "Number";
      case "min":
      case "max":
        arity(2, 20, `${fn}(a, b, ...)`);
        args.forEach((a) => need(a, "Number", `The values of ${fn}()`));
        return "Number";
      case "lookup": {
        if (args.length < 3) fail("FORMULA_ARGUMENT", 'Use lookup("table", "column", key, ...)');
        const tableKey = textLiteral(args[0], "The table name");
        const table = scope.tables.get(tableKey) ?? fail("FORMULA_TABLE", `There is no table “${tableKey}”`);
        const column = textLiteral(args[1], "The column name");
        const col = table.columns.find((c) => c.key === column) ?? fail("FORMULA_TABLE", `Table “${tableKey}” has no column “${column}”`);
        if (args.length - 2 !== table.keys.length)
          fail("FORMULA_ARGUMENT", `Table “${tableKey}” is looked up by ${table.keys.length} key${table.keys.length === 1 ? "" : "s"}`);
        table.keys.forEach((k, idx) => {
          const keyType =
            table.columns.find((c) => c.key === k.column)?.type ??
            fail("FORMULA_TABLE", `Table “${tableKey}” has a key with no column`);
          need(args[idx + 2], keyType, `Key ${idx + 1} of “${tableKey}” (${k.column})`);
        });
        tables.add(tableKey);
        return col.type;
      }
      case "qty": {
        if (!scope.labour) fail("FORMULA_LABOUR_ONLY", "qty() can only be used by Labour rules");
        arity(1, 1, 'qty("part")');
        const part = textLiteral(args[0], "The part");
        if (!scope.parts.has(part)) fail("FORMULA_PART", `“${part}” is not a part of this rule set`);
        return "Number";
      }
      case "minutes": {
        if (!scope.labour) fail("FORMULA_LABOUR_ONLY", "minutes() can only be used by Labour rules");
        arity(0, 1, 'minutes() or minutes("group")');
        if (args.length) {
          const group = textLiteral(args[0], "The part group");
          if (!scope.groups.has(group)) fail("FORMULA_GROUP", `No part is in group “${group}”`);
        }
        return "Number";
      }
    }
  }

  const type = check(tree);
  if (expected && type !== expected)
    fail("FORMULA_TYPE", `This formula must give ${typeName(expected)}, but it gives ${typeName(type)}`);
  return Object.freeze({
    source,
    tree,
    type,
    names: Object.freeze([...names].sort()),
    tables: Object.freeze([...tables].sort()),
  });
}
