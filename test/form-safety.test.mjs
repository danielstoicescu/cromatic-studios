// Local test for the boarding form's safety helpers. No server is started, no real mail leaves:
// the mail check uses nodemailer's jsonTransport, which only builds the message.
//   node --test test/
import test from "node:test";
import assert from "node:assert/strict";
import nodemailer from "nodemailer";
import { oneLine, multiLine, clientIp, isCloudflare } from "../form-safety.js";

const req = (sock, headers = {}) => ({ socket: { remoteAddress: sock }, headers });

test("oneLine removes line breaks and control characters", () => {
  assert.equal(oneLine("Ana\r\nBcc: x@evil.test", 120), "Ana Bcc: x@evil.test");
  assert.equal(oneLine("a\u0000b\u2028c\u0085d\te", 120), "a b c d e");
  assert.equal(oneLine("  Ana  ", 120), "Ana");
  assert.equal(oneLine("abcdef", 3), "abc");
  assert.equal(oneLine(42, 10), "");
  assert.ok(!/[\r\n]/.test(oneLine("x\n".repeat(50), 500)));
});

test("multiLine keeps line breaks, drops the rest", () => {
  assert.equal(multiLine("one\r\ntwo\rthree\u0000four", 2000), "one\ntwo\nthree four");
});

test("clientIp: through Apache and Cloudflare, CF-Connecting-IP is used", () => {
  const r = req("127.0.0.1", { "x-forwarded-for": "9.9.9.9, 203.0.113.7, 172.70.1.1", "cf-connecting-ip": "203.0.113.7" });
  assert.equal(clientIp(r), "203.0.113.7");
});

test("clientIp: a direct hit on the origin cannot pick its own address", () => {
  // the client wrote both headers; Apache appended the address it really saw (198.51.100.20, not Cloudflare)
  const r = req("::ffff:127.0.0.1", { "x-forwarded-for": "1.2.3.4, 198.51.100.20", "cf-connecting-ip": "1.2.3.4" });
  assert.equal(clientIp(r), "198.51.100.20");
});

test("clientIp: a made-up X-Forwarded-For through Cloudflare does not change the count", () => {
  const a = req("127.0.0.1", { "x-forwarded-for": "5.5.5.5, 203.0.113.7, 162.158.10.10", "cf-connecting-ip": "203.0.113.7" });
  const b = req("127.0.0.1", { "x-forwarded-for": "6.6.6.6, 203.0.113.7, 162.158.10.10", "cf-connecting-ip": "203.0.113.7" });
  assert.equal(clientIp(a), clientIp(b));
});

test("clientIp: no proxy in front, the socket address is used and headers are ignored", () => {
  assert.equal(clientIp(req("198.51.100.20", { "x-forwarded-for": "1.2.3.4", "cf-connecting-ip": "1.2.3.4" })), "198.51.100.20");
  assert.equal(clientIp(req("127.0.0.1")), "127.0.0.1");
});

test("clientIp: IPv6 through Cloudflare", () => {
  const r = req("::1", { "x-forwarded-for": "2606:4700:10::1", "cf-connecting-ip": "2001:db8::5" });
  assert.equal(clientIp(r), "2001:db8::5");
  assert.ok(isCloudflare("104.21.69.215") && !isCloudflare("159.223.15.211"));
});

test("mail headers: a hostile name adds no header and no recipient (stub transport, nothing is sent)", async () => {
  const transport = nodemailer.createTransport({ jsonTransport: true });
  const name = oneLine("Ana\r\nBcc: victim@evil.test, other@evil.test <x@evil.test>", 120);
  const info = await transport.sendMail({
    from: "Cromatic Air <hi@cromaticstudios.com>", to: { name, address: "ana@example.com" }, replyTo: "hi@cromaticstudios.com",
    subject: `Boarding pass CS12345 · ${name}`, text: "x"
  });
  const m = JSON.parse(info.message);
  assert.deepEqual(m.to.map((x) => x.address), ["ana@example.com"]);
  assert.equal(m.bcc, undefined);
  assert.ok(!/[\r\n]/.test(m.subject));
  assert.deepEqual(info.envelope.to, ["ana@example.com"]);
});
