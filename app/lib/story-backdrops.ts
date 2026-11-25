// Story mode's arenas: every chapter has its own landscape, and every stage in it its own painting.
// The sky darkens as a chapter goes on (dawn, day, dusk, then the boss's lair), the set pieces move,
// and each chapter's threat grows stage by stage: the rift widens, the storm thickens, the sun goes out.
// Painted once per stage onto an offscreen canvas, then drawn behind the fight like the home arena.
import { W, H } from "./arena-engine";
import { lairOf } from "./story";

const INK = "hsl(250 32% 14%)";
const FLOOR = 440;

type Rnd = () => number;
type Ctx = CanvasRenderingContext2D;

type Look = {
  /** Sky top, middle, horizon for each part of the chapter: stages 1-4, 5-7, 8-9, then the boss's lair. */
  sky: [string, string, string][];
  far: string;
  near: string;
  floor: [string, string];
  line: string;
  /** Stars in the sky from this part of the chapter on (0 = always). */
  starsFrom: number;
  /** Leave the rolling hills out (the coast looks out over open sea). */
  flat?: boolean;
  scene: (ctx: Ctx, stage: number, phase: number, rnd: Rnd) => void;
  /** Painted on top of the hills, in front of the scene. */
  front?: (ctx: Ctx, stage: number, phase: number, rnd: Rnd) => void;
};

/** Which part of its chapter a stage is in: 0 dawn, 1 day, 2 dusk, 3 the boss's lair (the last stage). */
const phaseOf = (stage: number, lair: number) => (stage >= lair ? 3 : stage >= lair - 2 ? 2 : stage >= 4 ? 1 : 0);

function hills(ctx: Ctx, y: number, amp: number, col: string, seed: number, step = 20) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR);
  for (let x = 0; x <= W; x += step) ctx.lineTo(x, y - Math.abs(Math.sin(x * 0.006 + seed)) * amp - Math.sin(x * 0.021 + seed * 2) * amp * 0.25);
  ctx.lineTo(W, FLOOR);
  ctx.fill();
}

function glow(ctx: Ctx, x: number, y: number, r: number, col: string, a = 0.8) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col.replace(")", ` / ${a})`));
  g.addColorStop(1, col.replace(")", " / 0)"));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function stars(ctx: Ctx, rnd: Rnd, n: number, bottom = FLOOR - 80) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = `hsl(${rnd() < 0.3 ? 210 : 48} 70% 92% / ${0.3 + rnd() * 0.7})`;
    const r = rnd() < 0.08 ? 2 : 1;
    ctx.fillRect(rnd() * W, rnd() * bottom, r, r);
  }
}

