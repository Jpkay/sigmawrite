/** Disposable native HTTP integration only. Actual store/services and grading;
 * synthetic content and accelerated server clock, not a browser/action test. */
import { strict as assert } from "node:assert";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAssessmentStore } from "../store";
import { publicAssessmentView, runAssessmentCommand } from "../service";
import { runTeachingCommand } from "../teaching-service";
import { runLearningCheckCommand } from "../learning-service";
import { recordMaterialDelivery } from "../material-delivery";

export async function runNativeServiceJourney(admin: SupabaseClient, first: SupabaseClient, second: SupabaseClient, studentId: string) {
  const store = new SupabaseAssessmentStore(admin);
  const started = await store.start(studentId, "full-graph-synthetic-test");
  assert.ok(started, "Normal release validation must accept the isolated full-graph fixture");
  let at = Date.now(), view = publicAssessmentView(started.session, started.bundle, at);
  const accept = async (result: { error?: string; conflict?: boolean; view?: ReturnType<typeof publicAssessmentView> }) => {
    assert.ok(!("error" in result), JSON.stringify("error" in result ? result.error : null));
    assert.ok(!("conflict" in result), "Unexpected revision conflict");
    assert.ok(result.view);
    view = result.view;
    await recordMaterialDelivery(store, studentId, result);
  };
  const assessment = async (command: Record<string, unknown>) => {
    await accept(await runAssessmentCommand(store, studentId, { sessionId: view.sessionId, revision: view.revision, ...command }, () => at));
  };
  await recordMaterialDelivery(store, studentId, { view });
  await assessment({ type: "resume" });
  for (let index = 0; index < 60; index++) {
    const question = view.question;
    assert.ok(question);
    at += 30_000;
    const answer = question.responseType === "mcq" ? question.choices.find(choice => choice.text === "fixture")!.id : "fixture";
    // A struggling profile supplies enough repeated evidence for teaching,
    // with occasional correct responses and a skip. Never submit a grade.
    await assessment(index === 3 ? { type: "skip", itemId: question.id } : {
      type: "answer", itemId: question.id,
      answer: index % 6 !== 5 ? (question.choices.find(choice => choice.text !== "fixture")?.id ?? "incorrect") : answer,
      ...(question.supportChoices?.length ? { supportChoiceId: question.supportChoices[0].id } : {}),
    });
  }
  await assessment({ type: "pause" });
  const paused = await store.load(studentId, view.sessionId);
  assert.ok(paused);
  at += 24 * 60 * 60 * 1000;
  await assessment({ type: "resume" });
  assert.equal((await store.load(studentId, view.sessionId))!.state.activeSeconds, paused.state.activeSeconds);
  for (let count = 0; view.phase === "assessing" && count < 80; count++) {
    at += 30_000;
    await assessment({ type: "pulse" });
  }
  assert.equal(view.phase, "learning");
  assert.equal((await store.load(studentId, view.sessionId))!.state.completionReason, "time_budget");
  assert.ok(view.learningActivities.length);
  console.log("HTTP-backed services reached saved provisional results after answers, pause/resume and accelerated 35-minute handoff.");
  const own = await first.from("granular_assessment_sessions").select("id").eq("id", view.sessionId);
  assert.equal(own.error?.code, "42501", "Raw state is server-only, even for its owner");
  const other = await second.from("granular_assessment_sessions").select("id").eq("id", view.sessionId);
  assert.equal(other.error?.code, "42501");
  const instruction = view.learningActivities.find(activity => activity.activityId.startsWith("teach:"));
  assert.ok(instruction, "Results must recommend an actual lesson");
  const teach = async (command: Record<string, unknown>) => accept(await runTeachingCommand(store, studentId, { sessionId: view.sessionId, revision: view.revision, ...command }));
  await teach({ type: "start_teaching", activityId: instruction.activityId });
  await teach({ type: "begin_practice" });
  const teaching = (await store.load(studentId, view.sessionId))!.state.teaching!;
  const lesson = started.bundle.teachingContent!.find(content => content.id === teaching.contentId)!;
  await teach({ type: "answer_practice", exerciseId: lesson.practice[0].id, answer: "fixture" });
  await teach({ type: "next_exercise" });
  assert.equal((await store.load(studentId, view.sessionId))!.state.refinements.length, 0, "Guided practice cannot add independent evidence");
  const check = view.learningActivities.find(activity => activity.kind === "independent_check" && activity.skillId === instruction.skillId);
  assert.ok(check, "Completed teaching must lead to a fresh check");
  await accept(await runLearningCheckCommand(store, studentId, { type: "start_check", activityId: check.activityId, sessionId: view.sessionId, revision: view.revision }, () => at));
  const issued = view.learningCheck!;
  assert.ok(issued.question);
  const answer = issued.question.responseType === "mcq" ? issued.question.choices.find(choice => choice.text === "fixture")!.id : "fixture";
  await accept(await runLearningCheckCommand(store, studentId, { type: "answer_check", checkId: issued.id, answer, sessionId: view.sessionId, revision: view.revision,
    ...(issued.question.supportChoices?.length ? { supportChoiceId: issued.question.supportChoices[0].id } : {}),
  }, () => at));
  const saved = (await store.load(studentId, view.sessionId))!;
  assert.equal(saved.state.refinements.length, 1);
  assert.equal(saved.state.refinements[0].itemId, issued.question.id);
  assert.ok(!saved.state.observations.some(item => item.itemId === issued.question!.id));
  console.log("HTTP-backed lesson, guided practice and fresh independent check passed; evidence persisted and other-student access denied. Browser/server-action journey remains untested.");
}
