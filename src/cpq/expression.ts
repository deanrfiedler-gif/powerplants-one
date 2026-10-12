// Application-owned restricted arithmetic, adapted from the retained CCE reference.
// Only registered scalar names and four arithmetic operators are executable.
const DECIMAL = /^-?\d{1,18}(?:\.\d{1,12})?$/;
const SYMBOL = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/;

export class CceError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CceError";
  }
}

const fail = (code: string, message: string): never => {
  throw new CceError(code, message);
};

const abs = (n: bigint): bigint => (n < 0n ? -n : n);
function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a || 1n;
}

export class Fraction {
  readonly numerator: bigint;
  readonly denominator: bigint;

  constructor(n: bigint, d: bigint = 1n) {
    if (d === 0n) fail("DIVIDE_BY_ZERO", "Division by zero");
    // Inputs originate from bounded literals or two bounded operands.
    if (abs(n).toString().length > 1026 || abs(d).toString().length > 1026)
      fail("COMPUTATION_LIMIT", "Intermediate arithmetic exceeds its budget");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const divisor = gcd(n, d);
    this.numerator = n / divisor;
    this.denominator = d / divisor;
    if (
      abs(this.numerator).toString().length > 512 ||
      this.denominator.toString().length > 512
    )
      fail("COMPUTATION_LIMIT", "Reduced arithmetic exceeds its budget");
    Object.freeze(this);
  }

  static fromDecimal(value: string): Fraction {
    if (typeof value !== "string" || !DECIMAL.test(value))
      fail("DECIMAL_INVALID", "Expected a bounded decimal string");
    const [whole, fraction = ""] = value.split(".");
    return new Fraction(
      BigInt(whole + fraction),
      10n ** BigInt(fraction.length),
    );
  }

  add(b: Fraction): Fraction {
    return new Fraction(
      this.numerator * b.denominator + b.numerator * this.denominator,
      this.denominator * b.denominator,
    );
  }
  subtract(b: Fraction): Fraction {
    return new Fraction(
      this.numerator * b.denominator - b.numerator * this.denominator,
      this.denominator * b.denominator,
    );
  }
  multiply(b: Fraction): Fraction {
    return new Fraction(
      this.numerator * b.numerator,
      this.denominator * b.denominator,
    );
  }
  divide(b: Fraction): Fraction {
    return new Fraction(
      this.numerator * b.denominator,
      this.denominator * b.numerator,
    );
  }
  negate(): Fraction {
    return new Fraction(-this.numerator, this.denominator);
  }

  // Returns null for a value that cannot be represented exactly at this scale.
  exactDecimal(maxPlaces = 12): string | null {
    if (!Number.isInteger(maxPlaces) || maxPlaces < 0 || maxPlaces > 12)
      fail("SCALE_INVALID", "Scale must be an integer from 0 to 12");
    const factor = 10n ** BigInt(maxPlaces);
    const scaled = this.numerator * factor;
    if (scaled % this.denominator !== 0n) return null;
    const integer = scaled / this.denominator;
    const digits = abs(integer)
      .toString()
      .padStart(maxPlaces + 1, "0");
    const value =
      maxPlaces === 0
        ? digits
        : `${digits.slice(0, -maxPlaces)}.${digits.slice(-maxPlaces)}`
            .replace(/0+$/, "")
            .replace(/\.$/, "");
    return (integer < 0n ? "-" : "") + value;
  }

  evidence(): {
    numerator: string;
    denominator: string;
    exactDecimal: string | null;
  } {
    return {
      numerator: this.numerator.toString(),
      denominator: this.denominator.toString(),
      exactDecimal: this.exactDecimal(),
    };
  }
}

type Op = "+" | "-" | "*" | "/";
type Expr =
  | { readonly kind: "literal"; readonly value: string }
  | { readonly kind: "fact"; readonly name: string }
  | { readonly kind: "unary"; readonly op: "+" | "-"; readonly value: Expr }
  | {
      readonly kind: "binary";
      readonly op: Op;
      readonly left: Expr;
      readonly right: Expr;
    };

export type CompiledFormula = Readonly<{
  tree: Expr;
  dependencies: readonly string[];
}>;
const compiledHere = new WeakSet<object>();

