// The Story bosses' minions. Each chapter's boss sends four kinds: a grunt, a caster, a brute and one
// lieutenant who guards the gate before the boss. Every minion has a power of its own: its own name, its own
// moves and its own colours. Underneath it fights like one roster element (its `id`, which gives it that
// element's voice, entrance and move shapes), and it carries one move of its boss's energy: a smaller copy of
// one of the boss's own attacks, drawn in the boss's colours. Its gear is drawn by the engine from `minion`.
import { BOSSES, type BossId } from "./bosses";
import { DEF_BY_ID, type FighterDef, type MinionKind, type Move, type MoveKind, type Power, type Role } from "./fighters";
import { borrowLook } from "./move-looks";

const HP: Record<MinionKind, number> = { grunt: 90, caster: 80, brute: 125, elite: 165 };
const SPEED: Record<MinionKind, number> = { grunt: 1.06, caster: 0.96, brute: 0.84, elite: 1 };
const ROLE: Record<MinionKind, Role> = { grunt: "attacker", caster: "control", brute: "tank", elite: "attacker" };

const CLOSE: MoveKind[] = ["melee", "dash", "blink"];
const FAR: MoveKind[] = ["projectile", "beam", "rain", "zone", "pull", "eruption"];
const HEAVY: MoveKind[] = ["melee", "burst", "eruption", "dash"];

/** The move shapes a minion fights with: grunts close in, casters keep their distance, brutes hit hard. A lieutenant has them all. */
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

/** A minion's share of its boss's energy: the boss's move, smaller, slower to come back and weaker. */
function surgeOf(boss: FighterDef, from: string, id: string, name: string): Move {
  const src = boss.moves.find((m) => m.id === from) ?? boss.moves[0];
  const cut = (v: number | undefined, k: number) => (v == null ? v : Math.round(v * k));
  return {
    ...src,
    id, name,
    power: boss.id,
    dmg: Math.max(3, Math.round(src.dmg * 0.6)),
    cd: Math.round(src.cd * 1.5 * 10) / 10,
    kb: cut(src.kb, 0.75),
    lift: cut(src.lift, 0.8),
    radius: cut(src.radius, 0.8),
    count: src.count && src.count > 1 ? Math.max(2, Math.ceil(src.count * 0.6)) : src.count,
    dur: src.dur ? Math.round(src.dur * 0.7 * 10) / 10 : src.dur,
    pullIn: cut(src.pullIn, 0.7),
    statusDur: src.statusDur ? Math.round(src.statusDur * 0.7 * 100) / 100 : src.statusDur,
    heal: src.heal ? Math.max(1, Math.round(src.heal * 0.5)) : src.heal,
  };
}

