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
  f.read.mockResolvedValue({retrievalCards: [{promptFr: 'Que font les chevaux ?'}]});
  f.journal.mockImplementation(async (_owner, _boundary, payload) => payload);
  f.completed.mockResolvedValue({runId: 'existing-run'});
});

it('records state both on initial load and when returning an already completed diagnostic', async () => {
  const state = await loadStudentState();
  const result = await startAdaptiveDiagnostic({});
  expect(result).toMatchObject({done: true, runId: 'existing-run', state});
  expect(f.journal).toHaveBeenCalledTimes(2);
  expect(f.journal).toHaveBeenLastCalledWith('authenticated-student', 'legacy:student-state', state);
});

it('does not return the completed diagnostic snapshot if its material cannot be recorded', async () => {
  f.journal.mockRejectedValue(Error('journal unavailable'));
  await expect(startAdaptiveDiagnostic({})).rejects.toThrow('journal unavailable');
});

it.each(['role', 'access'])('rejects a failed %s check before reading or recording state', async (check) => {
  (check === 'role' ? f.guard : f.access).mockRejectedValue(Error('not authorized'));
  await expect(loadStudentState()).rejects.toThrow('not authorized');
  await expect(startAdaptiveDiagnostic({})).rejects.toThrow('not authorized');
  expect(f.read).not.toHaveBeenCalled();
  expect(f.completed).not.toHaveBeenCalled();
  expect(f.journal).not.toHaveBeenCalled();
});