export function compileFormula(
  source: string,
  allowedSymbols: ReadonlySet<string>,
): CompiledFormula {
  if (
    typeof source !== "string" ||
    source.length > 2048 ||
    !/^[\x09\x0A\x0D\x20-\x7E]*$/.test(source)
  )
    fail("FORMULA_LIMIT", "Expected at most 2048 ASCII characters");

  const tokens: { text: string; offset: number }[] = [];
  const lexer =
    /\s+|\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*|[()+*/-]/gy;
  let offset = 0;
  while (offset < source.length) {
    lexer.lastIndex = offset;
    const match = lexer.exec(source);
    if (!match) fail("FORMULA_FORBIDDEN_TOKEN", `Invalid token at ${offset}`);
    const text = match![0];
    if (text.trim()) tokens.push({ text, offset });
    offset = lexer.lastIndex;
    if (tokens.length > 256) fail("FORMULA_LIMIT", "More than 256 tokens");
  }

  let at = 0;
  const precedence = (text: string | undefined): number =>
    text === "+" || text === "-" ? 1 : text === "*" || text === "/" ? 2 : 0;

  function expression(min = 1, depth = 0): Expr {
    if (depth > 32) fail("FORMULA_LIMIT", "Parser nesting exceeds 32");
    const token = tokens[at++];
    const text = token?.text;
    let left: Expr;
    if (text === "(") {
      left = expression(1, depth + 1);
      if (tokens[at++]?.text !== ")")
        fail("FORMULA_SYNTAX", "Missing closing parenthesis");
    } else if (text === "+" || text === "-") {
      left = { kind: "unary", op: text, value: expression(3, depth + 1) };
    } else if (text !== undefined && DECIMAL.test(text)) {
      left = { kind: "literal", value: text };
    } else if (
      text !== undefined &&
      SYMBOL.test(text) &&
      allowedSymbols.has(text)
    ) {
      left = { kind: "fact", name: text };
    } else {
      return fail(
        "FORMULA_SYMBOL_OR_LITERAL",
        "Expected approved symbol or bounded decimal",
      );
    }
    while (precedence(tokens[at]?.text) >= min) {
      const op = tokens[at++].text as Op;
      const right = expression(precedence(op) + 1, depth + 1);
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  const tree = expression();
  if (at !== tokens.length) fail("FORMULA_SYNTAX", "Unexpected trailing input");

  // Parsing recursion alone does not bound a left-associated AST's depth.
  const pending: { node: Expr; depth: number }[] = [{ node: tree, depth: 0 }];
  const dependencies = new Set<string>();
  let count = 0;
  while (pending.length) {
    const { node, depth } = pending.pop()!;
    if (++count > 256 || depth > 32)
      fail("FORMULA_LIMIT", "AST exceeds size/depth budget");
    if (node.kind === "fact") dependencies.add(node.name);
    if (node.kind === "unary")
      pending.push({ node: node.value, depth: depth + 1 });
    if (node.kind === "binary") {
      pending.push({ node: node.left, depth: depth + 1 });
      pending.push({ node: node.right, depth: depth + 1 });
    }
    Object.freeze(node);
  }
  const compiled = Object.freeze({
    tree,
    dependencies: Object.freeze([...dependencies].sort()),
  });
  compiledHere.add(compiled);
  return compiled;
}

export function evaluateFormula(
  compiled: CompiledFormula,
  facts: ReadonlyMap<string, string>,
): Fraction {
  if (!compiledHere.has(compiled))
    fail(
      "FORMULA_UNTRUSTED_AST",
      "Compile definitions in this process before evaluation",
    );

  // Copy only registered referenced scalar values into fresh exact bindings.
  const bindings = new Map<string, Fraction>();
  for (const name of compiled.dependencies) {
    const value = facts.get(name);
    if (typeof value !== "string")
      fail("FACT_MISSING", `Missing decimal fact ${name}`);
    bindings.set(name, Fraction.fromDecimal(value!));
  }
  let visited = 0;
  function visit(node: Expr, depth = 0): Fraction {
    if (++visited > 256 || depth > 32)
      fail("COMPUTATION_LIMIT", "Evaluation budget exceeded");
    if (node.kind === "literal") return Fraction.fromDecimal(node.value);
    if (node.kind === "fact") return bindings.get(node.name)!;
    if (node.kind === "unary") {
      const value = visit(node.value, depth + 1);
      return node.op === "-" ? value.negate() : value;
    }
    const a = visit(node.left, depth + 1),
      b = visit(node.right, depth + 1);
    switch (node.op) {
      case "+":
        return a.add(b);
      case "-":
        return a.subtract(b);
      case "*":
        return a.multiply(b);
      case "/":
        return a.divide(b);
      default:
        return fail("FORMULA_OPERATION", "Unsupported operation");
    }
  }
  return visit(compiled.tree);
}
