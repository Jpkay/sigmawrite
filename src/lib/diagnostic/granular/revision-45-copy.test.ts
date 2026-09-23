import {expect,it} from "vitest";
import type {EvidenceSkill} from "./v3-adapter";
import {revision45SkillCopy,revision45TeachingCopy} from "./revision-45-copy";

const skill=(nodeKey:string,labelFr:string):EvidenceSkill=>({id:`${nodeKey}::reading-receptive`,nodeKey,evidenceKey:"reading-receptive",labelFr,domain:"conjugation",branch:"conjugation",level:0,prerequisites:[],modes:["recognition"]});

it("replaces only the selected student-facing skill labels",()=>{
 const input=[skill("distinguer_personne_nombre","Identifier les traits de personne-nombre"),skill("produire_futur_proche","Produire le futur proche — aller"),skill("choisir_auxiliaire_compose","Choisir l'auxiliaire d'un temps composé — Verbe pronominal"),skill("advanced_unchanged","Analyse avancée")];
 const output=revision45SkillCopy(input);
 expect(output.map(row=>row.labelFr)).toEqual(["Choisir la forme du verbe qui va avec le sujet","Écrire ce qui va se passer avec aller et un autre verbe — aller","Choisir avoir ou être pour conjuguer avec deux mots — avec se ou s’","Analyse avancée"]);
 expect(input.map(row=>row.labelFr)).toEqual(["Identifier les traits de personne-nombre","Produire le futur proche — aller","Choisir l'auxiliaire d'un temps composé — Verbe pronominal","Analyse avancée"]);
});

it("rewrites selected authored lesson titles without changing their bindings",()=>{
 const input=[{id:"relative",nodeKey:"construction_subordonnee_relative",titleFr:"Repérer une proposition relative"},{id:"advanced",nodeKey:"advanced",titleFr:"Analyse avancée"}];
 expect(revision45TeachingCopy(input)).toEqual([{...input[0],titleFr:"Repérer les mots qui précisent un nom"},input[1]]);
 expect(input[0].titleFr).toBe("Repérer une proposition relative");
});