/** A jagged crack of light across the sky. */
function crack(ctx: Ctx, x: number, y: number, len: number, rnd: Rnd, core: string, edge: string, width: number) {
  const pts: [number, number][] = [];
  for (let k = 0; k <= 9; k++) pts.push([x + (rnd() - 0.5) * width * 1.6, y - len / 2 + (len * k) / 9]);
  for (const [w, col] of [[width * 2.4, edge], [width, core]] as const) {
    ctx.beginPath();
    pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

const LOOKS: Look[] = [
  // 1. The Rift Opens: a town under a crack in the sky that widens every stage
  {
    sky: [["hsl(216 64% 62%)", "hsl(250 50% 78%)", "hsl(30 90% 84%)"], ["hsl(236 46% 46%)", "hsl(270 40% 64%)", "hsl(20 80% 72%)"], ["hsl(256 40% 24%)", "hsl(276 40% 40%)", "hsl(330 50% 54%)"], ["hsl(262 50% 8%)", "hsl(270 50% 18%)", "hsl(186 60% 30%)"]],
    far: "hsl(255 26% 52%)", near: "hsl(252 24% 40%)", floor: ["hsl(36 40% 62%)", "hsl(30 34% 48%)"], line: "hsl(30 30% 40% / 0.5)", starsFrom: 2,
    scene(ctx, stage, phase, rnd) {
      const x = 200 + ((stage * 173) % 560);
      glow(ctx, x, 150, 140 + stage * 18, "hsl(186 100% 70%)", 0.35 + phase * 0.12);
      crack(ctx, x, 160, 90 + stage * 26, rnd, "hsl(186 100% 92%)", "hsl(276 90% 60% / 0.7)", 4 + stage * 1.2);
    },
    front(ctx, stage, phase, rnd) {
      // rooftops, a clock tower in the second stage
      for (let x = -20; x < W; x += 50 + rnd() * 40) {
        const w = 40 + rnd() * 50, h = 50 + rnd() * 70 + (stage === 1 && Math.abs(x - 480) < 60 ? 120 : 0);
        ctx.fillStyle = phase >= 2 ? "hsl(258 30% 18%)" : "hsl(250 22% 34%)";
        ctx.fillRect(x, FLOOR - h, w, h);
        ctx.fillStyle = phase >= 2 ? "hsl(48 90% 66% / 0.8)" : "hsl(48 60% 80% / 0.5)";
        for (let wy = FLOOR - h + 10; wy < FLOOR - 14; wy += 18) for (let wx = x + 6; wx < x + w - 10; wx += 14) if (rnd() < 0.4) ctx.fillRect(wx, wy, 6, 8);
      }
    },
  },
  // 2. The Storm Coast: open sea and a lighthouse, the storm worse every stage
  {
    sky: [["hsl(200 50% 62%)", "hsl(196 40% 76%)", "hsl(190 30% 86%)"], ["hsl(210 30% 44%)", "hsl(206 24% 58%)", "hsl(200 20% 70%)"], ["hsl(222 30% 24%)", "hsl(214 26% 36%)", "hsl(200 24% 48%)"], ["hsl(226 40% 10%)", "hsl(206 40% 20%)", "hsl(186 60% 30%)"]],
    far: "hsl(206 20% 40%)", near: "hsl(200 22% 30%)", floor: ["hsl(42 46% 70%)", "hsl(36 36% 54%)"], line: "hsl(36 30% 44% / 0.5)", starsFrom: 3, flat: true,
    scene(ctx, stage, phase, rnd) {
      // storm clouds
      ctx.fillStyle = `hsl(220 16% ${46 - phase * 10}% / ${0.3 + stage * 0.06})`;
      for (let i = 0; i < 4 + stage; i++) {
        const cx = rnd() * W, cy = 40 + rnd() * 120, r = 50 + rnd() * 60;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.6, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (stage >= 5) crack(ctx, 160 + rnd() * 640, 180, 220, rnd, "hsl(54 100% 92%)", "hsl(200 100% 70% / 0.6)", 3);
      // the sea, swirling at the boss's whirlpool
      const sea = ctx.createLinearGradient(0, 320, 0, FLOOR);
      sea.addColorStop(0, `hsl(200 ${50 - phase * 6}% ${44 - phase * 8}%)`);
      sea.addColorStop(1, `hsl(206 50% ${30 - phase * 6}%)`);
      ctx.fillStyle = sea;
      ctx.fillRect(0, 320, W, FLOOR - 320);
      ctx.strokeStyle = "hsl(186 80% 86% / 0.5)";
      ctx.lineWidth = 2;
      for (let y = 334; y < FLOOR; y += 16) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 12) ctx.lineTo(x, y + Math.sin(x * 0.04 + y + stage) * (2 + phase));
        ctx.stroke();
      }
      if (phase === 3) {
        for (let k = 1; k < 7; k++) {
          ctx.beginPath();
          ctx.ellipse(W / 2, 372, k * 50, k * 9, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `hsl(186 100% 76% / ${0.5 - k * 0.06})`;
          ctx.stroke();
        }
      }
    },
    front(ctx, stage, phase) {
      // the lighthouse, dark until the storm is beaten
      const x = 120 + ((stage * 211) % 700);
      ctx.fillStyle = "hsl(0 0% 92%)";
      ctx.beginPath();
      ctx.moveTo(x - 16, FLOOR - 6);
      ctx.lineTo(x - 9, FLOOR - 140);
      ctx.lineTo(x + 9, FLOOR - 140);
      ctx.lineTo(x + 16, FLOOR - 6);
      ctx.fill();
      ctx.fillStyle = "hsl(2 70% 50%)";
      for (const y of [FLOOR - 40, FLOOR - 90]) ctx.fillRect(x - 15, y, 30, 14);
      ctx.fillStyle = INK;
      ctx.fillRect(x - 12, FLOOR - 160, 24, 20);
      if (phase === 0) glow(ctx, x, FLOOR - 150, 70, "hsl(48 100% 70%)", 0.7);
      // rain
      ctx.strokeStyle = `hsl(200 60% 88% / ${0.2 + phase * 0.1})`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < stage * 24; i++) {
        const rx = (i * 97.3) % W, ry = (i * 53.7) % FLOOR;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 6, ry + 18);
        ctx.stroke();
      }
    },
  },
  // 3. The Ember Wastes: glass dunes and a volcano that burns brighter every stage
  {
    sky: [["hsl(32 70% 66%)", "hsl(24 80% 76%)", "hsl(40 90% 84%)"], ["hsl(18 60% 50%)", "hsl(20 70% 64%)", "hsl(34 90% 72%)"], ["hsl(8 50% 26%)", "hsl(12 60% 40%)", "hsl(26 90% 54%)"], ["hsl(4 50% 8%)", "hsl(8 60% 18%)", "hsl(20 100% 40%)"]],
    far: "hsl(18 30% 38%)", near: "hsl(24 46% 52%)", floor: ["hsl(30 50% 54%)", "hsl(16 36% 34%)"], line: "hsl(14 40% 26% / 0.5)", starsFrom: 3,
    scene(ctx, stage, phase, rnd) {
      const x = 220 + ((stage * 149) % 520);
      // the volcano
      ctx.fillStyle = "hsl(12 22% 20%)";
      ctx.beginPath();
      ctx.moveTo(x - 260, FLOOR);
      ctx.lineTo(x - 50, 150);
      ctx.lineTo(x + 50, 150);
      ctx.lineTo(x + 260, FLOOR);
      ctx.fill();
      glow(ctx, x, 150, 80 + stage * 14, "hsl(28 100% 58%)", 0.5 + phase * 0.12);
      ctx.strokeStyle = "hsl(28 100% 56%)";
      ctx.lineWidth = 5;
      for (let k = 0; k < 1 + Math.floor(stage / 3); k++) {
        ctx.beginPath();
        ctx.moveTo(x - 20 + k * 18, 154);
        ctx.quadraticCurveTo(x - 60 + k * 50 + rnd() * 30, 280, x - 120 + k * 90, FLOOR);
        ctx.stroke();
      }
      // smoke
      ctx.fillStyle = `hsl(14 10% ${30 - phase * 6}% / 0.55)`;
      for (let k = 0; k < 3 + stage; k++) {
        ctx.beginPath();
        ctx.arc(x - 10 + Math.sin(k) * 30 + k * 12, 130 - k * 22, 26 + k * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    front(ctx, stage, phase, rnd) {
      // embers in the air
      for (let i = 0; i < 20 + stage * 8; i++) {
        ctx.fillStyle = `hsl(${30 + rnd() * 20} 100% ${60 + rnd() * 20}% / ${0.4 + rnd() * 0.5})`;
        ctx.fillRect(rnd() * W, rnd() * FLOOR, 2, 2);
      }
      if (phase >= 2) glow(ctx, W / 2, FLOOR, 420, "hsl(20 100% 50%)", 0.25);
    },
  },
  // 4. The Frozen Clock: snowy peaks under a giant stopped clock, snow hanging still in the air
  {
    sky: [["hsl(200 50% 78%)", "hsl(206 40% 88%)", "hsl(210 30% 94%)"], ["hsl(214 40% 62%)", "hsl(220 34% 76%)", "hsl(240 30% 86%)"], ["hsl(236 40% 28%)", "hsl(250 30% 44%)", "hsl(170 50% 60%)"], ["hsl(230 50% 10%)", "hsl(220 40% 22%)", "hsl(44 60% 50%)"]],
    far: "hsl(210 26% 74%)", near: "hsl(212 24% 62%)", floor: ["hsl(200 40% 90%)", "hsl(206 30% 72%)"], line: "hsl(210 30% 60% / 0.5)", starsFrom: 2,
    scene(ctx, stage, phase) {
      // the clock in the sky, its hands stopping closer to midnight every stage
      const cx = 160 + ((stage * 191) % 640), cy = 150, r = 90;
      glow(ctx, cx, cy, r * 1.8, "hsl(44 90% 72%)", 0.25 + phase * 0.1);
      ctx.fillStyle = "hsl(44 40% 92% / 0.85)";
      ctx.strokeStyle = "hsl(44 50% 40%)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 3;
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
        ctx.lineTo(cx + Math.cos(a) * r * 0.94, cy + Math.sin(a) * r * 0.94);
        ctx.stroke();
      }
      const left = (10 - stage) / 10;
      for (const [a, len, w] of [[-Math.PI / 2 - left * Math.PI * 0.9, 0.55, 6], [-Math.PI / 2 - left * Math.PI * 2 * 3, 0.8, 3]] as const) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * r * len, cy + Math.sin(a) * r * len);
        ctx.strokeStyle = INK;
        ctx.lineWidth = w;
        ctx.stroke();
      }
      // an aurora frozen in place later in the chapter
      if (phase >= 2) {
        ctx.strokeStyle = "hsl(160 80% 64% / 0.35)";
        ctx.lineWidth = 26;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 70 + Math.sin(x * 0.01) * 30);
        ctx.stroke();
      }
    },
    front(ctx, stage, _phase, rnd) {
      // snow caps on the peaks
      for (let k = 0; k < 5; k++) {
        const px = 80 + k * 200 + rnd() * 60, ph = 140 + rnd() * 80;
        ctx.fillStyle = "hsl(210 20% 52%)";
        ctx.beginPath();
        ctx.moveTo(px - 110, FLOOR);
        ctx.lineTo(px, FLOOR - ph);
        ctx.lineTo(px + 110, FLOOR);
        ctx.fill();
        ctx.fillStyle = "hsl(200 40% 96%)";
        ctx.beginPath();
        ctx.moveTo(px - 34, FLOOR - ph + 44);
        ctx.lineTo(px, FLOOR - ph);
        ctx.lineTo(px + 34, FLOOR - ph + 44);
        ctx.lineTo(px + 12, FLOOR - ph + 34);
        ctx.lineTo(px - 8, FLOOR - ph + 46);
        ctx.fill();
      }
      // snowflakes stopped in the air
      ctx.fillStyle = "hsl(0 0% 100% / 0.8)";
      for (let i = 0; i < 40 + stage * 10; i++) {
        ctx.beginPath();
        ctx.arc(rnd() * W, rnd() * FLOOR, 1 + rnd() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  // 5. The Heart of the Rift: floating islands in a violet void
  {
    sky: [["hsl(270 40% 30%)", "hsl(290 40% 44%)", "hsl(318 60% 62%)"], ["hsl(262 40% 22%)", "hsl(282 40% 34%)", "hsl(318 60% 50%)"], ["hsl(256 44% 14%)", "hsl(276 44% 24%)", "hsl(318 70% 40%)"], ["hsl(252 50% 6%)", "hsl(270 50% 14%)", "hsl(318 80% 34%)"]],
    far: "hsl(276 24% 30%)", near: "hsl(266 24% 22%)", floor: ["hsl(280 24% 40%)", "hsl(262 30% 22%)"], line: "hsl(318 70% 70% / 0.35)", starsFrom: 0,
    scene(ctx, stage, phase, rnd) {
      // a swirl at the heart of the rift
      ctx.save();
      ctx.translate(200 + ((stage * 137) % 560), 160);
      for (let k = 0; k < 4 + phase; k++) {
        ctx.rotate(0.6);
        ctx.beginPath();
        ctx.ellipse(0, 0, 60 + k * 24, 16 + k * 6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `hsl(318 100% 76% / ${0.5 - k * 0.06})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
      // floating islands
      for (let k = 0; k < 3 + Math.floor(stage / 2); k++) {
        const ix = rnd() * W, iy = 90 + rnd() * 200, iw = 40 + rnd() * 60;
        ctx.fillStyle = "hsl(266 20% 26%)";
        ctx.beginPath();
        ctx.moveTo(ix - iw, iy);
        ctx.lineTo(ix + iw, iy);
        ctx.lineTo(ix + iw * 0.2, iy + iw * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "hsl(150 30% 40%)";
        ctx.fillRect(ix - iw, iy - 6, iw * 2, 8);
      }
    },
  },
  // 6. The Hollow Kingdom: a dead castle, bare trees and ghost lanterns in the fog
  {
    sky: [["hsl(180 10% 50%)", "hsl(170 10% 62%)", "hsl(150 10% 70%)"], ["hsl(190 14% 34%)", "hsl(176 12% 46%)", "hsl(150 14% 56%)"], ["hsl(200 20% 18%)", "hsl(186 16% 28%)", "hsl(152 30% 36%)"], ["hsl(200 30% 6%)", "hsl(180 30% 12%)", "hsl(152 60% 24%)"]],
    far: "hsl(186 8% 30%)", near: "hsl(180 8% 22%)", floor: ["hsl(40 8% 40%)", "hsl(30 8% 24%)"], line: "hsl(30 8% 16% / 0.5)", starsFrom: 2,
    scene(ctx, stage, phase) {
      // the moon and the castle
      glow(ctx, 760 - stage * 30, 110, 110, "hsl(152 60% 80%)", 0.4);
      ctx.fillStyle = "hsl(150 30% 90%)";
      ctx.beginPath();
      ctx.arc(760 - stage * 30, 110, 40, 0, Math.PI * 2);
      ctx.fill();
      const cx = 300 + ((stage * 97) % 360), size = 1 + phase * 0.2;
      ctx.fillStyle = "hsl(190 16% 12%)";
      ctx.fillRect(cx - 120 * size, FLOOR - 160 * size, 240 * size, 160 * size);
      for (const [dx, th] of [[-130, 230], [-60, 270], [20, 310], [100, 250]] as const) {
        const tx = cx + dx * size, top = FLOOR - th * size;
        ctx.fillRect(tx, top, 34 * size, th * size);
        ctx.beginPath();
        ctx.moveTo(tx - 6, top);
        ctx.lineTo(tx + 17 * size, top - 50 * size);
        ctx.lineTo(tx + 34 * size + 6, top);
        ctx.fill();
        ctx.fillStyle = "hsl(152 92% 60% / 0.8)";
        ctx.fillRect(tx + 12 * size, top + 30 * size, 8, 12);
        ctx.fillStyle = "hsl(190 16% 12%)";
      }
    },
    front(ctx, stage, phase, rnd) {
      // bare trees
      ctx.strokeStyle = "hsl(190 16% 10%)";
      for (let k = 0; k < 3; k++) {
        const tx = rnd() * W;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(tx, FLOOR);
        ctx.lineTo(tx + 6, FLOOR - 120);
        ctx.stroke();
        ctx.lineWidth = 3;
        for (let b = 0; b < 5; b++) {
          const by = FLOOR - 60 - b * 14, dir = b % 2 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(tx + 4, by);
          ctx.lineTo(tx + dir * (30 + rnd() * 20), by - 20 - rnd() * 20);
          ctx.stroke();
        }
      }
      // ghost lanterns and fog
      for (let i = 0; i < 6 + stage * 2; i++) glow(ctx, rnd() * W, 220 + rnd() * 200, 14, "hsl(152 92% 66%)", 0.9);
      const fog = ctx.createLinearGradient(0, FLOOR - 90, 0, FLOOR);
      fog.addColorStop(0, "hsl(160 20% 80% / 0)");
      fog.addColorStop(1, `hsl(160 20% 80% / ${0.25 + phase * 0.08})`);
      ctx.fillStyle = fog;
      ctx.fillRect(0, FLOOR - 90, W, 90);
    },
  },
  // 7. The Dying Sun: a huge sun going black a little more every stage
  {
    sky: [["hsl(36 80% 62%)", "hsl(30 90% 72%)", "hsl(44 100% 82%)"], ["hsl(24 60% 42%)", "hsl(20 70% 54%)", "hsl(36 90% 66%)"], ["hsl(14 40% 18%)", "hsl(16 50% 30%)", "hsl(30 80% 46%)"], ["hsl(20 30% 4%)", "hsl(24 40% 10%)", "hsl(36 90% 30%)"]],
    far: "hsl(20 30% 30%)", near: "hsl(24 30% 22%)", floor: ["hsl(38 40% 54%)", "hsl(26 30% 32%)"], line: "hsl(26 30% 22% / 0.5)", starsFrom: 3,
    scene(ctx, stage) {
      const sx = 480, sy = 230, r = 130;
      glow(ctx, sx, sy, r * 2.4, "hsl(40 100% 64%)", 0.6 - stage * 0.03);
      ctx.fillStyle = "hsl(44 100% 70%)";
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      // the shadow slides across the sun, stage by stage
      const cover = (stage + 1) / 10;
      ctx.fillStyle = "hsl(30 30% 8%)";
      ctx.beginPath();
      ctx.arc(sx + (1 - cover) * r * 2, sy, r * 0.98, 0, Math.PI * 2);
      ctx.fill();
    },
    front(ctx, stage, _phase, rnd) {
      // ruined pillars and a sundial
      for (let k = 0; k < 6; k++) {
        const px = 40 + k * 170 + rnd() * 40, ph = 60 + rnd() * 110;
        ctx.fillStyle = "hsl(34 24% 40%)";
        ctx.fillRect(px, FLOOR - ph, 28, ph);
        ctx.fillStyle = "hsl(34 24% 30%)";
        ctx.fillRect(px - 6, FLOOR - ph - 10, 40, 10);
      }
      if (stage === 1) {
        ctx.fillStyle = "hsl(34 20% 60%)";
        ctx.beginPath();
        ctx.ellipse(480, FLOOR - 10, 90, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  // 8. The Edge of Everything: open space with planets and a black hole that grows every stage
  {
    sky: [["hsl(240 50% 10%)", "hsl(250 50% 18%)", "hsl(260 50% 28%)"], ["hsl(240 50% 8%)", "hsl(256 50% 16%)", "hsl(272 50% 26%)"], ["hsl(236 55% 6%)", "hsl(250 55% 12%)", "hsl(272 60% 22%)"], ["hsl(236 60% 3%)", "hsl(250 60% 8%)", "hsl(272 80% 20%)"]],
    far: "hsl(250 30% 16%)", near: "hsl(246 30% 12%)", floor: ["hsl(250 30% 22%)", "hsl(240 40% 8%)"], line: "hsl(272 100% 80% / 0.35)", starsFrom: 0,
    scene(ctx, stage, _phase, rnd) {
      // a planet with rings
      const px = 140 + rnd() * 200, py = 110 + rnd() * 60, pr = 30 + rnd() * 30;
      ctx.fillStyle = `hsl(${200 + stage * 18} 50% 56%)`;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "hsl(40 60% 80% / 0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(px, py, pr * 1.8, pr * 0.4, -0.3, 0, Math.PI * 2);
      ctx.stroke();
      // the black hole
      const bx = 700 - ((stage * 41) % 160), by = 170, br = 20 + stage * 6;
      for (let k = 4; k > 0; k--) {
        ctx.beginPath();
        ctx.ellipse(bx, by, br * (1.4 + k * 0.4), br * (0.3 + k * 0.08), 0.2, 0, Math.PI * 2);
        ctx.strokeStyle = `hsl(${272 - k * 30} 100% 72% / ${0.2 + k * 0.1})`;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  // Book 2, 1. Lights Under the Sea: a drowned harbour at night. Lure lights glow under the black water, more
  // every stage, tentacles rise out of the sea, and at the lair a huge eye looks up from below.
  {
    sky: [["hsl(214 40% 18%)", "hsl(204 34% 28%)", "hsl(190 30% 40%)"], ["hsl(216 44% 12%)", "hsl(206 36% 20%)", "hsl(190 34% 30%)"], ["hsl(220 50% 8%)", "hsl(206 44% 14%)", "hsl(180 40% 22%)"], ["hsl(210 60% 4%)", "hsl(196 56% 8%)", "hsl(170 50% 16%)"]],
    far: "hsl(200 30% 14%)", near: "hsl(200 30% 10%)", floor: ["hsl(196 20% 26%)", "hsl(200 24% 16%)"], line: "hsl(66 60% 60% / 0.25)", starsFrom: 0, flat: true,
    scene(ctx, stage, phase, rnd) {
      // a sick moon behind thin cloud
      glow(ctx, 760, 90, 90, "hsl(66 60% 70%)", 0.35);
      ctx.fillStyle = "hsl(66 30% 82%)";
      ctx.beginPath();
      ctx.arc(760, 90, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `hsl(206 30% 20% / ${0.4 + phase * 0.12})`;
      for (let i = 0; i < 3 + stage; i++) {
        const cx = rnd() * W, cy = 50 + rnd() * 110, r = 40 + rnd() * 50;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.8, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // the old crack the Reign 8 left behind, glowing green from the lair on
      if (phase >= 2) crack(ctx, 200 + rnd() * 400, 150, 160 + phase * 40, rnd, "hsl(66 100% 86%)", "hsl(170 100% 50% / 0.4)", 2.5);
      // the sea
      const sea = ctx.createLinearGradient(0, 300, 0, FLOOR);
      sea.addColorStop(0, `hsl(196 40% ${22 - phase * 4}%)`);
      sea.addColorStop(1, `hsl(206 50% ${10 - phase * 2}%)`);
      ctx.fillStyle = sea;
      ctx.fillRect(0, 300, W, FLOOR - 300);
      // the lair: a vast eye looking up from under the water
      if (phase === 3) {
        ctx.fillStyle = "hsl(60 30% 70% / 0.35)";
        ctx.beginPath();
        ctx.ellipse(W / 2, 380, 220, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "hsl(64 100% 50% / 0.55)";
        ctx.beginPath();
        ctx.arc(W / 2 + 20, 380, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "hsl(200 60% 4% / 0.8)";
        ctx.beginPath();
        ctx.ellipse(W / 2 + 20, 380, 7, 30, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // lure lights under the water, more of them every stage
      for (let i = 0; i < 3 + stage * 3; i++) {
        const lx = rnd() * W, ly = 320 + rnd() * (FLOOR - 330);
        glow(ctx, lx, ly, 10 + rnd() * 14, "hsl(66 100% 64%)", 0.55);
        ctx.fillStyle = "hsl(66 100% 88%)";
        ctx.fillRect(lx - 1, ly - 1, 2, 2);
      }
      ctx.strokeStyle = "hsl(180 40% 70% / 0.25)";
      ctx.lineWidth = 2;
      for (let y = 312; y < FLOOR; y += 18) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 12) ctx.lineTo(x, y + Math.sin(x * 0.03 + y) * 2);
        ctx.stroke();
      }
      // tentacles rising out of the sea from stage 3 on
      for (let i = 0; i < Math.max(0, stage - 1); i++) {
        const tx = 60 + ((i * 263 + stage * 71) % (W - 120)), base = 312 + rnd() * 30, h = 70 + rnd() * 60 + phase * 20;
        ctx.strokeStyle = "hsl(190 40% 8%)";
        ctx.lineCap = "round";
        let px = tx, py = base;
        for (let k = 1; k <= 10; k++) {
          const u = k / 10;
          const nx = tx + Math.sin(u * 3.2 + i) * 18 * u, ny = base - h * u;
          ctx.lineWidth = 12 * (1 - u * 0.85);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(nx, ny);
          ctx.stroke();
          px = nx;
          py = ny;
        }
      }
    },
    front(ctx, stage, phase) {
      // the pier and its lamp posts; one more lamp has gone out every stage
      ctx.fillStyle = "hsl(30 20% 12%)";
      ctx.fillRect(0, FLOOR - 34, W, 10);
      for (let x = 20; x < W; x += 90) ctx.fillRect(x, FLOOR - 26, 8, 26);
      for (let i = 0; i < 5; i++) {
        const x = 90 + i * 200;
        ctx.fillStyle = INK;
        ctx.fillRect(x - 2, FLOOR - 120, 4, 88);
        ctx.fillRect(x - 8, FLOOR - 128, 16, 10);
        if (i >= Math.floor(stage / 2) && phase < 3) glow(ctx, x, FLOOR - 123, 40, "hsl(44 100% 70%)", 0.6);
      }
    },
  },
];

function paint(ch: number, stage: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const look = LOOKS[ch] ?? LOOKS[0];
  const phase = phaseOf(stage, lairOf(ch));
  let seed = 101 + ch * 37 + stage * 11;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  // sky
  const [top, mid, low] = look.sky[phase];
  const sky = ctx.createLinearGradient(0, 0, 0, FLOOR);
  sky.addColorStop(0, top);
  sky.addColorStop(0.55, mid);
  sky.addColorStop(1, low);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, FLOOR);
  if (phase >= look.starsFrom) stars(ctx, rnd, 60 + phase * 40);
  look.scene(ctx, stage, phase, rnd);
  if (!look.flat) {
    hills(ctx, 330, 90, look.far, ch + stage * 0.7);
    hills(ctx, 380, 50, look.near, ch * 2 + stage * 1.3);
  }
  look.front?.(ctx, stage, phase, rnd);
  // floor
  const floor = ctx.createLinearGradient(0, FLOOR, 0, H);
  floor.addColorStop(0, look.floor[0]);
  floor.addColorStop(1, look.floor[1]);
  ctx.fillStyle = floor;
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
  ctx.fillStyle = INK;
  ctx.fillRect(0, FLOOR - 2, W, 4);
  ctx.strokeStyle = look.line;
  ctx.lineWidth = 2;
  for (let i = -12; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + i * 60, FLOOR + 2);
    ctx.lineTo(W / 2 + i * 150, H);
    ctx.stroke();
  }
  for (const y of [462, 492, 530, 575]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // the boss's lair glows with its colour on the floor
  ctx.strokeStyle = phase === 3 ? "hsl(0 0% 100% / 0.6)" : "hsl(0 0% 100% / 0.35)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(W / 2, 540, 300, 40, 0, 0, Math.PI * 2);
  ctx.stroke();
  // vignette, heavier as the chapter goes on
  const v = ctx.createRadialGradient(W / 2, H / 2, 240, W / 2, H / 2, 640);
  v.addColorStop(0, "hsl(0 0% 0% / 0)");
  v.addColorStop(1, `hsl(250 40% 6% / ${0.3 + phase * 0.12})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  return c;
}

const cache = new Map<string, HTMLCanvasElement>();

/** The painting behind a Story stage, painted once per chapter and stage. Browser only. */
export function storyBackdrop(ch: number, stage: number): HTMLCanvasElement {
  const key = `${ch}:${stage}`;
  let c = cache.get(key);
  if (!c) {
    c = paint(ch, stage);
    cache.set(key, c);
  }
  return c;
}
