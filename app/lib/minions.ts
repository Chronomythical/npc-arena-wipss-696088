// The Story bosses' minions. Each chapter's boss sends four kinds: a grunt, a caster, a brute and one
// lieutenant who guards the gate before the boss. A minion fights with one roster power (its `id`, which
// also gives it that power's moves, voice and entrance) but wears its boss's colours and its own gear,
// drawn by the engine from `minion`.
import { DEF_BY_ID, type FighterDef, type MinionKind, type Move, type MoveKind, type Power, type Role } from "./fighters";

const HP: Record<MinionKind, number> = { grunt: 90, caster: 80, brute: 125, elite: 165 };
const SPEED: Record<MinionKind, number> = { grunt: 1.06, caster: 0.96, brute: 0.84, elite: 1 };
const ROLE: Record<MinionKind, Role> = { grunt: "attacker", caster: "control", brute: "tank", elite: "attacker" };

const CLOSE: MoveKind[] = ["melee", "dash", "blink"];
const FAR: MoveKind[] = ["projectile", "beam", "rain", "zone", "pull", "eruption"];
const HEAVY: MoveKind[] = ["melee", "burst", "eruption", "dash"];

/** The moves a minion keeps from its power: grunts close in, casters keep their distance, brutes hit hard. A lieutenant keeps them all. */
function movesFor(kind: MinionKind, all: Move[]): Move[] {
  if (kind === "elite") return all;
  const want = kind === "grunt" ? CLOSE : kind === "caster" ? FAR : HEAVY;
  const size = kind === "caster" ? 4 : 3;
  const picked = all.filter((m) => want.includes(m.kind)).slice(0, size);
  // a caster still has one way to hit up close
  if (kind === "caster" && !picked.some((m) => m.kind === "melee")) {
    const melee = all.find((m) => m.kind === "melee");
    if (melee) picked.unshift(melee);
  }
  for (const m of all) if (picked.length < size && !picked.includes(m)) picked.push(m);
  return picked;
}

function minion(kind: MinionKind, base: Power, name: string, color: string, mark: string): FighterDef {
  const d = DEF_BY_ID[base];
  return {
    id: base, name, power: d.power, role: ROLE[kind], ability: d.ability,
    color, glow: mark, hp: HP[kind], speed: Math.round(d.speed * SPEED[kind]),
    moves: movesFor(kind, d.moves),
    minion: { kind, mark },
  };
}

type Crew = Record<MinionKind, FighterDef>;

/** Each chapter's minions, in chapter order. */
export const MINIONS: Crew[] = [
  // Chapter 1: Nullshade's shadows from the rift
  {
    grunt: minion("grunt", "umbra", "Voidling", "hsl(268 34% 26%)", "hsl(186 100% 70%)"),
    caster: minion("caster", "psy", "Null Acolyte", "hsl(276 30% 34%)", "hsl(186 100% 70%)"),
    brute: minion("brute", "gravi", "Rift Brute", "hsl(262 36% 20%)", "hsl(186 100% 70%)"),
    elite: minion("elite", "tele", "Shade Herald", "hsl(268 40% 16%)", "hsl(186 100% 76%)"),
  },
  // Chapter 2: Maelstrom's sea creatures
  {
    grunt: minion("grunt", "hydro", "Brine Imp", "hsl(196 62% 38%)", "hsl(176 90% 62%)"),
    caster: minion("caster", "electro", "Squall Caller", "hsl(212 48% 42%)", "hsl(186 100% 72%)"),
    brute: minion("brute", "terra", "Reef Brute", "hsl(184 40% 30%)", "hsl(14 90% 64%)"),
    elite: minion("elite", "aero", "Tide Captain", "hsl(204 70% 30%)", "hsl(186 100% 76%)"),
  },
  // Chapter 3: Magmaw's fire-born
  {
    grunt: minion("grunt", "pyro", "Cinder Imp", "hsl(14 64% 36%)", "hsl(34 100% 58%)"),
    caster: minion("caster", "lux", "Ash Priest", "hsl(20 14% 38%)", "hsl(28 100% 58%)"),
    brute: minion("brute", "terra", "Basalt Golem", "hsl(12 18% 22%)", "hsl(24 100% 54%)"),
    elite: minion("elite", "gravi", "Caldera Warden", "hsl(12 30% 20%)", "hsl(40 100% 60%)"),
  },
  // Chapter 4: Everwinter's frozen servants
  {
    grunt: minion("grunt", "cryo", "Frostling", "hsl(200 56% 70%)", "hsl(196 100% 90%)"),
    caster: minion("caster", "chrono", "Stopped Seer", "hsl(214 30% 56%)", "hsl(44 90% 68%)"),
    brute: minion("brute", "cryo", "Glacier Ogre", "hsl(206 40% 60%)", "hsl(196 100% 88%)"),
    elite: minion("elite", "chrono", "Hourglass Knight", "hsl(206 50% 76%)", "hsl(44 90% 64%)"),
  },
  // Chapter 5: the Riftmaker's twisted things
  {
    grunt: minion("grunt", "shift", "Rift Sprite", "hsl(286 40% 30%)", "hsl(318 100% 72%)"),
    caster: minion("caster", "psy", "Mirage Mage", "hsl(252 32% 30%)", "hsl(318 100% 76%)"),
    brute: minion("brute", "gravi", "Gravity Hulk", "hsl(246 30% 20%)", "hsl(300 90% 68%)"),
    elite: minion("elite", "tele", "Fold Walker", "hsl(252 30% 14%)", "hsl(318 100% 72%)"),
  },
  // Chapter 6: the Hollow King's undead court
  {
    grunt: minion("grunt", "umbra", "Hollow Squire", "hsl(170 10% 30%)", "hsl(152 92% 60%)"),
    caster: minion("caster", "toxi", "Plague Monk", "hsl(110 16% 28%)", "hsl(96 90% 56%)"),
    brute: minion("brute", "terra", "Crypt Brute", "hsl(40 10% 40%)", "hsl(152 92% 60%)"),
    elite: minion("elite", "psy", "Pale Regent", "hsl(170 14% 18%)", "hsl(152 92% 66%)"),
  },
  // Chapter 7: the Black Sun's eclipse cult
  {
    grunt: minion("grunt", "pyro", "Sunspot Imp", "hsl(22 40% 24%)", "hsl(40 100% 62%)"),
    caster: minion("caster", "lux", "Eclipse Priest", "hsl(30 20% 16%)", "hsl(44 100% 66%)"),
    brute: minion("brute", "electro", "Flare Hulk", "hsl(16 50% 28%)", "hsl(30 100% 58%)"),
    elite: minion("elite", "umbra", "Dusk Paladin", "hsl(30 30% 10%)", "hsl(40 100% 64%)"),
  },
  // Chapter 8: the Axiom's cosmic constructs
  {
    grunt: minion("grunt", "magneto", "Proof Drone", "hsl(232 36% 30%)", "hsl(272 100% 80%)"),
    caster: minion("caster", "tele", "Theorem Caster", "hsl(250 40% 24%)", "hsl(200 100% 76%)"),
    brute: minion("brute", "gravi", "Constant Golem", "hsl(236 40% 16%)", "hsl(272 100% 76%)"),
    elite: minion("elite", "chrono", "The Paradox", "hsl(236 55% 11%)", "hsl(272 100% 82%)"),
  },
];
