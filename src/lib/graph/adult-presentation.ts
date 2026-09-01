import type { NodeClass } from "@/lib/diagnostic/report";
import type { StudentGraphView } from "./presentation";

export type AdultGraphAudience = "parent" | "teacher";
export type AdultGraphLanguage = "fr" | "en";

const STATUS_LABELS: Record<AdultGraphLanguage, Record<AdultGraphAudience, Record<NodeClass, string>>> = {
  fr: {
    parent: { mastered: "Acquis", fragile: "En consolidation", missing: "À construire", unknown: "À vérifier" },
    teacher: { mastered: "Maîtrisé", fragile: "Fragile", missing: "Manquant", unknown: "Non vérifié" },
  },
  en: {
    parent: { mastered: "Secure", fragile: "Consolidating", missing: "To build", unknown: "To check" },
    teacher: { mastered: "Mastered", fragile: "Fragile", missing: "Missing", unknown: "Unverified" },
  },
};

export function adultGraphStatusLabel(classification: NodeClass, audience: AdultGraphAudience, language: AdultGraphLanguage) {
  return STATUS_LABELS[language][audience][classification];
}

export function adultGraphConfidenceLabel(uncertainty: number, language: AdultGraphLanguage) {
  if (language === "en") return uncertainty <= 0.2 ? "Strong evidence" : uncertainty <= 0.45 ? "Developing evidence" : "Limited evidence";
  return uncertainty <= 0.2 ? "Preuves solides" : uncertainty <= 0.45 ? "Preuves en développement" : "Preuves limitées";
}

export function adultGraphSummary(view: StudentGraphView) {
  return {
    strengths: view.nodes.filter((node) => node.classification === "mastered").length,
    consolidating: view.nodes.filter((node) => node.classification === "fragile").length,
    foundations: view.nodes.filter((node) => node.classification === "missing").length,
    ready: view.nodes.filter((node) => node.isReadyToLearn).length,
    pathSteps: view.nodes.filter((node) => node.path).length,
  };
}
