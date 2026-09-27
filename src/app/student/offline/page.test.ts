import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({journal:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalCurrentStudentPayload:f.journal}));
import Page from './page';
import {OFFLINE_COPY} from './offline-copy';
beforeEach(()=>vi.resetAllMocks());
it('records the exact offline help before returning the page',async()=>{
 let complete!:()=>void;
 f.journal.mockReturnValue(new Promise<void>(resolve=>{complete=resolve;}));
 let returned=false;
 const pending=Page().then(page=>{returned=true;return page;});
 await Promise.resolve();expect(returned).toBe(false);
 complete();const page=await pending;
 expect(f.journal).toHaveBeenCalledWith('student:offline-copy',OFFLINE_COPY);
 expect(page.props.children[0].props.title).toBe(OFFLINE_COPY.title);
 expect(page.props.children[0].props.description).toBe(OFFLINE_COPY.description);
 const paragraphs=page.props.children[1].props.children.props.children;
 expect(paragraphs.map((p:{props:{children:string}})=>p.props.children)).toEqual([OFFLINE_COPY.connectionRequired,OFFLINE_COPY.reconnect]);
});
it('withholds unrecorded offline help on capture failure',async()=>{
 f.journal.mockRejectedValue(Error('capture unavailable'));
 await expect(Page()).rejects.toThrow('capture unavailable');
});
