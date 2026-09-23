import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {expect,it} from "vitest";
import {StudentResultSummary} from "./student-result-summary";

it("describes untouched graph targets without showing a wall of zeroes or counts",()=>{
 const results=Array.from({length:544},(_,index)=>({status:"unknown" as const,evidence:"untested" as const,label:`Point ${index}`}));
 const html=renderToStaticMarkup(React.createElement(StudentResultSummary,{results}));
 expect(html).toContain("Nous n’avons pas encore assez de réponses pour montrer un point précis.");
 expect(html).toContain("D’autres points n’ont pas encore été vérifiés.");
 expect(html).not.toContain("544");expect(html).not.toContain("Ce que tu sais déjà faire</dt>");
});

it("names partial direct evidence without claiming a confirmed strength or difficulty",()=>{
 const html=renderToStaticMarkup(React.createElement(StudentResultSummary,{results:[{status:"uncertain",evidence:"direct",label:"Comprendre l’idée du texte"}]}));
 expect(html).toContain("Tes réponses donnent déjà des indices.");expect(html).toContain("Comprendre l’idée du texte");
 expect(html).not.toContain("Ce que tu sais déjà faire</dt>");expect(html).not.toContain("Ce que tu peux encore améliorer</dt>");
});

it("names direct strengths and needs but omits untouched target names",()=>{
 const html=renderToStaticMarkup(React.createElement(StudentResultSummary,{results:[
  {status:"mastered",evidence:"direct",label:"Trouver le sujet"},
  {status:"missing",evidence:"direct",label:"Accorder le verbe"},
  {status:"unknown",evidence:"untested",label:"Cible interne non évaluée"},
 ]}));
 expect(html).toContain("Ce que tu sais déjà faire");expect(html).toContain("Trouver le sujet");
 expect(html).toContain("Ce que tu peux encore améliorer");expect(html).toContain("Accorder le verbe");
 expect(html).not.toContain("Cible interne non évaluée");
});
