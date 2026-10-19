import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({journal:vi.fn(),review:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalCurrentStudentPayload:f.journal}));
vi.mock('@/lib/actions/granular-diagnostic',()=>({getGranularAnswerReview:f.review}));
vi.mock('@/components/diagnostic/answer-review',()=>({DiagnosticAnswerReviewPanel:()=>null}));
import Page from './page';
import {DiagnosticReviewUnavailableError} from '@/lib/diagnostic/granular/answer-review';
beforeEach(()=>vi.resetAllMocks());
it('records missing-session help before showing it without loading a review',async()=>{
 const page=await Page({searchParams:Promise.resolve({})});
 expect(f.journal).toHaveBeenCalledWith('granular:review-missing-session',{message:page.props.children});
 expect(f.review).not.toHaveBeenCalled();
});
it('withholds missing-session help when recording fails',async()=>{
 f.journal.mockRejectedValue(Error('capture unavailable'));
 await expect(Page({searchParams:Promise.resolve({})})).rejects.toThrow('capture unavailable');
});
it('delegates a selected review to the authenticated action and retains its response',async()=>{
 const review={sessionId:'selected',rows:[]};f.review.mockResolvedValue(review);
 const page=await Page({searchParams:Promise.resolve({session:'selected'})});
 expect(f.review).toHaveBeenCalledWith('selected');expect(page.props.review).toBe(review);
 expect(f.journal).not.toHaveBeenCalled();
});
it('shows a recoverable explanation when the original published content is no longer available',async()=>{
 const error=new DiagnosticReviewUnavailableError();f.review.mockRejectedValue(error);
 const page=await Page({searchParams:Promise.resolve({session:'selected'})});
 expect(page.props.children[1].props).toMatchObject({role:'status',children:error.message});
 expect(page.props.children[2].props.href).toBe('/student/diagnostic');
 expect(f.journal).toHaveBeenCalledWith('granular:review-unavailable',expect.objectContaining({message:error.message}));
});
it('does not turn unexpected review or capture failures into an unavailable-content message',async()=>{
 f.review.mockRejectedValue(Error('database unavailable'));
 await expect(Page({searchParams:Promise.resolve({session:'selected'})})).rejects.toThrow('database unavailable');
 expect(f.journal).not.toHaveBeenCalled();
 f.review.mockRejectedValue(new DiagnosticReviewUnavailableError());f.journal.mockRejectedValue(Error('capture unavailable'));
 await expect(Page({searchParams:Promise.resolve({session:'selected'})})).rejects.toThrow('capture unavailable');
});
