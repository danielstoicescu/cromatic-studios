// Cromatic · stories in Lottie · story D5 (TASK-115, Iris; Daniel's notes on D4): the new shots, captured from the map
// itself (beta 4.4, the stories-render-44 build, through the harness) frame by frame at 2x, 30 a second.
//   bird   the city from high in the south-west, Coffee Street running away from us with its places' pins (the map's
//          own, captured from the page) and three of its place cards opening one after another; a slow drift
//   zoom   one continuous move from there down to the street in front of Steam: an ease in and out, the height falling
//          on a log scale (fast through the air, slow at the end), the lens widening, the heading turning to the
//          facade; a 3-subframe shutter where it is fast
//   steam  the street in front of Steam (the end of the move): a slow push while its card rises (Knock knock.)
// The 1300 parked at Steam's kerb for all three. Logical x, z (y up). Read by renderD5.mjs.
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const sm5 = (u) => u * u * u * (u * (u * 6 - 15) + 10); // (smootherstep: acceleration, deceleration)
const W = 2160, H = 3840;
export const PARK = [842, null, 5590, 0];
const B0 = { pos: [430, 760, 6380], tgt: [880, 0, 5300], fov: 40 }, B1 = { pos: [470, 742, 6335], tgt: [890, 0, 5318], fov: 40 };
const S0 = { pos: [760, 8, 5600], tgt: [985, 24, 5640], fov: 58 }, S1 = { pos: [778, 8.4, 5604], tgt: [985, 24.5, 5640], fov: 56 };
export const PINS = { steam: [985, 150, 5640], berero: [706, 60, 5480], yoshi: [706, 60, 5175], artisan: [928, 30, 5212], scf: [1150, 110, 5140], sip: [706, 70, 4985], oma: [706, 80, 4560], tac: [1775, 128, 4570] };
export const D5 = {
  bird: { dur: 3.6, cam: (t) => { const u = sm5(clamp(t / 3.6)) * 0.6 + 0.4 * clamp(t / 3.6); return { pos: L3(B0.pos, B1.pos, u), tgt: L3(B0.tgt, B1.tgt, u), fov: 40, w: W, h: H }; } },
  zoom: { dur: 3.4, sub: (t) => { const u = t / 3.4; return u > 0.15 && u < 0.85 ? 3 : 1; }, cam: (t) => {
    // (over the road's own line, so nothing stands in the lens on the way down: across to the road while high, down
    // along it towards Steam, then a step to the kerb opposite the facade as it turns to it)
    const u = sm5(clamp(t / 3.4)), h = Math.exp(lerp(Math.log(B1.pos[1]), Math.log(S0.pos[1]), u));
    const xr = lerp(B1.pos[0], 842, sm5(clamp(u / 0.55))), x = lerp(xr, S0.pos[0], sm5(clamp((u - 0.72) / 0.28)));
    const z = lerp(B1.pos[2], S0.pos[2] + 20, sm5(clamp(u / 0.92))) - 20 * sm5(clamp((u - 0.92) / 0.08));
    const tw = sm5(clamp((u - 0.05) / 0.9));
    return { pos: [x, h, z], tgt: L3(B1.tgt, S0.tgt, tw), fov: lerp(40, 58, sm5(clamp((u - 0.3) / 0.7))), w: W, h: H };
  } },
  steam: { dur: 2.7, cam: (t) => { const u = clamp(t / 2.7); return { pos: L3(S0.pos, S1.pos, u), tgt: L3(S0.tgt, S1.tgt, u), fov: lerp(S0.fov, S1.fov, u), w: W, h: H }; } }
};

// TASK-118: vendored read-only from stories-d5 (8d41cee) for story D7 in diorama: the same cameras as D6
