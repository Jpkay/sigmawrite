import {expect,it} from "vitest";
import {parseMaterialReceipt} from "./material-receipt";
const word=`word:sha256:${"a".repeat(64)}`,sentence=`sentence:sha256:${"b".repeat(64)}`;
it("keeps missing receipts unknown and separates first-recorded from already seen",()=>{
 expect(parseMaterialReceipt([],[word])).toBeNull();
 expect(parseMaterialReceipt([{material_key:word,first_recorded_exposure:false},{material_key:sentence,first_recorded_exposure:true}],[word,sentence])).toEqual({firstRecordedKeys:[sentence],previouslySeenKeys:[word]});
});
it("rejects partial, extra, duplicate or malformed receipt data",()=>{
 const row={material_key:word,first_recorded_exposure:true};
 expect(()=>parseMaterialReceipt([row],[word,sentence])).toThrow(/match/);
 expect(()=>parseMaterialReceipt([row],[])).toThrow(/match/);
 expect(()=>parseMaterialReceipt([row,row],[word])).toThrow(/match/);
 expect(()=>parseMaterialReceipt([{...row,first_recorded_exposure:"true"}],[word])).toThrow();
 expect(()=>parseMaterialReceipt([{...row,material_key:"unhashed"}],[word])).toThrow();
});
