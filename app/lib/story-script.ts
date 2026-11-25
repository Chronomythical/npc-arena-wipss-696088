// Who says what in Story mode's scenes. The words live in strings.json under story.script.c<chapter>;
// this file only says how many lines each scene has and who speaks each one.
import type { StringKey } from "~stencil/types/strings";

export type Speaker = "narrator" | "you" | "foe" | "boss";
export type Line = { who: Speaker; key: StringKey };
export type SceneKind = "intro" | "stage" | "outro";
export type Scene = { kind: SceneKind; ch: number; stage: number };

const k = (ch: number, part: string, n: number) => `story.script.c${ch + 1}.${part}.l${n}` as StringKey;

/** The lines of one scene: a chapter's opening, the words before a stage, or the boss's last words. */
export function sceneLines(scene: Scene): Line[] {
  const { kind, ch, stage } = scene;
  if (kind === "intro") return [1, 2, 3].map((n) => ({ who: "narrator", key: k(ch, "intro", n) }));
  if (kind === "outro") return [{ who: "boss", key: k(ch, "outro", 1) }, { who: "you", key: k(ch, "outro", 2) }, { who: "narrator", key: k(ch, "outro", 3) }];
  if (stage >= 9) return [{ who: "boss", key: k(ch, "s10", 1) }, { who: "you", key: k(ch, "s10", 2) }, { who: "boss", key: k(ch, "s10", 3) }];
  return [{ who: "foe", key: k(ch, `s${stage + 1}`, 1) }, { who: "you", key: k(ch, `s${stage + 1}`, 2) }];
}
