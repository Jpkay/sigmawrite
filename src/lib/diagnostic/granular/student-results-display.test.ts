import {expect,it} from "vitest";
import {studentActivityTitle,studentResultSummary,studentSkillTitle} from "./student-results-display";

it("keeps demonstrated, needs-work, partial and untested results separate",()=>{
 const results=[{status:"mastered" as const},{status:"missing" as const},{status:"fragile" as const},{status:"uncertain" as const},{status:"unknown" as const}];
 const before=structuredClone(results);
 expect(studentResultSummary(results)).toEqual({mastered:1,needsWork:2,checking:1,notChecked:1});
 expect(results).toEqual(before);
});

it("uses plain display titles without changing the source activity",()=>{
 const activity={action:"verify" as const,titleFr:"Vérifier Reconnaître le futur simple"};
 expect(studentActivityTitle(activity)).toBe("Question : repérer le futur simple");
 expect(studentActivityTitle({action:"learn",skillId:"construction_phrase_canonique::recognition",titleFr:"Repérer l’ordre d’une phrase simple"})).toBe("Leçon : construire une phrase simple");
 expect(studentActivityTitle({action:"consolidate",skillId:"choisir_auxiliaire::production",titleFr:"Choisir la forme qui convient"})).toBe("Entraînement : choisir entre avoir et être");
 expect(studentActivityTitle({action:"verify",skillId:"reconnaitre_radical_terminaison::reading-receptive",titleFr:"Segmenter une forme verbale"})).toBe("Question : trouver le bon verbe");
 expect(studentActivityTitle({action:"verify",skillId:"construction_accord_nom_adjectif::reading-analysis",titleFr:"Analyser l’accord nom-adjectif"})).toBe("Question : accorder correctement un nom et un adjectif");
 expect(studentActivityTitle({action:"verify",skillId:"deduire_mot_definition_locale::all-receptive",titleFr:"Déduire un mot grâce à une définition locale"})).toBe("Question : comprendre le sens d’un mot grâce au contexte");
 expect(studentSkillTitle("Interpréter la valeur du présent")).toBe("Comprendre la valeur du présent");
 expect(activity).toEqual({action:"verify",titleFr:"Vérifier Reconnaître le futur simple"});
});
