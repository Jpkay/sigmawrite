import { describe,it,expect } from 'vitest';
import { decidePassageAutomation,type AutomatedEvidence } from './policy';
import { runGenerationPipeline } from '@/lib/ai/pipeline';
import { MockAIProvider } from '@/lib/ai/mock';
import { scoreTextDifficulty } from '@/lib/scoring/text-difficulty';
import { paragraphsFromText } from '@/lib/content/text-format';
async function fixture(){
 const c=await runGenerationPipeline({language:'fr',studentGrade:6,targetReadingBand:'B1',topic:'arbres',primaryInterest:'nature',knowledgeDomains:[],targetConcepts:[],textType:'expository',wordCountTarget:150,maxAverageSentenceLength:20,maxNewAcademicWords:5,targetVocabulary:[],targetSkills:[],avoid:[],tone:'curious_explainer'},{provider:new MockAIProvider()});
 c.generated.body=Array(20).fill('Un arbre pousse dans le jardin. Ses feuilles reçoivent la lumière du soleil.').join(' ');
 c.generated.factualClaims=[];c.generated.knowledgeConcepts=[];c.generated.targetVocabulary=[];
 c.generated.questions=[{questionText:'Où pousse cet arbre ?',questionType:'literal',answerFormat:'multiple_choice',choices:['Dans le jardin.','Dans la maison.'],correctAnswer:'Dans le jardin.',skillIds:[],difficulty:20}];
 c.input.wordCountTarget=260;c.input.targetReadingBand=scoreTextDifficulty(paragraphsFromText(c.generated.body)).band;
 const e:AutomatedEvidence={generatorModel:'z-ai/glm-5.2',evaluatorModel:'openai/gpt-5.4-mini',moderationPassed:true,grammarIssueCount:0,duplicateChecked:true,nearDuplicate:false,judgment:{risk:'low',naturalness:.95,ageAppropriate:true,factualGroundingSufficient:true,concerns:[],questions:[{index:0,correct:true,unambiguous:true,supportedByPassage:true,reason:'Supported'}]}};
 return {c,e};
}
describe('selective passage approval',()=>{
 it('passes a supported low-risk MCQ without human review',async()=>{const{c,e}=await fixture();expect(decidePassageAutomation(c,e).decision).toBe('pass');});
 it('rejects unsafe content even when other checks pass',async()=>{const{c,e}=await fixture();e.moderationPassed=false;expect(decidePassageAutomation(c,e).decision).toBe('reject');});
 it('does not allow the generator to independently approve itself via an alias',async()=>{const{c,e}=await fixture();e.evaluatorModel='GLM-5.2:free';expect(decidePassageAutomation(c,e).reasons).toContain('independent_evaluator_required');});
 it('holds ambiguous choices and wrong answer keys',async()=>{const{c,e}=await fixture();c.generated.questions[0].choices!.push('Dans le jardin.');expect(decidePassageAutomation(c,e).reasons).toContain('answer_key_invalid');e.judgment.questions[0].correct=false;expect(decidePassageAutomation(c,e).reasons).toContain('question_qa_failed');});
 it('holds missing or duplicated evaluator judgments',async()=>{const{c,e}=await fixture();e.judgment.questions=[];expect(decidePassageAutomation(c,e).decision).toBe('human_review');});
 it('holds uncertain grounding, grammar errors and unavailable duplicate checks',async()=>{const{c,e}=await fixture();e.judgment.factualGroundingSufficient=false;e.grammarIssueCount=1;e.duplicateChecked=false;expect(decidePassageAutomation(c,e).reasons).toEqual(expect.arrayContaining(['grounding_requires_editor','grammar_requires_editor','duplicate_gate']));});
 it('holds formats outside the calibrated scope',async()=>{const{c,e}=await fixture();c.generated.questions[0].answerFormat='short_answer';expect(decidePassageAutomation(c,e).reasons).toContain('format_not_calibrated');});
 it('samples deterministically and never makes sampling a publication gate',async()=>{const{c,e}=await fixture();expect(decidePassageAutomation(c,e,100)).toMatchObject({decision:'pass',sampled:true});expect(decidePassageAutomation(c,e,0)).toMatchObject({decision:'pass',sampled:false});expect(decidePassageAutomation(c,e)).toEqual(decidePassageAutomation(c,e));});
});
