import {beforeEach, expect, it, vi} from 'vitest';
const f = vi.hoisted(() => ({configured: true, guard: vi.fn(), access: vi.fn(), text: vi.fn(), state: vi.fn(), journal: vi.fn()}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth', () => ({requireRole: f.guard}));
vi.mock('@/lib/supabase/server', () => ({get isSupabaseConfigured() {return f.configured;}, createClient: async () => ({})}));
vi.mock('@/lib/db/student', () => ({getCurrentStudentId: async () => 'owner', getStudentStateData: f.state}));
vi.mock('@/lib/db/content', () => ({getPublishedReadingText: f.text}));
vi.mock('@/lib/diagnostic/access', () => ({requireStudentAccessAuthorized: f.access}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal', () => ({journalStudentPayload: f.journal}));
import {loadReadingPagePayload} from './page-delivery';
import {SEED_TEXT_BY_ID} from '@/lib/content/texts';
import {deliveredTextFragments} from '@/lib/diagnostic/granular/delivery-journal';
const text = SEED_TEXT_BY_ID['football-migration'];
beforeEach(() => {
  vi.resetAllMocks(); f.configured = true;
  f.text.mockResolvedValue(text);
  f.state.mockResolvedValue({sessions: [{textVersionId: 'football-migration', recommendedNextAction: 'foundation_repair'}], interests: ['football'], skillEstimates: {cause_consequence: {ability: 10, uncertainty: 1, evidenceCount: 3}}});
});
it('records exactly the selected reading payload, including its supplied corrections', async () => {
  const result = await loadReadingPagePayload('football-migration');
  expect(result.text).toBe(text);
  expect(f.journal).toHaveBeenCalledWith('owner', 'legacy:reading-page', {text});
  const fragments = deliveredTextFragments(f.journal.mock.calls[0][2]);
  expect(fragments).toContain(text.questions[0].explanationFr);
  expect(f.state).not.toHaveBeenCalled();
});
it('computes the existing repair recommendation on the server and journals its delivered label', async () => {
  const result = await loadReadingPagePayload('football-migration', true);
  expect(result.nextStep.href).toBe('/student/repair/cause_consequence');
  expect(result.nextStep.label).toMatch(/^Renforcer : /);
  expect(f.journal).toHaveBeenCalledWith('owner', 'legacy:reading-results-page', result);
  expect(f.journal.mock.calls[0][2]).not.toHaveProperty('state');
});
it('does not replace a failed or empty server response with a bundled sample', async () => {
  f.text.mockRejectedValueOnce(Error('database unavailable'));
  await expect(loadReadingPagePayload('football-migration')).rejects.toThrow('database unavailable');
  expect(f.journal).not.toHaveBeenCalled();
  f.text.mockResolvedValueOnce(null);
  expect((await loadReadingPagePayload('football-migration')).text).toBeNull();
});
it.each([false, true])('withholds the selected route payload on journal failure (results=%s)', async results => {
  f.journal.mockRejectedValue(Error('journal unavailable'));
  await expect(loadReadingPagePayload('football-migration', results)).rejects.toThrow('journal unavailable');
});
it.each(['role', 'access'])('rejects a failed %s check before selecting material', async check => {
  (check === 'role' ? f.guard : f.access).mockRejectedValue(Error('unauthorized'));
  await expect(loadReadingPagePayload('football-migration', true)).rejects.toThrow('unauthorized');
  expect(f.text).not.toHaveBeenCalled(); expect(f.state).not.toHaveBeenCalled(); expect(f.journal).not.toHaveBeenCalled();
});
it('retains keyless local sample rendering without accepting inherited property names', async () => {
  f.configured = false;
  expect((await loadReadingPagePayload('football-migration')).text).toBe(text);
  expect((await loadReadingPagePayload('constructor')).text).toBeNull();
  expect(f.guard).not.toHaveBeenCalled(); expect(f.journal).not.toHaveBeenCalled();
});