type Spec = {
  /** The roster element it fights like. */
  base: Power;
  name: string;
  /** Body colour, and the boss's glowing colour it wears. */
  color: string;
  mark: string;
  /** Its own power. */
  power: string;
  ability: string;
  /** Its own moves' colours: body and highlight. */
  tone: [string, string];
  /** Its own names for its moves, in the order movesFor picks them. */
  moves: string[];
  /** The boss move it borrows energy from, and what it calls its copy. */
  surge: { from: string; name: string };
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function minion(kind: MinionKind, boss: BossId, s: Spec): FighterDef {
  const d = DEF_BY_ID[s.base];
  const b = BOSSES[boss];
  const key = `minion-${slug(s.name)}`;
  const own = movesFor(kind, d.moves).map((m, i) => {
    const id = `${key}-${i}`;
    borrowLook(id, m.id, s.tone[0], s.tone[1]);
    return { ...m, id, name: s.moves[i] ?? m.name };
  });
  const surgeId = `${key}-surge`;
  borrowLook(surgeId, s.surge.from, b.glow, b.color);
  const surge = surgeOf(b, s.surge.from, surgeId, s.surge.name);
  return {
    id: s.base, name: s.name, power: s.power, role: ROLE[kind], ability: s.ability,
    color: s.color, glow: s.mark, hp: HP[kind], speed: Math.round(d.speed * SPEED[kind]),
    moves: [...own, surge],
    minion: { kind, mark: s.mark },
  };
}

type Crew = Record<MinionKind, FighterDef>;

/** Each chapter's minions, in chapter order. */
export const MINIONS: Crew[] = [
  // Chapter 1: Nullshade's shadows from the rift
  {
    grunt: minion("grunt", "nullshade", {
      base: "umbra", name: "Voidling", color: "hsl(268 34% 26%)", mark: "hsl(186 100% 70%)",
      power: "Hungry Dark", ability: "Gnaws with teeth of living shadow and slips through the dark to bite again.",
      tone: ["hsl(272 60% 34%)", "hsl(280 90% 76%)"], moves: ["Shadow Gnaw", "Dark Slip", "Hunger Orb"],
      surge: { from: "positron-palm", name: "Positron Bite" },
    }),
    caster: minion("caster", "nullshade", {
      base: "psy", name: "Null Acolyte", color: "hsl(276 30% 34%)", mark: "hsl(186 100% 70%)",
      power: "Hollow Chant", ability: "Chants minds empty: whispers that lift, ring out and crush.",
      tone: ["hsl(250 50% 46%)", "hsl(230 100% 84%)"], moves: ["Hush Palm", "Rising Chant", "Empty Whisper", "Silence Crush"],
      surge: { from: "pair-burst", name: "Pair Spark" },
    }),
    brute: minion("brute", "nullshade", {
      base: "gravi", name: "Rift Brute", color: "hsl(262 36% 20%)", mark: "hsl(186 100% 70%)",
      power: "Rift Weight", ability: "Carries a piece of the rift on its back. It drags in and sinks whatever comes near.",
      tone: ["hsl(258 40% 28%)", "hsl(264 70% 70%)"], moves: ["Rift Hammer", "Sinking Pit", "Rift Drag"],
      surge: { from: "zero-point", name: "Zero Slam" },
    }),
    elite: minion("elite", "nullshade", {
      base: "tele", name: "Shade Herald", color: "hsl(268 40% 16%)", mark: "hsl(186 100% 76%)",
      power: "Herald Step", ability: "Steps between shadows to announce its master, striking from where it stood a moment ago.",
      tone: ["hsl(284 45% 30%)", "hsl(300 80% 80%)"], moves: ["Herald's Heel", "Summons Bolt", "Procession", "Proclamation"],
      surge: { from: "annihilation", name: "Small Annihilation" },
    }),
  },
  // Chapter 2: Maelstrom's sea creatures
  {
    grunt: minion("grunt", "maelstrom", {
      base: "hydro", name: "Brine Imp", color: "hsl(196 62% 38%)", mark: "hsl(176 90% 62%)",
      power: "Salt Spray", ability: "Spits stinging brine and lashes out with seaweed.",
      tone: ["hsl(168 60% 38%)", "hsl(150 70% 78%)"], moves: ["Brine Jab", "Kelp Lash", "Salt Surge"],
      surge: { from: "trident-rake", name: "Trident Jab" },
    }),
    caster: minion("caster", "maelstrom", {
      base: "electro", name: "Squall Caller", color: "hsl(212 48% 42%)", mark: "hsl(186 100% 72%)",
      power: "Sea Squall", ability: "Calls rain-soaked lightning down from the clouds over the waves.",
      tone: ["hsl(220 70% 56%)", "hsl(205 100% 88%)"], moves: ["Static Slap", "Squall Bolt", "Drifting Spark", "Downpour"],
      surge: { from: "thunderhead", name: "Squall Cloud" },
    }),
    brute: minion("brute", "maelstrom", {
      base: "terra", name: "Reef Brute", color: "hsl(184 40% 30%)", mark: "hsl(14 90% 64%)",
      power: "Living Coral", ability: "Its body is a reef: coral fists, and coral spears from the sea floor.",
      tone: ["hsl(10 70% 56%)", "hsl(30 100% 80%)"], moves: ["Coral Fist", "Reef Spear", "Seabed Stomp"],
      surge: { from: "tidal-wall", name: "Reef Wave" },
    }),
    elite: minion("elite", "maelstrom", {
      base: "aero", name: "Tide Captain", color: "hsl(204 70% 30%)", mark: "hsl(186 100% 76%)",
      power: "Sea Wind", ability: "Steers the sea wind like a sail: cutting gusts, a spinning rush and a spout that throws enemies overboard.",
      tone: ["hsl(190 60% 50%)", "hsl(180 80% 90%)"], moves: ["Boarding Kick", "Gust Cutlass", "Keelhaul Spin", "Overboard"],
      surge: { from: "eye-of-the-storm", name: "Storm Eye" },
    }),
  },
  // Chapter 3: Magmaw's fire-born
  {
    grunt: minion("grunt", "magmaw", {
      base: "pyro", name: "Cinder Imp", color: "hsl(14 64% 36%)", mark: "hsl(34 100% 58%)",
      power: "Cinders", ability: "Flicks hot cinders and starts small fires underfoot.",
      tone: ["hsl(36 95% 52%)", "hsl(52 100% 72%)"], moves: ["Cinder Flick", "Spark Lob", "Kindling"],
      surge: { from: "magma-bite", name: "Magma Nip" },
    }),
    caster: minion("caster", "magmaw", {
      base: "lux", name: "Ash Priest", color: "hsl(20 14% 38%)", mark: "hsl(28 100% 58%)",
      power: "Ashlight", ability: "Prays in smoke and ash. Its light comes through the haze dim and grey, and still burns.",
      tone: ["hsl(24 20% 50%)", "hsl(36 60% 80%)"], moves: ["Ash Palm", "Smoke Ray", "Ashfall", "Pyre Blessing"],
      surge: { from: "lava-bombs", name: "Lava Hail" },
    }),
    brute: minion("brute", "magmaw", {
      base: "terra", name: "Basalt Golem", color: "hsl(12 18% 22%)", mark: "hsl(24 100% 54%)",
      power: "Cooled Lava", ability: "Made of cooled lava. Its fists are black stone and its stomp cracks the floor.",
      tone: ["hsl(0 0% 26%)", "hsl(20 40% 60%)"], moves: ["Basalt Fist", "Obsidian Spike", "Golem Stomp"],
      surge: { from: "fault-line", name: "Fault Crack" },
    }),
    elite: minion("elite", "magmaw", {
      base: "gravi", name: "Caldera Warden", color: "hsl(12 30% 20%)", mark: "hsl(40 100% 60%)",
      power: "Crater Pull", ability: "Guards the crater. It pulls enemies into the pit and drops the rim down on them.",
      tone: ["hsl(16 50% 34%)", "hsl(30 90% 66%)"], moves: ["Warden's Palm", "Crater Pit", "Rim Pull", "Rockslide"],
      surge: { from: "volcanic-roar", name: "Caldera Roar" },
    }),
  },
  // Chapter 4: Everwinter's frozen servants
  {
    grunt: minion("grunt", "everwinter", {
      base: "cryo", name: "Frostling", color: "hsl(200 56% 70%)", mark: "hsl(196 100% 90%)",
      power: "Frostbite", ability: "A small thing of snow that nips at ankles and throws icicles.",
      tone: ["hsl(190 70% 80%)", "hsl(0 0% 100%)"], moves: ["Frost Nip", "Icicle Toss", "Snow Spike"],
      surge: { from: "rime-sickle", name: "Rime Claw" },
    }),
    caster: minion("caster", "everwinter", {
      base: "chrono", name: "Stopped Seer", color: "hsl(214 30% 56%)", mark: "hsl(44 90% 68%)",
      power: "Frozen Hour", ability: "Sees only the moment that stopped, and tries to keep everyone stuck in it.",
      tone: ["hsl(214 40% 64%)", "hsl(48 80% 82%)"], moves: ["Still Hand", "Stuck Second", "Frozen Moment", "Rewound Breath"],
      surge: { from: "hourglass-icicles", name: "Hourglass Sleet" },
    }),
    brute: minion("brute", "everwinter", {
      base: "cryo", name: "Glacier Ogre", color: "hsl(206 40% 60%)", mark: "hsl(196 100% 88%)",
      power: "Glacier Bulk", ability: "Hits like a sliding glacier and hurls whole chunks of ice.",
      tone: ["hsl(204 50% 62%)", "hsl(196 90% 90%)"], moves: ["Glacier Palm", "Ice Shelf", "Hailstone Heave"],
      surge: { from: "glacial-age", name: "Rime Ground" },
    }),
    elite: minion("elite", "everwinter", {
      base: "chrono", name: "Hourglass Knight", color: "hsl(206 50% 76%)", mark: "hsl(44 90% 64%)",
      power: "Frozen Sand", ability: "Its hourglass runs with frozen sand, and every swing steals a second.",
      tone: ["hsl(40 50% 64%)", "hsl(200 90% 90%)"], moves: ["Hourglass Edge", "Sand Bolt", "Stopped Glass", "Turn the Glass"],
      surge: { from: "rime-step", name: "Frozen Second" },
    }),
  },
  // Chapter 5: the Riftmaker's twisted things
  {
    grunt: minion("grunt", "riftmaker", {
      base: "shift", name: "Rift Sprite", color: "hsl(286 40% 30%)", mark: "hsl(318 100% 72%)",
      power: "Misshapen", ability: "Its body never holds a shape: limbs turn into blades, and it copies the last move that hit it.",
      tone: ["hsl(300 70% 56%)", "hsl(320 100% 86%)"], moves: ["Twist Strike", "Bent Blade", "Funhouse Mirror"],
      surge: { from: "fold-strike", name: "Fold Pinch" },
    }),
    caster: minion("caster", "riftmaker", {
      base: "psy", name: "Mirage Mage", color: "hsl(252 32% 30%)", mark: "hsl(318 100% 76%)",
      power: "Mirage", ability: "Shows enemies things that are not there, then makes them real enough to hurt.",
      tone: ["hsl(270 60% 64%)", "hsl(190 100% 84%)"], moves: ["Phantom Palm", "False Floor", "Shimmer Wave", "Vanishing Point"],
      surge: { from: "mirror-shards", name: "Mirror Splinters" },
    }),
    brute: minion("brute", "riftmaker", {
      base: "gravi", name: "Gravity Hulk", color: "hsl(246 30% 20%)", mark: "hsl(300 90% 68%)",
      power: "Wrong Weight", ability: "Where it stands, down is the wrong way, and enemies fall sideways into it.",
      tone: ["hsl(240 40% 30%)", "hsl(280 70% 72%)"], moves: ["Heavy Fist", "Sideways Well", "Wrong-Way Pull"],
      surge: { from: "unmake", name: "Unmaking Slam" },
    }),
    elite: minion("elite", "riftmaker", {
      base: "tele", name: "Fold Walker", color: "hsl(252 30% 14%)", mark: "hsl(318 100% 72%)",
      power: "Paper Space", ability: "Folds space like paper and walks across the crease.",
      tone: ["hsl(260 50% 40%)", "hsl(330 90% 82%)"], moves: ["Crease Kick", "Folded Shot", "Paper Cuts", "Unfold"],
      surge: { from: "dimension-tear", name: "Tear in Space" },
    }),
  },
  // Chapter 6: the Hollow King's undead court
  {
    grunt: minion("grunt", "hollowking", {
      base: "umbra", name: "Hollow Squire", color: "hsl(170 10% 30%)", mark: "hsl(152 92% 60%)",
      power: "Grave Shade", ability: "A dead knight's squire, still swinging a sword made of grave shadow.",
      tone: ["hsl(160 20% 28%)", "hsl(150 40% 70%)"], moves: ["Rusted Cut", "Grave Step", "Tomb Orb"],
      surge: { from: "reaper-scythe", name: "Squire's Scythe" },
    }),
    caster: minion("caster", "hollowking", {
      base: "toxi", name: "Plague Monk", color: "hsl(110 16% 28%)", mark: "hsl(96 90% 56%)",
      power: "Crypt Rot", ability: "Swings a censer of crypt rot that sickens everything around it.",
      tone: ["hsl(80 50% 40%)", "hsl(70 80% 70%)"], moves: ["Rot Touch", "Bile Spit", "Censer Smoke", "Plague Bell"],
      surge: { from: "wailing-souls", name: "Wailing Breath" },
    }),
    brute: minion("brute", "hollowking", {
      base: "terra", name: "Crypt Brute", color: "hsl(40 10% 40%)", mark: "hsl(152 92% 60%)",
      power: "Bone Pile", ability: "Built from crypt stone and old bones: fists of bone, and bones that burst from the floor.",
      tone: ["hsl(40 20% 66%)", "hsl(45 40% 90%)"], moves: ["Bone Fist", "Ossuary Spikes", "Crypt Quake"],
      surge: { from: "grave-hands", name: "Grasping Dead" },
    }),
    elite: minion("elite", "hollowking", {
      base: "psy", name: "Pale Regent", color: "hsl(170 14% 18%)", mark: "hsl(152 92% 66%)",
      power: "Dead Will", ability: "Rules the court while the king sleeps. Its will reaches into living minds.",
      tone: ["hsl(180 20% 56%)", "hsl(170 50% 88%)"], moves: ["Royal Touch", "Raise the Dead", "Decree", "Pale Command"],
      surge: { from: "soul-chains", name: "Regent's Chains" },
    }),
  },
  // Chapter 7: the Black Sun's eclipse cult
  {
    grunt: minion("grunt", "blacksun", {
      base: "pyro", name: "Sunspot Imp", color: "hsl(22 40% 24%)", mark: "hsl(40 100% 62%)",
      power: "Sunspots", ability: "Throws the dark spots from the sun's face, which burn far hotter than they look.",
      tone: ["hsl(10 80% 40%)", "hsl(30 100% 64%)"], moves: ["Spot Burn", "Sunspot", "Dark Flame"],
      surge: { from: "corona-edge", name: "Corona Scratch" },
    }),
    caster: minion("caster", "blacksun", {
      base: "lux", name: "Eclipse Priest", color: "hsl(30 20% 16%)", mark: "hsl(44 100% 66%)",
      power: "Crescent Light", ability: "Worships the sun gone dark. Its light only comes through a narrow crescent.",
      tone: ["hsl(36 60% 46%)", "hsl(48 100% 80%)"], moves: ["Crescent Palm", "Crescent Ray", "Corona Shards", "Shadowed Halo"],
      surge: { from: "eclipse-disc", name: "Dark Disc" },
    }),
    brute: minion("brute", "blacksun", {
      base: "electro", name: "Flare Hulk", color: "hsl(16 50% 28%)", mark: "hsl(30 100% 58%)",
      power: "Solar Storm", ability: "Crackles with the storm a solar flare throws off.",
      tone: ["hsl(26 100% 52%)", "hsl(50 100% 80%)"], moves: ["Flare Knuckle", "Storm Ray", "Plasma Ball"],
      surge: { from: "prominence", name: "Solar Geyser" },
    }),
    elite: minion("elite", "blacksun", {
      base: "umbra", name: "Dusk Paladin", color: "hsl(30 30% 10%)", mark: "hsl(40 100% 64%)",
      power: "Dusk Oath", ability: "Swore itself to the last hour of light. Half its blade is sunset, half is night.",
      tone: ["hsl(16 60% 26%)", "hsl(30 90% 70%)"], moves: ["Dusk Blade", "Twilight Step", "Sunset Orb", "Nightfall"],
      surge: { from: "solar-flare", name: "Dusk Flare" },
    }),
  },
  // Chapter 8: the Axiom's cosmic constructs
  {
    grunt: minion("grunt", "axiom", {
      base: "magneto", name: "Proof Drone", color: "hsl(232 36% 30%)", mark: "hsl(272 100% 80%)",
      power: "Logic Field", ability: "Holds its pieces together with a field of pure logic, and pulls enemies into line.",
      tone: ["hsl(210 40% 56%)", "hsl(200 90% 86%)"], moves: ["Iron Lemma", "Axiom Shards", "Fall in Line"],
      surge: { from: "galaxy-fist", name: "Star Knuckle" },
    }),
    caster: minion("caster", "axiom", {
      base: "tele", name: "Theorem Caster", color: "hsl(250 40% 24%)", mark: "hsl(200 100% 76%)",
      power: "Proof Steps", ability: "Moves only in proven steps, and arrives exactly where the proof says.",
      tone: ["hsl(196 70% 50%)", "hsl(180 100% 86%)"], moves: ["Given Shot", "Therefore Kick", "Step by Step", "Q.E.D."],
      surge: { from: "star-shower", name: "Falling Proofs" },
    }),
    brute: minion("brute", "axiom", {
      base: "gravi", name: "Constant Golem", color: "hsl(236 40% 16%)", mark: "hsl(272 100% 76%)",
      power: "Constant Mass", ability: "A weight that never changes, whatever hits it.",
      tone: ["hsl(230 40% 36%)", "hsl(250 80% 80%)"], moves: ["Constant Fist", "Fixed Point", "Inverse Pull"],
      surge: { from: "event-horizon", name: "Small Horizon" },
    }),
    elite: minion("elite", "axiom", {
      base: "chrono", name: "The Paradox", color: "hsl(236 55% 11%)", mark: "hsl(272 100% 82%)",
      power: "Paradox", ability: "Remembers fights that have not happened yet, and wins them twice.",
      tone: ["hsl(290 50% 52%)", "hsl(48 100% 80%)"], moves: ["Before Strike", "After Bolt", "Loop", "Undo"],
      surge: { from: "wormhole-step", name: "Wormhole Lunge" },
    }),
  },
];
