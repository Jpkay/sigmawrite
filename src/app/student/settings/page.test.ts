import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({journal:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalCurrentStudentPayload:f.journal}));
vi.mock('./settings-client',()=>({StudentSettings:()=>null}));
import Page from './page';
import {settingsCopy} from './settings-copy';
beforeEach(()=>vi.resetAllMocks());
it('withholds the page until the authenticated copy capture completes',async()=>{
 let complete!:()=>void;
 f.journal.mockReturnValue(new Promise<void>(resolve=>{complete=resolve;}));
 let returned=false;
 const pending=Page().then(page=>{returned=true;return page;});
 await Promise.resolve();expect(returned).toBe(false);
 complete();const page=await pending;
 expect(f.journal).toHaveBeenCalledWith('student:settings-copy',settingsCopy);
 expect(page.props.children[1].props).toEqual({copy:settingsCopy});
 expect(page.props.children[0].props.title).toBe(settingsCopy.pageTitle);
});
it('does not release settings when authenticated capture fails',async()=>{
 f.journal.mockRejectedValue(Error('capture unavailable'));
 await expect(Page()).rejects.toThrow('capture unavailable');
});
