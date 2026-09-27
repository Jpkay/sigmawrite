import {expect,it,vi} from "vitest";
import {recordPracticeMaterialDelivery} from "./practice-material-delivery";
import {materialIdentity} from "./material-identity";
type Practice=Parameters<typeof recordPracticeMaterialDelivery>[2];
function fixture(){
 const practice:Practice={node:{id:"node",key:"key",label:"Accord",description:null,strand:"grammar"},scaffoldLevel:0,
  lesson:{family:"grammar",eyebrow:"Leçon",explanation:"Observe.",pattern:"Sujet et verbe",examples:["Les chevaux courent."],exceptions:[],materialExposure:{words:[{lemma:"cheval",form:"chevaux"}]}},
  items:[{id:"item",promptFr:"Complète.",instructionsFr:null,responseType:"short_answer",validatorType:"exact",validatorConfig:{materialExposure:{words:[{lemma:"cheval",form:"chevaux"},{lemma:"courir",form:"courent"}]}},correctAnswer:"chevaux",acceptableAnswers:[],difficulty:1,predictedSuccess:.8,choices:[{id:"choice",text:"chevaux",feedbackFr:"Les chevaux courent."}]}]};
 const recordMaterialPresentation=vi.fn(async()=>{});
 return {practice,store:{recordMaterialPresentation},record:recordMaterialPresentation};
}
it("records lesson, answer and feedback material before delivery with stable retries",async()=>{
 const f=fixture();await recordPracticeMaterialDelivery(f.store,"student-a",f.practice);
 expect(f.record).toHaveBeenCalledTimes(2);
 expect(f.record.mock.calls[1]).toEqual([expect.objectContaining({studentId:"student-a",materialKeys:[materialIdentity("word","cheval"),materialIdentity("word","courir")].sort()})]);
 f.practice.items[0].predictedSuccess=.9;f.practice.scaffoldLevel=2;
 await recordPracticeMaterialDelivery(f.store,"student-a",f.practice);
 expect(f.record.mock.calls[0]).toEqual(f.record.mock.calls[2]);
 expect(f.record.mock.calls[1]).toEqual(f.record.mock.calls[3]);
});
it("separates learners and changed source versions",async()=>{
 const f=fixture();await recordPracticeMaterialDelivery(f.store,"student-a",f.practice);
 await recordPracticeMaterialDelivery(f.store,"student-b",f.practice);
 expect(f.record.mock.calls[0]).not.toEqual(f.record.mock.calls[2]);
 f.practice.lesson.explanation="Vérifie le sujet.";
 await recordPracticeMaterialDelivery(f.store,"student-a",f.practice);
 expect(f.record.mock.calls[0]).not.toEqual(f.record.mock.calls[4]);
});
it("withholds delivery on write failure and validates all annotations first",async()=>{
 const f=fixture();f.record.mockRejectedValueOnce(Error("database unavailable"));
 await expect(recordPracticeMaterialDelivery(f.store,"student-a",f.practice)).rejects.toThrow("database unavailable");
 f.record.mockClear();f.practice.items[0].validatorConfig={materialExposure:{words:[{lemma:"chat",form:"chats"}]}};
 await expect(recordPracticeMaterialDelivery(f.store,"student-a",f.practice)).rejects.toThrow(/anchored/);
 expect(f.record).not.toHaveBeenCalled();
});
it("does not invent exposure coverage for unannotated legacy content",async()=>{
 const f=fixture();delete f.practice.lesson.materialExposure;f.practice.items[0].validatorConfig=null;
 await recordPracticeMaterialDelivery(f.store,"student-a",f.practice);
 expect(f.record).not.toHaveBeenCalled();
});
it('journals unannotated legacy explanations, options and feedback without certifying novelty',async()=>{
 const f=fixture(),recordDeliveredText=vi.fn(async()=>{});
 delete f.practice.lesson.materialExposure;f.practice.items[0].validatorConfig=null;
 await recordPracticeMaterialDelivery({...f.store,recordDeliveredText},'student-a',f.practice);
 expect(f.record).not.toHaveBeenCalled();
 expect(recordDeliveredText).toHaveBeenCalledWith(expect.objectContaining({studentId:'student-a',boundary:'legacy:practice',textFragments:expect.arrayContaining(['Observe.','Les chevaux courent.','chevaux','Accord'])}));
});
