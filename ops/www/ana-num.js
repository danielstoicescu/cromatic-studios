// TASK-144 · the one place /ops Analytics turns two numbers into text (Mira's rules, 30 Oct). Every card goes through it.
// At about 130 sessions a week most rates are noise, so: under 30 in the denominator only counts ("4 din 21"); from 30 whole percents,
// with the counts up to 99; never a decimal. "Mai bun" needs n >= 100 on both sides and Wilson intervals that do not overlap.
(function (root) {
  "use strict";
  const nf = (v) => (Number(v) || 0).toLocaleString("ro-RO");
  /** whole percent, never a false 0% or 100% */
  function pctText(num, den) {
    const p = Math.round(num / den * 100);
    if (num > 0 && p === 0) return "sub 1%";
    if (num < den && p === 100) return "99%";
    return p + "%";
  }
  /** {main, sub, pct}: main is what the card shows, sub the counts when they still belong next to it, pct null when no percent may be shown */
  function share(num, den) {
    num = Number(num) || 0; den = Number(den) || 0;
    if (den < 30) return { main: nf(num) + " din " + nf(den), sub: "", pct: null };
    return { main: pctText(num, den), sub: den < 100 ? nf(num) + " din " + nf(den) : "", pct: num / den * 100 };
  }
  /** Wilson interval at 95%, as [low, high] in 0..1 */
  function wilson(k, n, z) {
    z = z || 1.96; if (!n) return [0, 1];
    const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
    return [(c - h) / d, (c + h) / d];
  }
  /** "a", "b" or null. {k, n} on each side. Without enough people it never says anything */
  function better(a, b) {
    if (!a || !b || a.n < 100 || b.n < 100) return null;
    const A = wilson(a.k, a.n), B = wilson(b.k, b.n);
    if (A[0] > B[1]) return "a";
    if (B[0] > A[1]) return "b";
    return null;
  }
  /** rows under `min` fold into one "Altele" row, except that a thin period still shows its first few rows (counts only there, so nothing misleads) */
  function fold(rows, val, min, keep, merge) {
    const sorted = rows.slice().sort((a, b) => (Number(b[val]) || 0) - (Number(a[val]) || 0));
    const big = sorted.filter((r, i) => (Number(r[val]) || 0) >= min || i < keep), rest = sorted.slice(big.length);
    return rest.length ? big.concat(merge(rest)) : big;
  }
  root.AnaNum = { nf, share, pctText, wilson, better, fold };
})(typeof window !== "undefined" ? window : globalThis);
