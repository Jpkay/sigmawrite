import { conjugationLesson } from "@/lib/conjugation/lessons";
import { pronounLessonForNode } from "@/lib/grammar/pronouns";

export type PracticeLesson = {
  family: string;
  eyebrow: string;
  explanation: string;
  pattern: string;
  examples: string[];
  exceptions: string[];
};

type PracticeNode = { key: string; label: string; description: string | null; strand: string };

/** Every human-approved competency has a short instruction card. Detailed
 * authored families override this taxonomy-derived fallback. */
export function lessonForPracticeNode(node: PracticeNode, approved?: Omit<PracticeLesson, "family" | "eyebrow">): PracticeLesson {
  if (node.strand === "conjugaison") return conjugationLesson(node.key, node.label);
  const pronoun = pronounLessonForNode(node.key, node.label);
  if (pronoun) return pronoun;
  const family = node.strand === "comprehension_ecrite"
    ? "Compréhension"
    : node.strand === "orthographe_lexicale"
      ? "Orthographe lexicale"
      : node.strand === "orthographe_grammaticale"
        ? "Orthographe grammaticale"
        : "Grammaire et syntaxe";
  if (approved) return { ...approved, family, eyebrow: `Leçon express · ${node.label}` };
  return {
    family,
    eyebrow: `Leçon express · ${node.label}`,
    explanation: node.description ?? `Travaille une seule compétence : ${node.label.toLocaleLowerCase("fr")}.`,
    pattern: "Observe le repère → explique ton choix → applique-le dans une phrase nouvelle.",
    examples: [
      `Je repère ce qui montre : « ${node.label.toLocaleLowerCase("fr")} ».`,
      "Je vérifie ensuite mon choix dans un nouvel exemple, sans recopier le modèle.",
    ],
    exceptions: [
      "Le sens de la phrase reste prioritaire : une forme ressemblante ne suffit pas.",
      "Une réponse avec indice aide à apprendre, mais seule une réponse autonome confirme la maîtrise.",
    ],
  };
}
