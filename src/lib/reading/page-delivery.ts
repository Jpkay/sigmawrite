import 'server-only';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {createClient, isSupabaseConfigured} from '@/lib/supabase/server';
import {getCurrentStudentId, getStudentStateData} from '@/lib/db/student';
import {getPublishedReadingText} from '@/lib/db/content';
import {requireStudentAccessAuthorized} from '@/lib/diagnostic/access';
import {journalStudentPayload} from '@/lib/diagnostic/granular/server-delivery-journal';
import {SEED_TEXT_BY_ID} from '@/lib/content/texts';
import {MICRO_LESSONS} from '@/lib/content/micro-lessons';
import {selectNextStep} from '@/lib/scoring/adaptive';

/** Select and record server-side. The browser receives one passage and its
 * corrections, not the bundled sample passage and repair catalogues. */
export async function loadReadingPagePayload(rawTextKey: string, results = false) {
  const textKey = z.string().min(1).max(100).parse(rawTextKey);
  const defaultStep = {href: '/student/lessons', label: 'Mes leçons'};
  if (!isSupabaseConfigured) {
    const text = Object.hasOwn(SEED_TEXT_BY_ID, textKey) ? SEED_TEXT_BY_ID[textKey] : null;
    return {text, nextStep: defaultStep};
  }
  await requireRole(['student']);
  const db = await createClient();
  const studentId = await getCurrentStudentId(db);
  await requireStudentAccessAuthorized(db, studentId);
  const text = await getPublishedReadingText(textKey, db);
  let nextStep = defaultStep;
  if (results && text) {
    // This snapshot is used for selection only; do not label the entire
    // internal database read as content delivered to the student.
    const state = await getStudentStateData(studentId, db);
    const result = state.sessions.findLast(session => session.textVersionId === textKey);
    if (result) {
      const step = selectNextStep({interests: state.interests,
        currentBand: text.difficultyBand, action: result.recommendedNextAction,
        currentInterest: text.primaryInterest, skills: state.skillEstimates});
      nextStep = step.type === 'repair'
        ? {href: `/student/repair/${step.skillKey}`, label: `Renforcer : ${MICRO_LESSONS[step.skillKey]?.title ?? 'les bases'}`}
        : {href: `/student/read/${step.textId}`, label: result.recommendedNextAction === 'change_topic' ? 'Changer de sujet' : `Lecture suivante (${step.band})`};
    }
  }
  await journalStudentPayload(studentId, results ? 'legacy:reading-results-page' : 'legacy:reading-page', results ? {text, nextStep} : {text});
  return {text, nextStep};
}
