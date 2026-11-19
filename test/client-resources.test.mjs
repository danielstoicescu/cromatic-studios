// Local test for the client-resources path rules (ops/client-resources.mjs). No server, no disk.
//   node --test test/
import test from "node:test";
import assert from "node:assert/strict";
import { cleanRel, CLIENT_RE } from "../ops/client-resources.mjs";

test("cleanRel keeps good paths, lowercased", () => {
  assert.deepEqual(cleanRel("PMM-Action-Plan.html"), ["pmm-action-plan.html"]);
  assert.deepEqual(cleanRel("docs/Sub/brief_v2.PDF"), ["docs", "sub", "brief_v2.pdf"]);
  assert.deepEqual(cleanRel("fonts/x.woff2"), ["fonts", "x.woff2"]);
});

test("cleanRel refuses traversal, absolute paths, hidden files and other types", () => {
  for (const p of ["../x.html", "a/../../x.html", "/abs.html", "a\\b.html", ".env", "a/.hidden/x.html", "x.php", "a//b.html", "a/./b.html",
    "%2e%2e/x.html", "x..html", "access.json/../x.html", "a\u0000.html", "", "a/", "x", "a/b/c/d/e/f/g/h/i.html", "a".repeat(301) + ".html"])
    assert.equal(cleanRel(p), null, p);
  assert.equal(cleanRel(42), null);
});

test("client names", () => {
  for (const c of ["pmm", "kis-adventures", "a1-b2"]) assert.ok(CLIENT_RE.test(c), c);
  for (const c of ["PMM", "-pmm", "pmm-", "pm--m", "..", "pmm/x", ""]) assert.ok(!CLIENT_RE.test(c), c);
});
