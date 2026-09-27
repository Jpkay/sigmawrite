import {expect,it} from "vitest";
import {studentActivityTitle,studentEvidenceCoverageText,studentResultSummary,studentSkillTitle,studentSummaryLabel} from "./student-results-display";

it("names only direct results and reduces hundreds of untouched targets to a gentle flag",()=>{
 const direct=(status:"mastered"|"missing"|"fragile"|"uncertain",label:string)=>({status,evidence:"direct" as const,label});
 const results=[direct("mastered","Repérer le sujet"),direct("missing","Écrire le verbe"),direct("fragile","Accorder les mots"),direct("uncertain","Comprendre le texte"),...Array.from({length:544},(_,index)=>({status:"unknown" as const,evidence:"untested" as const,label:`Point ${index}`}))];
 const before=structuredClone(results);
 expect(studentResultSummary(results)).toEqual({mastered:["Repérer le sujet"],needsWork:["Écrire le verbe","Accorder les mots"],checking:["Comprendre le texte"],hasUnassessed:true,hasConfirmed:true,hasDirect:true});
 expect(results).toEqual(before);
});

it("handles empty and partial results without claiming a strength or difficulty",()=>{
 expect(studentResultSummary([{status:"unknown",evidence:"untested",label:"Point non vu"}])).toEqual({mastered:[],needsWork:[],checking:[],hasUnassessed:true,hasConfirmed:false,hasDirect:false});
 expect(studentResultSummary([{status:"uncertain",evidence:"direct",label:"Point commencé"}])).toEqual({mastered:[],needsWork:[],checking:["Point commencé"],hasUnassessed:false,hasConfirmed:false,hasDirect:true});
 expect(studentResultSummary([{status:"mastered",evidence:"direct",label:"Hors bilan",assessmentAvailable:false}])).toEqual({mastered:[],needsWork:[],checking:[],hasUnassessed:true,hasConfirmed:false,hasDirect:false});
 expect(studentEvidenceCoverageText(1,8)).toBe("1 point vérifié sur 8");
 expect(studentEvidenceCoverageText(3,8)).toBe("3 points vérifiés sur 8");
 expect(studentSummaryLabel("Employer le présent","production")).toBe("Utiliser le présent (écrire)");
 expect(studentSummaryLabel("Choisir le bon petit mot devant un nom","recognition")).toBe("Choisir le bon petit mot devant un nom");
 expect(studentSummaryLabel("Comprendre ce qu’un verbe annonce","recognition")).toBe("Comprendre ce qu’un verbe annonce");
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

it("uses plain pinned-release titles while preserving distinct facets",()=>{
 expect(studentSkillTitle("Analyser l’accord déterminant-nom")).toBe("Choisir le bon petit mot devant un nom");
 expect(studentSkillTitle("Identifier les traits de personne-nombre")).toBe("Choisir le mot qui peut remplacer le sujet");
 expect(studentSkillTitle("Analyser l’accord nom-adjectif")).toBe("Choisir la bonne forme du nom et de l’adjectif");
 expect(studentSkillTitle("Reconnaître une subordonnée relative")).toBe("Repérer les mots qui ajoutent une précision sur un nom");
 const codTitles=[
  "Accorder le participe passé avec un COD antéposé — Absence de COD",
  "Accorder le participe passé avec un COD antéposé — COD placé après",
  "Accorder le participe passé avec un COD antéposé — COD placé avant",
 ].map(studentSkillTitle);
 expect(codTitles).toEqual([
  "Choisir la bonne forme du verbe avec avoir — Aucun mot à reprendre",
  "Choisir la bonne forme du verbe avec avoir — Mot à reprendre placé après",
  "Choisir la bonne forme du verbe avec avoir — Mot à reprendre placé avant",
 ]);
 expect(new Set(codTitles)).toHaveLength(3);
});
