// The boarding pass, as an email. Tables and inline styles only: it has to survive Gmail,
// Outlook and Apple Mail. Every field comes from what the passenger told us on the site.
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const INK = "#0a0a0a", YEL = "#FED012", PAPER = "#fffdf7", STUB = "#fff4c2", FONT = "'Poppins','Helvetica Neue',Arial,sans-serif";

// a barcode made of table cells: the only kind every mail client draws
const bars = (ref) => {
  let out = "";
  for (let i = 0; i < 40; i++) {
    const c = ref.charCodeAt(i % ref.length) * (i + 3);
    out += `<td width="${1 + (c % 3)}" height="44" style="background:${INK};font-size:0;line-height:0;">&nbsp;</td><td width="${1 + ((c >> 2) % 2)}" style="font-size:0;line-height:0;">&nbsp;</td>`;
  }
  return out;
};
const cell = (label, value, span = 1) => `
  <td colspan="${span}" valign="top" style="padding:0 14px 14px 0;font-family:${FONT};">
    <div style="font-size:9px;letter-spacing:2px;color:#8a8a8a;font-weight:700;">${esc(label)}</div>
    <div style="font-size:15px;line-height:20px;color:${INK};font-weight:800;">${value}</div>
  </td>`;

export function passHtml(t, who) {
  const legs = [["DRM", "The Dream"], ...t.stops, ["OLR", "Olari 9"]];
  const route = legs.map(([c, n], i) => {
    const end = i === 0 || i === legs.length - 1;
    return `<td valign="bottom" style="font-family:${FONT};padding:0;white-space:nowrap;">
      <div style="font-size:${end ? 40 : 24}px;line-height:${end ? 40 : 26}px;font-weight:900;color:${INK};letter-spacing:-1px;">${esc(c)}</div>
      <div style="font-size:11px;color:#7a7a7a;font-weight:600;">${esc(n)}</div></td>`;
  }).join(`<td valign="middle" style="padding:0 8px 18px;color:#b5b5b5;font-size:14px;white-space:nowrap;">&middot; &middot; &middot; &#9992; &middot; &middot; &middot;</td>`);
  const chips = t.dreams.map((d) => `<span style="display:inline-block;margin:0 4px 4px 0;padding:4px 9px;border:1.5px solid ${INK};border-radius:99px;background:#fff1a6;font-size:11px;font-weight:700;">${esc(d)}</span>`).join("");
  const intro = who === "studio"
    ? `<b>${esc(t.name)}</b> just completed the route and booked a coffee. Reply to this email to answer them directly.`
    : `Welcome aboard, <b>${esc(t.first || t.name)}</b>. Your pass is confirmed: we answer within one working day, and the coffee at Olari 9 is on us.`;
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f2f2f2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;"><tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="760" cellpadding="0" cellspacing="0" style="max-width:760px;width:100%;">
    <tr><td style="font-family:${FONT};font-size:15px;line-height:22px;color:${INK};padding:0 4px 18px;">${intro}</td></tr>
    <tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2.5px solid ${INK};border-radius:22px;background:${PAPER};border-collapse:separate;overflow:hidden;">
        <tr>
          <td valign="top" style="padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="background:${YEL};border-bottom:2.5px solid ${INK};padding:14px 22px;font-family:${FONT};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="font-size:11px;letter-spacing:2px;font-weight:800;color:${INK};">&#10035; CROMATIC AIR</td>
                  <td align="center" style="font-size:15px;letter-spacing:1px;font-weight:900;color:${INK};">BOARDING PASS</td>
                  <td align="right" style="font-size:11px;letter-spacing:2px;font-weight:800;color:${INK};">BOOKING ${esc(t.ref)}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:18px 22px 6px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${route}</tr></table></td></tr>
              <tr><td style="padding:14px 22px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>${cell("PASSENGER", esc(t.name))}${cell("FLIGHT", esc(t.flight))}${cell("DATE", esc(t.date))}${cell("BOARDING", esc(t.boarding))}</tr>
                  <tr>${cell("CLASS", esc(t.klass))}${cell("TERMINAL", esc(t.terminal))}${cell("GATE", esc(t.gate))}${cell("SEAT", esc(t.seat))}</tr>
                  <tr>${cell("CONTACT", esc(t.email) + (t.phone ? " &middot; " + esc(t.phone) : ""), 2)}${cell("ON BOARD", chips || "&mdash;", 2)}</tr>
                </table>
              </td></tr>
              ${t.msg ? `<tr><td style="padding:0 22px 20px;"><div style="background:#f3f0e8;border-radius:14px;padding:12px 14px;font-family:${FONT};">
                <span style="font-size:9px;letter-spacing:2px;color:#8a8a8a;font-weight:700;">CARRY-ON</span><br>
                <span style="font-size:14px;line-height:20px;font-style:italic;color:#222;">&ldquo;${esc(t.msg).replace(/\n/g, "<br>")}&rdquo;</span></div></td></tr>` : ""}
            </table>
          </td>
          <td valign="top" width="200" style="width:200px;border-left:2.5px dashed #b9b2a0;background:${STUB};padding:18px 18px;font-family:${FONT};">
            <div style="font-size:10px;letter-spacing:2px;color:#8a7a3a;font-weight:800;padding-bottom:14px;">CROMATIC AIR &middot; ${esc(t.flight)}</div>
            <div style="font-size:9px;letter-spacing:2px;color:#8a8a8a;font-weight:700;">PASSENGER</div>
            <div style="font-size:15px;font-weight:800;color:${INK};padding-bottom:12px;">${esc(t.name)}</div>
            <div style="font-size:9px;letter-spacing:2px;color:#8a8a8a;font-weight:700;">TO</div>
            <div style="font-size:14px;font-weight:800;color:${INK};padding-bottom:12px;">Str. Olari 9, Bucharest</div>
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="padding-right:18px;"><div style="font-size:9px;letter-spacing:2px;color:#8a8a8a;font-weight:700;">GATE</div><div style="font-size:30px;font-weight:900;color:${INK};">9</div></td>
              <td><div style="font-size:9px;letter-spacing:2px;color:#8a8a8a;font-weight:700;">SEAT</div><div style="font-size:30px;font-weight:900;color:${INK};">1A</div></td>
            </tr></table>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px;"><tr>${bars(t.ref)}</tr></table>
            <div style="text-align:center;font-size:11px;letter-spacing:4px;color:#555;padding-top:6px;">${esc(t.ref)}</div>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:18px 4px 0;font-family:${FONT};font-size:12px;line-height:18px;color:#6a6a6a;">
      Cromatic Studios &middot; Strada Olari 9, Bucharest &middot; <a href="mailto:hi@cromaticstudios.com" style="color:${INK};">hi@cromaticstudios.com</a> &middot; +40 728 978 068<br>
      <a href="https://www.google.com/maps/search/?api=1&query=Cromatic+Studios+Strada+Olari+9+Bucuresti" style="color:${INK};font-weight:700;">Navigate to Olari 9 &rarr;</a>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

export function passText(t, who) {
  return [
    who === "studio" ? `${t.name} just completed the route. Reply to answer them directly.` : `Welcome aboard, ${t.first || t.name}. We answer within one working day.`,
    "",
    `CROMATIC AIR - BOARDING PASS ${t.ref}`,
    `Route: ${["DRM", ...t.stops.map((s) => s[0]), "OLR"].join(" > ")}`,
    `Passenger: ${t.name}`, `Flight: ${t.flight}  Date: ${t.date}  Boarding: ${t.boarding}`,
    `Class: ${t.klass}  Gate: 9  Seat: 1A`,
    `Contact: ${t.email}${t.phone ? " / " + t.phone : ""}`,
    `On board: ${t.dreams.join(", ") || "-"}`,
    t.msg ? `Carry-on: "${t.msg}"` : "",
    "",
    "Cromatic Studios - Strada Olari 9, Bucharest - hi@cromaticstudios.com"
  ].join("\n");
}
