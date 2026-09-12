import {memoryDisplay} from './memory-display';
import {homeFallbackDisplay} from './home-recommendation-display';
import {recentReadingDisplay} from './recent-reading-copy';
import {beforeEach, expect, it, vi} from 'vitest';
const f = vi.hoisted(() => ({read: vi.fn(), journal: vi.fn()}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/student', () => ({getStudentStateData: f.read}));
vi.mock('./server-delivery-journal', () => ({journalStudentPayload: f.journal}));
import {getDeliveredStudentState} from './student-state-delivery';

beforeEach(() => {
  vi.resetAllMocks();
  f.journal.mockImplementation(async (_owner, _boundary, payload) => payload);
});

it('records each fresh snapshot, including new memory cards returned after an activity', async () => {
  const first = {interests:[],sessions:[],retrievalCards: [], vocab: {}};
  const updated = {interests:[],sessions:[],retrievalCards: [{conceptLabel:'Lecture',promptFr: 'Pourquoi les chevaux sont-ils partis ?', keywords: ['orage']}], vocab: {chevaux: {exposures: 1}}};
  f.read.mockResolvedValueOnce(first).mockResolvedValueOnce(updated);
  expect(await getDeliveredStudentState('student-a')).toBe(first);
  expect(await getDeliveredStudentState('student-a')).toBe(updated);
  expect(f.journal).toHaveBeenNthCalledWith(1, 'student-a', 'legacy:student-state', {...first,memoryDisplay:memoryDisplay(first),recentReading:recentReadingDisplay([]),homeFallback:homeFallbackDisplay([])});
  expect(f.journal).toHaveBeenNthCalledWith(2, 'student-a', 'legacy:student-state', {...updated,memoryDisplay:memoryDisplay(updated),recentReading:recentReadingDisplay([]),homeFallback:homeFallbackDisplay([])});
});

it('keeps the owner of separate deliveries and forwards the caller database client', async () => {
  const client = {} as NonNullable<Parameters<typeof getDeliveredStudentState>[1]>;
  f.read.mockImplementation(async (owner) => ({vocab:{},interests:[],sessions:[],retrievalCards: [{conceptLabel:'Lecture',promptFr: owner}]}));
  await Promise.all([getDeliveredStudentState('student-a', client), getDeliveredStudentState('student-b', client)]);
  for (const owner of ['student-a', 'student-b']) {
    expect(f.read).toHaveBeenCalledWith(owner, client);
    expect(f.journal).toHaveBeenCalledWith(owner, 'legacy:student-state', {vocab:{},interests:[],sessions:[],retrievalCards: [{conceptLabel:'Lecture',promptFr: owner}],memoryDisplay:memoryDisplay({retrievalCards:[{conceptLabel:'Lecture'}],vocab:{}}),recentReading:recentReadingDisplay([]),homeFallback:homeFallbackDisplay([])});
  }
});

it('withholds fresh material when journaling fails and allows the delivery to be retried', async () => {
  const state = {vocab:{},interests:[],sessions:[],retrievalCards: [{conceptLabel:'Lecture',promptFr: 'Les oiseaux chantent.'}]};
  f.read.mockResolvedValue(state);
  f.journal.mockRejectedValueOnce(Error('journal unavailable'));
  await expect(getDeliveredStudentState('student-a')).rejects.toThrow('journal unavailable');
  expect(await getDeliveredStudentState('student-a')).toBe(state);
  expect(f.read).toHaveBeenCalledTimes(2);
});

it('does not record a successful delivery when the database read fails', async () => {
  f.read.mockRejectedValue(Error('database unavailable'));
  await expect(getDeliveredStudentState('student-a')).rejects.toThrow('database unavailable');
  expect(f.journal).not.toHaveBeenCalled();
});
