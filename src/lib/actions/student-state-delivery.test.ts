import {memoryDisplay} from '@/lib/diagnostic/granular/memory-display';
import {homeFallbackDisplay} from '@/lib/diagnostic/granular/home-recommendation-display';
import {recentReadingDisplay} from '@/lib/diagnostic/granular/recent-reading-copy';
import {legacyDiagnosticResponseDisplay} from '@/lib/diagnostic/granular/legacy-diagnostic-display';
import {beforeEach, expect, it, vi} from 'vitest';
const f = vi.hoisted(() => ({guard: vi.fn(), access: vi.fn(), read: vi.fn(), journal: vi.fn(), completed: vi.fn()}));
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({revalidatePath: vi.fn()}));
vi.mock('@/lib/auth', () => ({requireRole: f.guard}));
vi.mock('@/lib/supabase/server', () => ({createClient: async () => ({}), createServiceClient: () => ({})}));
vi.mock('@/lib/db/student', () => ({getCurrentStudentId: async () => 'authenticated-student', getStudentStateData: f.read}));
vi.mock('@/lib/diagnostic/access', () => ({requireStudentAccessAuthorized: f.access, requireStudentLearningUnlocked: vi.fn()}));
vi.mock('@/lib/diagnostic/completed', () => ({loadCompletedDiagnostic: f.completed}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal', () => ({journalStudentPayload: f.journal}));
import {loadStudentState, startAdaptiveDiagnostic} from './student';

beforeEach(() => {
  vi.resetAllMocks();
  f.read.mockResolvedValue({vocab:{},interests:[],sessions:[],retrievalCards: [{conceptLabel:'Lecture',promptFr: 'Que font les chevaux ?'}]});
  f.journal.mockImplementation(async (_owner, _boundary, payload) => payload);
  f.completed.mockResolvedValue({
    runId: 'existing-run',
    isPilot: false,
    frontier: {report:{mastered:['a'],fragile:[],missing:[],unknown:[],readyToLearn:[],blockers:[]},labels:{}},
    learningPath: {id:'path',stepCount:0,sectionCounts:{},firstSteps:[]},
  });
});

it('records state both on initial load and when returning an already completed diagnostic', async () => {
  const state = await loadStudentState();
  const result = await startAdaptiveDiagnostic({});
  expect(result).toMatchObject({done: true, runId: 'existing-run', state});
  expect(f.journal).toHaveBeenCalledTimes(3);
  expect(f.journal).toHaveBeenNthCalledWith(2, 'authenticated-student', 'legacy:student-state', {...state,memoryDisplay:memoryDisplay(state),recentReading:recentReadingDisplay(state.sessions),homeFallback:homeFallbackDisplay(state.interests)});
  expect(f.journal).toHaveBeenLastCalledWith('authenticated-student', 'legacy:diagnostic-start', {result,display:legacyDiagnosticResponseDisplay(result)});
});

it('does not return the completed diagnostic snapshot if its material cannot be recorded', async () => {
  f.journal.mockRejectedValue(Error('journal unavailable'));
  await expect(startAdaptiveDiagnostic({})).rejects.toThrow('journal unavailable');
});

it('withholds a completed diagnostic when its legacy result projection cannot be recorded', async () => {
  f.journal
    .mockImplementationOnce(async (_owner, _boundary, payload) => payload)
    .mockRejectedValueOnce(Error('diagnostic capture unavailable'));
  await expect(startAdaptiveDiagnostic({})).rejects.toThrow('diagnostic capture unavailable');
  expect(f.journal).toHaveBeenNthCalledWith(2, 'authenticated-student', 'legacy:diagnostic-start', expect.objectContaining({
    display: expect.objectContaining({kind:'completed'}),
  }));
});

it.each(['role', 'access'])('rejects a failed %s check before reading or recording state', async (check) => {
  (check === 'role' ? f.guard : f.access).mockRejectedValue(Error('not authorized'));
  await expect(loadStudentState()).rejects.toThrow('not authorized');
  await expect(startAdaptiveDiagnostic({})).rejects.toThrow('not authorized');
  expect(f.read).not.toHaveBeenCalled();
  expect(f.completed).not.toHaveBeenCalled();
  expect(f.journal).not.toHaveBeenCalled();
});
