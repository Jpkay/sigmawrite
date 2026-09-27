import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({journal:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalCurrentStudentPayload:f.journal}));
vi.mock('./onboarding-client',()=>({default:()=>null}));
import Page from './page';
import {onboardingPayload,onboardingDisplayText} from './onboarding-copy';
import {INTERESTS} from '@/lib/content/interests';
import {deliveredTextFragments} from '@/lib/diagnostic/granular/delivery-journal';
beforeEach(()=>vi.resetAllMocks());
it('captures display copy before releasing both onboarding steps',async()=>{
 let release!:()=>void;f.journal.mockReturnValue(new Promise<void>(resolve=>{release=resolve;}));
 let returned=false;const pending=Page().then(value=>{returned=true;return value;});
 await Promise.resolve();expect(returned).toBe(false);release();
 const page=await pending;expect(page.props.payload).toBe(onboardingPayload);
 expect(f.journal).toHaveBeenCalledWith('student:onboarding-copy',onboardingDisplayText);
 const fragments=deliveredTextFragments(onboardingDisplayText);
 for(const interest of INTERESTS){expect(fragments).toContain(interest.labelFr);expect(onboardingPayload.interests.find(i=>i.key===interest.key)?.labelFr).toBe(interest.labelFr);}
 expect(fragments).toContain('Mangas');expect(fragments).toContain('À la maison');expect(fragments).toContain('À l’école, dans plusieurs matières');
 expect(fragments).not.toContain('french_first_language');expect(fragments).not.toContain('media_literacy');
 expect(onboardingPayload.grades.map(g=>g.value)).toEqual([5,6,7,8,9,10,11,12]);
});
it('withholds onboarding when authenticated capture fails',async()=>{
 f.journal.mockRejectedValue(Error('capture unavailable'));
 await expect(Page()).rejects.toThrow('capture unavailable');
});
