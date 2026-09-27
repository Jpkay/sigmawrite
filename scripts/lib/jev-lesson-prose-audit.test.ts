import {mkdir,mkdtemp,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {expect,it} from "vitest";

import {extractLessonProse,lessonProseCacheKey,shouldAuditSharedUiCopy} from "./jev-lesson-prose-audit";

it("excludes accent-pad glyph controls from shared UI prose scoring",()=>{
  expect(shouldAuditSharedUiCopy("DIAGNOSTIC_COPY.exerciseControls.accents[0]")).toBe(false);
  expect(shouldAuditSharedUiCopy("DIAGNOSTIC_COPY.exerciseControls.accents[14]")).toBe(false);
  expect(shouldAuditSharedUiCopy("DIAGNOSTIC_COPY.exerciseControls.checkAnswer")).toBe(true);
  expect(shouldAuditSharedUiCopy("DIAGNOSTIC_COPY.status.fragile")).toBe(true);
});

it("extracts learner-facing lesson prose while excluding examples, answers, and exercise prompts",async()=>{
  const root=await mkdtemp(join(tmpdir(),"jev-lesson-prose-")),dir=join(root,"tmp");
  await mkdir(dir);
  await writeFile(join(dir,"bundle.json"),JSON.stringify({
    releaseId:"release",checksum:"sha256:test",sourceKind:"runtime_validated_published_bundle",
    teachingContent:[{id:"lesson",status:"published_pending_review",titleFr:"Le titre",learnerQuestionFr:"Pourquoi « avoir » change-t-il ?",takeawayFr:"À retenir",boundaryFr:"La limite",
      steps:[{exampleFr:"EXAMPLE_SECRET",explanationFr:"Une explication"}],
      practice:[
        {id:"practice",promptFr:"PROMPT_SECRET",answerFr:"ANSWER_SECRET. ",hintFr:"Un indice",explanationFr:"ANSWER_SECRET. Une correction"},
        {id:"practice-2",promptFr:"Tu ___ le premier.\n\nComplète.",answerFr:"fus",hintFr:"Un autre indice",explanationFr:"Tu fus le premier. La forme attendue est fus."},
      ],
    }],
  }));
  const items=await extractLessonProse(root,"tmp/bundle.json");
  expect(items.map(item=>item.field)).toEqual(["titleFr","learnerQuestionFr","steps[0].explanationFr","takeawayFr","boundaryFr","practice[0].hintFr","practice[0].explanationFr","practice[1].hintFr","practice[1].explanationFr"]);
  expect(items.map(item=>item.auditText).join(" ")).not.toMatch(/EXAMPLE_SECRET|PROMPT_SECRET|ANSWER_SECRET/u);
  expect(items.find(item=>item.field==="practice[0].explanationFr")).toMatchObject({auditText:"Une correction",excludedTaskText:"ANSWER_SECRET."});
  expect(items.find(item=>item.field==="practice[1].explanationFr")).toMatchObject({auditText:"La forme attendue est « … ».",excludedTaskText:"Tu fus le premier.\n\nfus"});
  expect(items.find(item=>item.field==="learnerQuestionFr")?.auditText).toBe("Pourquoi « avoir » change-t-il ?");
  expect(items.every(item=>item.sourceStatus.includes("releaseId=release"))).toBe(true);
});

it("includes the field in the cache key and skips answer-only feedback",async()=>{
  const root=await mkdtemp(join(tmpdir(),"jev-lesson-prose-cache-")),dir=join(root,"tmp");
  await mkdir(dir);
  await writeFile(join(dir,"bundle.json"),JSON.stringify({
    releaseId:"release",checksum:"sha256:test",sourceKind:"runtime_validated_published_bundle",
    teachingContent:[{id:"lesson",status:"published_pending_review",titleFr:"Même texte",learnerQuestionFr:"Même texte",takeawayFr:"À retenir",boundaryFr:"La limite",
      steps:[],practice:[
        {id:"practice",promptFr:"Prompt",answerFr:"Réponse",hintFr:"Indice",explanationFr:"Réponse"},
        {id:"practice-2",promptFr:"Prompt",answerFr:"fus",hintFr:"Indice 2",explanationFr:"La confusion est diffuse."},
        {id:"practice-3",promptFr:"Complète : Je ___ prêt.",answerFr:"suis",hintFr:"Indice 3",explanationFr:"Je suis prêt. La forme attendue est suis."},
        {id:"practice-4",promptFr:"Prompt",answerFr:"a",hintFr:"Indice 4",explanationFr:"avec un exemple clair"},
      ],
    }],
  }));
  const items=await extractLessonProse(root,"tmp/bundle.json");
  const title=items.find(item=>item.field==="titleFr")!;
  const question=items.find(item=>item.field==="learnerQuestionFr")!;
  expect(title.auditText).toBe(question.auditText);
  expect(lessonProseCacheKey(title,"jev-latest")).not.toBe(lessonProseCacheKey(question,"jev-latest"));
  expect(lessonProseCacheKey({...title,field:"practice[0].hintFr"},"jev-latest")).toBe(lessonProseCacheKey({...title,field:"practice[3].hintFr"},"jev-latest"));
  expect(items.some(item=>item.field==="practice[0].explanationFr")).toBe(false);
  expect(items.find(item=>item.field==="practice[1].explanationFr")).toMatchObject({auditText:"La confusion est diffuse.",excludedTaskText:null});
  expect(items.find(item=>item.field==="practice[2].explanationFr")).toMatchObject({auditText:"La forme attendue est « … ».",excludedTaskText:"Je suis prêt.\n\nsuis"});
  expect(items.find(item=>item.field==="practice[3].explanationFr")).toMatchObject({auditText:"avec un exemple clair",excludedTaskText:null});
});
