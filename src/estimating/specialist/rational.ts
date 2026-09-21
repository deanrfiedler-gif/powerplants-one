/** Exact recovered arithmetic. Display precision never becomes receiving precision. */
export type DecimalInput = Rational | string | number | bigint;
const gcd = (a: bigint, b: bigint): bigint => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) {
    const r = a % b;
    a = b;
    b = r;
  }
  return a || 1n;
};
export class Rational {
  readonly n: bigint;
  readonly d: bigint;
  constructor(n: bigint, d = 1n) {
    if (d === 0n) throw Error("Zero divisor");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
    if (this.n.toString().length > 512 || this.d.toString().length > 512)
      throw Error("Arithmetic bound exceeded");
  }
  static from(x: DecimalInput): Rational {
    if (x instanceof Rational) return x;
    const s = String(x);
    if (!/^-?\d+(\.\d+)?$/.test(s)) throw Error("Invalid exact decimal");
    const [w, f = ""] = s.split(".");
    return new Rational(BigInt(w + f), 10n ** BigInt(f.length));
  }
  add(x: DecimalInput) {
    const r = Rational.from(x);
    return new Rational(this.n * r.d + r.n * this.d, this.d * r.d);
  }
  sub(x: DecimalInput) {
    const r = Rational.from(x);
    return new Rational(this.n * r.d - r.n * this.d, this.d * r.d);
  }
  mul(x: DecimalInput) {
    const r = Rational.from(x);
    return new Rational(this.n * r.n, this.d * r.d);
  }
  div(x: DecimalInput) {
    const r = Rational.from(x);
    return new Rational(this.n * r.d, this.d * r.n);
  }
  cmp(x: DecimalInput) {
    const r = Rational.from(x),
      delta = this.n * r.d - r.n * this.d;
    return delta < 0n ? -1 : delta > 0n ? 1 : 0;
  }
  floor() {
    let q = this.n / this.d;
    if (this.n < 0n && this.n % this.d) q--;
    return new Rational(q);
  }
  round(places = 0, mode: "up" | "half-up" = "half-up") {
    const factor = new Rational(
        places >= 0 ? 10n ** BigInt(places) : 1n,
        places < 0 ? 10n ** BigInt(-places) : 1n,
      ),
      v = this.mul(factor);
    const down = v.floor(),
      rem = v.sub(down);
    const integer = down.add(
      mode === "up" ? (rem.n ? 1 : 0) : rem.cmp("0.5") >= 0 ? 1 : 0,
    );
    return integer.div(factor);
  }
  exact(places = 6): string | null {
    const scale = 10n ** BigInt(places);
    if ((this.n * scale) % this.d) return null;
    const n = (this.n * scale) / this.d,
      abs = (n < 0n ? -n : n).toString().padStart(places + 1, "0");
    const text = places
      ? `${abs.slice(0, -places)}.${abs.slice(-places)}`
      : abs;
    return `${n < 0n ? "-" : ""}${text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")}`;
  }
  display(places = 9) {
    return this.exact(places) ?? this.round(places).exact(places)!;
  }
  evidence() {
    return {
      numerator: this.n.toString(),
      denominator: this.d.toString(),
      display: this.display(),
    };
  }
}
export const R = (x: DecimalInput) => Rational.from(x);
