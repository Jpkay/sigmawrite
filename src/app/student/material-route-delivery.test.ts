import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ journal: vi.fn() }));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal', () => ({ journalCurrentStudentPayload: f.journal }));
vi.mock('./repair/[skillKey]/repair-player', () => ({ RepairPlayer: () => null }));
vi.mock('./reference/verbe/verb-search', () => ({ VerbSearch: () => null }));
import RepairPage from './repair/[skillKey]/page';
import VerbIndex from './reference/verbe/page';
import { MICRO_LESSONS } from '@/lib/content/micro-lessons';
import { FREQUENT_VERBS } from '@/lib/conjugation/table';
import { deliveredTextFragments } from '@/lib/diagnostic/granular/delivery-journal';

beforeEach(() => { vi.clearAllMocks(); f.journal.mockResolvedValue(undefined); });
it('records the exact repair payload, including correction text delivered to the browser', async () => {
  const page = await RepairPage({ params: Promise.resolve({ skillKey: 'cause_consequence' }) });
  const payload = f.journal.mock.calls[0][1];
  expect(f.journal.mock.calls[0][0]).toBe('legacy:repair');
  expect(payload.lesson).toBe(page.props.lesson);
  expect(deliveredTextFragments(payload)).toContain(MICRO_LESSONS.cause_consequence.returnToText.explanationFr);
  expect(page.key).toBe('cause_consequence');
});
it('does not interpret inherited object properties as lessons', async () => {
  const page = await RepairPage({ params: Promise.resolve({ skillKey: 'constructor' }) });
  expect(page.props.lesson).toBeNull();
});
it('journals verbs on the index even without opening a conjugation table', async () => {
  await VerbIndex();
  expect(f.journal).toHaveBeenCalledWith('reference:verb-index', { verbs: FREQUENT_VERBS });
});
it('withholds either route payload when recording fails', async () => {
  f.journal.mockRejectedValue(Error('journal unavailable'));
  await expect(RepairPage({ params: Promise.resolve({ skillKey: 'cause_consequence' }) })).rejects.toThrow('journal unavailable');
  await expect(VerbIndex()).rejects.toThrow('journal unavailable');
});
