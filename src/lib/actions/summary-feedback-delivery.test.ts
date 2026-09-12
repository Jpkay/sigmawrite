import {beforeEach, expect, it, vi} from 'vitest';
const f = vi.hoisted(() => ({guard: vi.fn(), journal: vi.fn(), from: vi.fn(), persist: vi.fn(), evaluate: vi.fn(), eq: vi.fn(), evaluations: [] as Record<string, unknown>[]}));
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({revalidatePath: vi.fn()}));
vi.mock('@/lib/auth', () => ({requireRole: f.guard}));
vi.mock('@/lib/supabase/server', () => ({createClient: async () => ({from: f.from, rpc: async () => ({data: {allowed: true}})}), createServiceClient: () => ({from: f.from})}));
vi.mock('@/lib/db/student', () => ({getCurrentStudentId: async () => 'owner'}));
vi.mock('@/lib/diagnostic/access', () => ({requireStudentAccessAuthorized: async () => {}, requireStudentLearningUnlocked: async () => {}}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal', () => ({journalStudentPayload: f.journal}));
vi.mock('@/lib/safety/moderate-input', () => ({moderateStudentText: async () => ({allowed: true})}));
vi.mock('@/lib/db/content', () => ({getPublishedReadingText: async () => ({body: ['Un récit.'], concepts: []})}));
vi.mock('@/lib/db/ai', () => ({getActivePrompt: async () => ({promptText: 'instructions'})}));
vi.mock('@/lib/writing/evaluate', () => ({evaluateWriting: f.evaluate}));
import {loadWritingFeedback, reviseSummary, loadStudentRecueil, submitSummary} from './student';
const evaluation = {segments: ['Les chevaux galopent.'], annotations: [{message: 'Écris « chevaux ».', replacements: ['chevaux']}], rubric: {score: 60, rubric: {language: 60}}, revisionPlan: [], degraded: true};
beforeEach(() => {
  vi.resetAllMocks();
  f.evaluations = [{revision_number: 0, submitted_text: 'Mon premier résumé.', rubric: {feedback: 'Observe les accords.'}}];
  f.evaluate.mockResolvedValue(evaluation);
  f.journal.mockImplementation(async (_owner, _boundary, payload) => payload);
  f.persist.mockResolvedValue({error: null});
  f.from.mockImplementation((table: string) => {
    const data = table === 'texts' ? {id: 'text'} : table === 'text_versions' ? {id: 'version'} : table === 'reading_sessions' ? {id: 'session'} : table === 'student_summaries' ? {id: 'summary', summary_text: 'Mon premier résumé.', teacher_score: {score: 7, commentFr: 'Compare cheval et chevaux.'}} : table === 'writing_evaluations' ? f.evaluations : [];
    const q: Record<string, unknown> = {};
    for (const method of ['select', 'in', 'not', 'order', 'limit', 'gte']) q[method] = () => q;
    q.eq = (...args: unknown[]) => {f.eq(table, ...args); return q;};
    q.single = q.maybeSingle = async () => ({data});
    q.then = (resolve: (value: unknown) => unknown) => Promise.resolve({data}).then(resolve);
    q.upsert = table === 'student_summaries' ? () => q : f.persist;
    q.update = () => q;
    return q;
  });
});
it('captures saved corrections, original text and teacher comments under the authenticated owner', async () => {
  const result = await loadWritingFeedback({textKey: 'story', studentId: 'forged'});
  expect(result?.teacherScore?.commentFr).toBe('Compare cheval et chevaux.');
  expect(f.eq).toHaveBeenCalledWith('reading_sessions', 'student_id', 'owner');
  expect(f.journal).toHaveBeenCalledWith('owner', 'legacy:summary-feedback-history', result);
});
it('captures only the new revision feedback, before saving that revision', async () => {
  expect(await reviseSummary({textKey: 'story', revisedText: 'Les chevaux galopent.'})).toBe(evaluation);
  expect(f.journal).toHaveBeenCalledTimes(1);
  expect(f.journal).toHaveBeenCalledWith('owner', 'legacy:summary-feedback', evaluation);
  expect(f.journal.mock.invocationCallOrder[0]).toBeLessThan(f.persist.mock.invocationCallOrder[0]);
});
it('leaves the revision unsaved when capture fails, so the same revision can be submitted again', async () => {
  f.journal.mockRejectedValueOnce(Error('capture unavailable'));
  await expect(reviseSummary({textKey: 'story', revisedText: 'Les chevaux galopent.'})).rejects.toThrow('capture unavailable');
  expect(f.persist).not.toHaveBeenCalled();
  expect(await reviseSummary({textKey: 'story', revisedText: 'Les chevaux galopent.'})).toBe(evaluation);
  expect(f.persist).toHaveBeenCalledWith(expect.objectContaining({revision_number: 1}), expect.anything());
});
it('withholds saved feedback if capture fails', async () => {
  f.journal.mockRejectedValue(Error('capture unavailable'));
  await expect(loadWritingFeedback({textKey: 'story'})).rejects.toThrow('capture unavailable');
});
it('records the text returned for the printable collection', async () => {
  f.evaluations = [{id: 'evaluation', student_summary_id: 'summary', submitted_text: 'Les chevaux galopent.', revision_number: 1, rubric: {score: 60}, created_at: '2026-09-12T10:00:00Z'}];
  const result = await loadStudentRecueil({});
  expect(result.entries[0].text).toBe('Les chevaux galopent.');
  expect(f.journal).toHaveBeenCalledWith('owner', 'legacy:recueil', result);
});
it('rejects unauthorized reads before querying or recording content', async () => {
  f.guard.mockRejectedValue(Error('unauthorized'));
  await expect(loadWritingFeedback({textKey: 'story'})).rejects.toThrow('unauthorized');
  expect(f.from).not.toHaveBeenCalled(); expect(f.journal).not.toHaveBeenCalled();
});

it('captures exactly the rubric returned by initial summary submission', async () => {
  const result = await submitSummary({sessionId: '11111111-1111-4111-8111-111111111111', textKey: 'story', summaryText: 'Les chevaux galopent.'});
  expect(result.evaluation).toBe(evaluation.rubric);
  expect(f.journal).toHaveBeenCalledTimes(1);
  expect(f.journal).toHaveBeenCalledWith('owner', 'legacy:summary-feedback', evaluation.rubric);
});
