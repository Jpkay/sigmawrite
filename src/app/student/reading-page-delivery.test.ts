import {beforeEach, expect, it, vi} from 'vitest';
const f = vi.hoisted(() => ({load: vi.fn()}));
vi.mock('@/lib/reading/page-delivery', () => ({loadReadingPagePayload: f.load}));
vi.mock('./read/[sessionId]/reading-player', () => ({ReadingPlayer: () => null}));
vi.mock('./results/[sessionId]/reading-results', () => ({ReadingResults: () => null}));
import ReadingPage from './read/[sessionId]/page';
import ResultsPage from './results/[sessionId]/page';
beforeEach(() => {vi.resetAllMocks(); f.load.mockResolvedValue({text: {id: 'selected'}, nextStep: {href: '/student/lessons', label: 'Mes leçons'}});});
it('passes only recorded material to a reader keyed by the requested text', async () => {
  const first = await ReadingPage({params: Promise.resolve({sessionId: 'first'})});
  const second = await ReadingPage({params: Promise.resolve({sessionId: 'second'})});
  expect(first.key).toBe('first'); expect(second.key).toBe('second');
  expect(first.props).toEqual({textKey: 'first', text: {id: 'selected'}});
});
it('passes the server-selected next activity with the results payload', async () => {
  const page = await ResultsPage({params: Promise.resolve({sessionId: 'selected'})});
  expect(f.load).toHaveBeenCalledWith('selected', true);
  expect(page.key).toBe('selected'); expect(page.props.nextStep.label).toBe('Mes leçons');
});
it('does not render either player after failed capture', async () => {
  f.load.mockRejectedValue(Error('journal unavailable'));
  await expect(ReadingPage({params: Promise.resolve({sessionId: 'selected'})})).rejects.toThrow('journal unavailable');
  await expect(ResultsPage({params: Promise.resolve({sessionId: 'selected'})})).rejects.toThrow('journal unavailable');
});
