import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({journal:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalCurrentStudentPayload:f.journal}));
vi.mock('./home-client',()=>({default:()=>null}));
import Page from './page';
import {HOME_COPY} from './home-copy';
beforeEach(()=>vi.resetAllMocks());
it('records the same fixed wording before returning the home client',async()=>{
 let done!:()=>void;f.journal.mockReturnValue(new Promise<void>(resolve=>{done=resolve;}));let returned=false;
 const pending=Page().then(page=>{returned=true;return page;});await Promise.resolve();expect(returned).toBe(false);
 done();const page=await pending;expect(page.props.copy).toBe(HOME_COPY);expect(f.journal).toHaveBeenCalledWith('student:home-copy',HOME_COPY);
});
it('withholds the home client when recording fails',async()=>{
 f.journal.mockRejectedValue(Error('capture failed'));await expect(Page()).rejects.toThrow('capture failed');
});
