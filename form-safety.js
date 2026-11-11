// Form safety helpers for POST /api/boarding (security review, Nov 2026).
//  - oneLine / multiLine: nothing a visitor types can carry a line break or another control character
//    into a mail header (subject, To, Reply-To).
//  - clientIp: the address the rate limit counts on. A client can write any X-Forwarded-For or
//    CF-Connecting-IP it likes, so those are believed only when the connection itself proves where
//    it came from.
import net from "node:net";

// C0 controls, DEL, C1 controls, and the Unicode line and paragraph separators
const CTRL = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]+/g;
const CTRL_KEEP_NL = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u2028\u2029]+/g;

export const oneLine = (v, max) => (typeof v === "string" ? v.replace(CTRL, " ").trim().slice(0, max).trim() : "");
// for the free message, which only ever goes in the mail body: line breaks stay, the rest goes
export const multiLine = (v, max) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(CTRL_KEEP_NL, " ").trim().slice(0, max).trim() : "");

// Cloudflare's published ranges (https://www.cloudflare.com/ips/, read 2026-11-11). They change rarely;
// if one is missing, visitors through it are simply counted together under Cloudflare's address.
export const CLOUDFLARE_RANGES = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18", "108.162.192.0/18",
  "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32"
];
const cf = new net.BlockList();
for (const r of CLOUDFLARE_RANGES) { const [a, p] = r.split("/"); cf.addSubnet(a, Number(p), a.includes(":") ? "ipv6" : "ipv4"); }

const bare = (a) => String(a || "").trim().replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, "");
const fam = (a) => (net.isIPv4(a) ? "ipv4" : net.isIPv6(a) ? "ipv6" : "");
const isLoopback = (a) => a === "::1" || /^127\./.test(a);
export const isCloudflare = (a) => { const f = fam(a); return !!f && cf.check(a, f); };

// Who is really asking?
//  1. The socket. If it is not our own Apache (loopback), that is the peer.
//  2. If it is Apache, the peer is the LAST entry of X-Forwarded-For: Apache appends the address it saw itself,
//     whatever the client wrote goes in front of it.
//  3. Only when that peer is a Cloudflare address is CF-Connecting-IP believed (Cloudflare always sets it itself).
// Anything else (a direct hit on the server's IP with made-up headers) is counted on the peer address.
export function clientIp(req) {
  const sock = bare(req.socket && req.socket.remoteAddress);
  let peer = sock;
  if (isLoopback(sock) || !sock) {
    const chain = String(req.headers["x-forwarded-for"] || "").split(",").map(bare).filter(fam);
    if (chain.length) peer = chain[chain.length - 1];
  }
  if (isCloudflare(peer)) {
    const c = bare(req.headers["cf-connecting-ip"]);
    if (fam(c)) return c;
  }
  return peer || "unknown";
}
