import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { createClient, type User } from "@supabase/supabase-js";
import {
  DIAGNOSTIC_ITEM_BANK_RELEASE_KEY,
  DIAGNOSTIC_TAXONOMY_RELEASE_KEY,
} from "../src/lib/diagnostic/protocol";

const envFile = process.env.DEMO_ENV_FILE ?? ".env.staging";
if (existsSync(envFile)) loadEnv({ path: envFile, quiet: true });

const DEMO = {
  organizationId: "10000000-0000-4000-8000-000000000001",
  schoolId: "10000000-0000-4000-8000-000000000002",
  classId: "10000000-0000-4000-8000-000000000003",
  learningGoalId: "10000000-0000-4000-8000-000000000004",
  organizationName: "Organisation Démo Plume",
  schoolName: "Collège Démo",
  className: "5e A",
  accounts: {
    student: {
      email: "demo.eleve@reading-to-learn.test",
      displayName: "Camille Démo",
      role: "student",
    },
    parent: {
      email: "parent.demo@reading-to-learn.test",
      displayName: "Parent Démo",
      role: "parent",
    },
    teacher: {
      email: "prof.demo@reading-to-learn.test",
      displayName: "Mme Martin",
      role: "teacher",
    },
    admin: {
      email: "admin.demo@reading-to-learn.test",
      displayName: "Admin Démo",
      role: "platform_admin",
    },
  },
} as const;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable requise absente : ${name}`);
  return value;
}

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
const password = process.env.DEMO_ACCOUNT_PASSWORD ?? "Demo-2026-Strong!";
const url = new URL(supabaseUrl);
const isLocal = ["127.0.0.1", "localhost"].includes(url.hostname);

if (!isLocal) {
  const expectedRef = required("SUPABASE_PROJECT_REF");
  const actualRef = url.hostname.split(".")[0];
  if (expectedRef !== actualRef) {
    throw new Error(
      `Refus d'écrire : SUPABASE_PROJECT_REF (${expectedRef}) ne correspond pas à l'URL (${actualRef}).`
    );
  }
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function fail(context: string, error: unknown): never {
  const detail = error instanceof Error ? error.message : JSON.stringify(error);
  throw new Error(`${context}: ${detail}`);
}

async function findUser(email: string): Promise<User | null> {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(`Impossible de lire les utilisateurs (${email})`, error);
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) return null;
  }
}

async function ensureUser(account: (typeof DEMO.accounts)[keyof typeof DEMO.accounts]) {
  const existing = await findUser(account.email);
  const attributes = {
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: { role: account.role, display_name: account.displayName },
  };

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, attributes);
    if (error) fail(`Impossible de mettre à jour ${account.email}`, error);
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser(attributes);
  if (error) fail(`Impossible de créer ${account.email}`, error);
  return data.user;
}

async function ensureProfile(user: User, account: (typeof DEMO.accounts)[keyof typeof DEMO.accounts]) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        auth_user_id: user.id,
        role: account.role,
        display_name: account.displayName,
        username: account.email.split("@", 1)[0],
        preferred_language: "fr",
      },
      { onConflict: "auth_user_id" }
    )
    .select("id")
    .single();
  if (error) fail(`Impossible de préparer le profil ${account.email}`, error);
  return data.id as string;
}

function isoDaysAgo(days: number, hourOffset = 0): string {
  return new Date(Date.now() - days * 86_400_000 + hourOffset * 3_600_000).toISOString();
}

function demoLearningState(studentId: string) {
  const firstStarted = isoDaysAgo(4, -1);
  const firstCompleted = isoDaysAgo(4);
  const secondStarted = isoDaysAgo(1, -1);
  const secondCompleted = isoDaysAgo(1);

  return {
    onboarded: true,
    grade: 7,
    frenchBackground: "bilingual",
    interests: ["football", "social_media", "science"],
    diagnostic: {
      studentId,
      overallReadingBand: { minGrade: 7, maxGrade: 7.5, confidence: "medium" },
      textTypeEstimates: { narrative: 68, expository: 72, argumentative: 58, sourceBased: 55 },
      skillEstimates: {
        literalComprehension: 76,
        inference: 54,
        vocabularyInContext: 69,
        sentenceParsing: 61,
        summary: 57,
        argumentStructure: 45,
        academicConnectors: 49,
      },
      recommendedStartingLevel: "Secondary 7A",
      foundationGaps: ["argument_structure", "academic_connectors"],
    },
    sessions: [
      {
        studentId,
        textVersionId: "football-migration",
        startedAt: firstStarted,
        completedAt: firstCompleted,
        abandoned: false,
        successRate: 0.8,
        literalScore: 1,
        inferenceScore: 0.7,
        vocabularyScore: 0.8,
        summaryScore: 0.72,
        retrievalScore: 0.75,
        timeOnTaskSeconds: 840,
        hintsUsed: 1,
        targetSuccessZone: { min: 0.8, max: 0.85 },
        recommendedNextAction: "maintain",
      },
      {
        studentId,
        textVersionId: "social-media-attention",
        startedAt: secondStarted,
        completedAt: secondCompleted,
        abandoned: false,
        successRate: 0.86,
        literalScore: 1,
        inferenceScore: 0.8,
        vocabularyScore: 0.9,
        summaryScore: 0.78,
        retrievalScore: 0.82,
        timeOnTaskSeconds: 780,
        hintsUsed: 0,
        targetSuccessZone: { min: 0.8, max: 0.85 },
        recommendedNextAction: "increase_difficulty",
      },
    ],
    answersByText: {
      "football-migration": { q1: 0, q2: 1, q3: 2, q4: 1, q5: 1 },
      "social-media-attention": { q1: 1, q2: 1, q3: 1, q4: 2, q5: 1 },
    },
    skillEstimates: {
      literal_comprehension: { ability: 76, uncertainty: 24, evidenceCount: 8 },
      inference: { ability: 54, uncertainty: 38, evidenceCount: 6 },
      vocabulary_in_context: { ability: 69, uncertainty: 29, evidenceCount: 7 },
      summarization: { ability: 57, uncertainty: 42, evidenceCount: 3 },
      academic_connectors: { ability: 46, uncertainty: 48, evidenceCount: 2 },
    },
    retrievalCards: [
      {
        id: "demo-card-migration",
        conceptLabel: "Migration",
        promptFr: "Avec tes mots, qu'est-ce que la migration ?",
        keywords: ["déplacement", "personnes", "lieu"],
        sourceTextId: "football-migration",
        intervalDays: 3,
        ease: 2.5,
        repetitions: 1,
        dueAt: isoDaysAgo(-1),
        lastResult: "good",
      },
      {
        id: "demo-card-biais",
        conceptLabel: "Biais",
        promptFr: "Qu'est-ce qu'un biais dans un fil d'actualité ?",
        keywords: ["jugement", "contenu", "réaction"],
        sourceTextId: "social-media-attention",
        intervalDays: 1,
        ease: 2.3,
        repetitions: 0,
        dueAt: isoDaysAgo(0),
      },
    ],
    vocab: {
      migration: { exposures: 2, lastSeenAt: firstCompleted },
      opportunité: { exposures: 2, lastSeenAt: firstCompleted },
      biais: { exposures: 2, lastSeenAt: secondCompleted },
      "esprit critique": { exposures: 1, lastSeenAt: secondCompleted },
    },
  };
}

async function seedRelationalLearningData(studentId: string) {
  const state = demoLearningState(studentId);
  const cleanups = [
    "retrieval_cards",
    "reading_sessions",
    "diagnostic_results",
    "student_reading_estimates",
    "student_skill_estimates",
    "student_word_mastery",
  ] as const;
  for (const table of cleanups) {
    const { error } = await supabase.from(table).delete().eq("student_id", studentId);
    if (error) fail(`Impossible de réinitialiser ${table}`, error);
  }

  const { data: texts, error: textsError } = await supabase
    .from("texts")
    .select("id,slug,versions:text_versions(id,version_number)")
    .in("slug", ["football-migration", "social-media-attention"]);
  if (textsError) fail("Impossible de lire les textes démo", textsError);
  const versionByKey = new Map<string, string>();
  for (const text of texts ?? []) {
    const versions = Array.isArray(text.versions) ? text.versions : [text.versions];
    const version = versions.find((item) => item?.version_number === 1);
    if (text.slug && version?.id) versionByKey.set(text.slug, version.id);
  }
  if (versionByKey.size !== 2) throw new Error("Les textes relationnels démo sont absents.");

  const diagnosticId = "31000000-0000-4000-8000-000000000001";
  const { error: diagnosticError } = await supabase.from("diagnostic_results").insert({
    id: diagnosticId,
    student_id: studentId,
    grade_min: state.diagnostic.overallReadingBand.minGrade,
    grade_max: state.diagnostic.overallReadingBand.maxGrade,
    confidence: state.diagnostic.overallReadingBand.confidence,
    recommended_starting_level: state.diagnostic.recommendedStartingLevel,
    narrative_estimate: state.diagnostic.textTypeEstimates.narrative,
    expository_estimate: state.diagnostic.textTypeEstimates.expository,
    argumentative_estimate: state.diagnostic.textTypeEstimates.argumentative,
    source_based_estimate: state.diagnostic.textTypeEstimates.sourceBased,
    summary_text: "Les arbres rafraîchissent les quartiers et les rendent plus agréables en été.",
    completed_at: isoDaysAgo(6),
  });
  if (diagnosticError) fail("Impossible de créer le diagnostic démo", diagnosticError);

  const skillKeyMap = {
    literalComprehension: "literal_comprehension",
    inference: "inference",
    vocabularyInContext: "vocabulary_in_context",
    sentenceParsing: "sentence_parsing",
    summary: "summarization",
    argumentStructure: "argument_structure",
    academicConnectors: "academic_connectors",
  } as const;
  const allSkillKeys = [...new Set([
    ...Object.values(skillKeyMap),
    ...Object.keys(state.skillEstimates),
  ])];
  const { data: skills, error: skillsError } = await supabase.from("skills").select("id,key").in("key", allSkillKeys);
  if (skillsError) fail("Impossible de lire les compétences", skillsError);
  const skillIdByKey = new Map((skills ?? []).map((row) => [row.key as string, row.id as string]));
  const diagnosticSkills = Object.entries(skillKeyMap).flatMap(([resultKey, skillKey]) => {
    const skillId = skillIdByKey.get(skillKey);
    const ability = state.diagnostic.skillEstimates[resultKey as keyof typeof state.diagnostic.skillEstimates];
    return skillId ? [{ diagnostic_result_id: diagnosticId, skill_id: skillId, ability, is_foundation_gap: ability < 50 }] : [];
  });
  const { error: diagnosticSkillsError } = await supabase.from("diagnostic_skill_results").insert(diagnosticSkills);
  if (diagnosticSkillsError) fail("Impossible de créer les compétences du diagnostic", diagnosticSkillsError);

  const { error: readingEstimateError } = await supabase.from("student_reading_estimates").insert({
    id: "31100000-0000-4000-8000-000000000001",
    student_id: studentId,
    estimate_type: "diagnostic",
    grade_min: state.diagnostic.overallReadingBand.minGrade,
    grade_max: state.diagnostic.overallReadingBand.maxGrade,
    confidence: state.diagnostic.overallReadingBand.confidence,
    evidence_count: 1,
    created_at: isoDaysAgo(6),
  });
  if (readingEstimateError) fail("Impossible de créer l'estimation de lecture", readingEstimateError);

  const sessionIds = [
    "32000000-0000-4000-8000-000000000001",
    "32000000-0000-4000-8000-000000000002",
  ];
  const sessionRows = state.sessions.map((session, index) => ({
    id: sessionIds[index],
    student_id: studentId,
    text_version_id: versionByKey.get(session.textVersionId),
    started_at: session.startedAt,
    completed_at: session.completedAt,
    abandoned: session.abandoned,
    success_rate: session.successRate,
    literal_score: session.literalScore,
    inference_score: session.inferenceScore,
    vocabulary_score: session.vocabularyScore,
    summary_score: session.summaryScore,
    retrieval_score: session.retrievalScore,
    time_on_task_seconds: session.timeOnTaskSeconds,
    hints_used: session.hintsUsed,
    recommended_next_action: session.recommendedNextAction,
  }));
  const { error: sessionsError } = await supabase.from("reading_sessions").insert(sessionRows);
  if (sessionsError) fail("Impossible de créer les séances démo", sessionsError);

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id,text_version_id,question_key,choices:question_choices(id,choice_index,is_correct)")
    .in("text_version_id", [...versionByKey.values()]);
  if (questionsError) fail("Impossible de lire les questions démo", questionsError);
  const answerRows: Array<Record<string, unknown>> = [];
  state.sessions.forEach((session, sessionIndex) => {
    const versionId = versionByKey.get(session.textVersionId);
    const answers = state.answersByText[session.textVersionId];
    for (const [questionKey, choiceIndex] of Object.entries(answers)) {
      const question = (questions ?? []).find((row) => row.text_version_id === versionId && row.question_key === questionKey);
      const choices = question ? (Array.isArray(question.choices) ? question.choices : [question.choices]) : [];
      const choice = choices.find((row) => row?.choice_index === choiceIndex);
      if (question && choice) answerRows.push({
        session_id: sessionIds[sessionIndex],
        question_id: question.id,
        selected_choice_id: choice.id,
        is_correct: choice.is_correct,
        score: choice.is_correct ? 1 : 0,
      });
    }
  });
  const { error: answersError } = await supabase.from("student_answers").insert(answerRows);
  if (answersError) fail("Impossible de créer les réponses démo", answersError);
  const { error: summariesError } = await supabase.from("student_summaries").insert([
    { id: "32100000-0000-4000-8000-000000000001", session_id: sessionIds[0], summary_text: "De jeunes joueurs migrent pour trouver de meilleures possibilités, mais leur départ comporte aussi des risques.", ai_score: { score: 72 } },
    { id: "32100000-0000-4000-8000-000000000002", session_id: sessionIds[1], summary_text: "Les applications captent l'attention pour montrer davantage de publicité. Comprendre leurs techniques aide à garder un esprit critique.", ai_score: { score: 78 } },
  ]);
  if (summariesError) fail("Impossible de créer les résumés démo", summariesError);

  const estimateRows = Object.entries(state.skillEstimates).flatMap(([key, estimate]) => {
    const skillId = skillIdByKey.get(key);
    return skillId ? [{ student_id: studentId, skill_id: skillId, ability: estimate.ability, uncertainty: estimate.uncertainty, evidence_count: estimate.evidenceCount, last_evidence_at: isoDaysAgo(1) }] : [];
  });
  const { error: estimateError } = await supabase.from("student_skill_estimates").insert(estimateRows);
  if (estimateError) fail("Impossible de créer les estimations de compétence", estimateError);

  const cardIds = [
    "33000000-0000-4000-8000-000000000001",
    "33000000-0000-4000-8000-000000000002",
  ];
  const cardRows = state.retrievalCards.map((card, index) => ({
    id: cardIds[index],
    student_id: studentId,
    source_session_id: sessionIds[index],
    source_text_version_id: versionByKey.get(card.sourceTextId),
    card_type: "concept",
    prompt_fr: card.promptFr,
    rubric: { keywords: card.keywords, concept_label: card.conceptLabel, source_text_key: card.sourceTextId },
    created_at: state.sessions[index].completedAt,
  }));
  const { error: cardsError } = await supabase.from("retrieval_cards").insert(cardRows);
  if (cardsError) fail("Impossible de créer les cartes démo", cardsError);
  const scheduleRows = state.retrievalCards.map((card, index) => ({
    id: `33100000-0000-4000-8000-00000000000${index + 1}`,
    retrieval_card_id: cardIds[index],
    due_at: card.dueAt,
    interval_days: card.intervalDays,
    ease_factor: card.ease,
    repetitions: card.repetitions,
    last_result: card.lastResult ?? null,
    status: "due",
  }));
  const { error: schedulesError } = await supabase.from("retrieval_schedules").insert(scheduleRows);
  if (schedulesError) fail("Impossible de créer les programmes de révision", schedulesError);
  const { error: attemptsError } = await supabase.from("retrieval_attempts").insert({
    id: "33200000-0000-4000-8000-000000000001",
    retrieval_card_id: cardIds[0],
    student_id: studentId,
    answer_text: "La migration est le déplacement de personnes vers un autre lieu.",
    score: 0.8,
    result: "good",
    attempted_at: isoDaysAgo(4),
  });
  if (attemptsError) fail("Impossible de créer la tentative de révision", attemptsError);

  const vocabWords = Object.keys(state.vocab);
  const { data: vocabulary, error: vocabularyError } = await supabase.from("vocabulary_items").select("id,display_word").in("display_word", vocabWords);
  if (vocabularyError) fail("Impossible de lire le vocabulaire", vocabularyError);
  const masteryRows = (vocabulary ?? []).map((item) => ({
    student_id: studentId,
    vocabulary_item_id: item.id,
    mastery: Math.min(1, state.vocab[item.display_word].exposures / 5),
    exposures: state.vocab[item.display_word].exposures,
    last_seen_at: state.vocab[item.display_word].lastSeenAt,
  }));
  const { error: masteryError } = await supabase.from("student_word_mastery").insert(masteryRows);
  if (masteryError) fail("Impossible de créer la maîtrise du vocabulaire", masteryError);
}

async function ensureInternalDiagnosticPilotEnrollment(studentId: string, adminProfileId: string) {
  const [setting, taxonomy, bank] = await Promise.all([
    supabase.from("diagnostic_pilot_settings").select("enabled").eq("singleton", true).maybeSingle(),
    supabase.from("taxonomy_releases").select("id").eq("release_key", DIAGNOSTIC_TAXONOMY_RELEASE_KEY).in("status", ["validating", "published"]).maybeSingle(),
    supabase.from("diagnostic_item_bank_releases").select("id,taxonomy_release_id").eq("bank_key", DIAGNOSTIC_ITEM_BANK_RELEASE_KEY).in("status", ["draft", "validating"]).maybeSingle(),
  ]);
  if (setting.error || taxonomy.error || bank.error) {
    fail("Impossible de vérifier le pilote diagnostique démo", setting.error ?? taxonomy.error ?? bank.error);
  }
  if (!setting.data?.enabled || !taxonomy.data || !bank.data || bank.data.taxonomy_release_id !== taxonomy.data.id) return;

  const { data: existing, error: existingError } = await supabase
    .from("diagnostic_pilot_enrollments")
    .select("id,cohort_kind")
    .eq("student_id", studentId)
    .eq("active", true)
    .maybeSingle();
  if (existingError) fail("Impossible de vérifier l'inscription pilote démo", existingError);
  if (existing?.cohort_kind === "feedback_participant") return;

  const enrollment = {
    student_id: studentId,
    taxonomy_release_id: taxonomy.data.id,
    bank_release_id: bank.data.id,
    active: true,
    expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    enrolled_by: adminProfileId,
    revoked_at: null,
    note: "Compte de test interne créé par le seed démo.",
    cohort_kind: "internal_test",
    feedback_agreement_source: null,
    feedback_agreement_version: null,
    feedback_agreed_at: null,
  };
  const write = existing
    ? await supabase.from("diagnostic_pilot_enrollments").update(enrollment).eq("id", existing.id)
    : await supabase.from("diagnostic_pilot_enrollments").insert(enrollment);
  if (write.error) fail("Impossible de créer l'inscription pilote démo", write.error);
}

async function main() {
  const users = {
    student: await ensureUser(DEMO.accounts.student),
    parent: await ensureUser(DEMO.accounts.parent),
    teacher: await ensureUser(DEMO.accounts.teacher),
    admin: await ensureUser(DEMO.accounts.admin),
  };

  const profiles = {
    student: await ensureProfile(users.student, DEMO.accounts.student),
    parent: await ensureProfile(users.parent, DEMO.accounts.parent),
    teacher: await ensureProfile(users.teacher, DEMO.accounts.teacher),
    admin: await ensureProfile(users.admin, DEMO.accounts.admin),
  };

  const { error: organizationError } = await supabase.from("organizations").upsert({
    id: DEMO.organizationId,
    name: DEMO.organizationName,
    type: "internal",
  });
  if (organizationError) fail("Impossible de préparer l'organisation", organizationError);

  const { error: schoolError } = await supabase.from("schools").upsert({
    id: DEMO.schoolId,
    organization_id: DEMO.organizationId,
    name: DEMO.schoolName,
    country: "France",
    city: "Lyon",
    curriculum_type: "Collège français",
  });
  if (schoolError) fail("Impossible de préparer l'établissement", schoolError);

  const { error: classError } = await supabase.from("classes").upsert({
    id: DEMO.classId,
    school_id: DEMO.schoolId,
    name: DEMO.className,
    grade_level: 7,
    academic_year: "2026-2027",
    join_code: "DEMO5EA",
  });
  if (classError) fail("Impossible de préparer la classe", classError);

  let { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profiles.student)
    .maybeSingle();
  if (studentError) fail("Impossible de lire l'élève démo", studentError);

  if (!student) {
    const inserted = await supabase
      .from("students")
      .insert({ profile_id: profiles.student, display_name: DEMO.accounts.student.displayName })
      .select("id")
      .single();
    if (inserted.error) fail("Impossible de créer l'élève démo", inserted.error);
    student = inserted.data;
  }

  const studentId = student.id as string;
  const { error: studentUpdateError } = await supabase
    .from("students")
    .update({
      school_id: DEMO.schoolId,
      current_grade: 7,
      french_background: "bilingual",
      date_of_birth: "2013-04-18",
      display_name: DEMO.accounts.student.displayName,
      onboarding_completed_at: isoDaysAgo(10),
    })
    .eq("id", studentId);
  if (studentUpdateError) fail("Impossible de remplir les données d'apprentissage", studentUpdateError);

  const writes = await Promise.all([
    supabase.from("student_guardians").upsert({
      student_id: studentId,
      guardian_profile_id: profiles.parent,
      relationship: "parent",
    }),
    supabase.from("teacher_classes").upsert({
      teacher_profile_id: profiles.teacher,
      class_id: DEMO.classId,
    }),
    supabase.from("enrollments").upsert({
      student_id: studentId,
      class_id: DEMO.classId,
      status: "active",
    }),
    supabase.from("student_interests").upsert(
      [
        { student_id: studentId, interest_key: "football", declared_strength: 1 },
        { student_id: studentId, interest_key: "social_media", declared_strength: 0.9 },
        { student_id: studentId, interest_key: "science", declared_strength: 0.7 },
      ],
      { onConflict: "student_id,interest_key" }
    ),
    supabase.from("learner_profiles").upsert({ student_id: studentId, student_type: "bilingual", home_language: "français", exposure: "school", updated_at: new Date().toISOString() }, { onConflict: "student_id" }),
    supabase.from("learning_goals").upsert({ id: DEMO.learningGoalId, student_id: studentId, goal_type: "catch_up", target_framework: "native_grade", target_level: "7", target_grade: 7, scope: { strands: ["grammaire_syntaxe", "conjugaison", "orthographe_grammaticale", "comprehension_ecrite", "expression_ecrite"], modalities: ["reading", "writing", "grammar_analysis"], mastery_threshold: 0.85 }, status: "active" }, { onConflict: "id" }),
  ]);
  writes.forEach(({ error }, index) => {
    if (error) fail(`Impossible de créer une liaison démo (${index + 1})`, error);
  });

  const { data: existingJoinCode, error: joinCodeReadError } = await supabase
    .from("class_join_codes")
    .select("id")
    .eq("code", "DEMO5EA")
    .maybeSingle();
  if (joinCodeReadError) fail("Impossible de vérifier le code de classe démo", joinCodeReadError);
  const joinCodePayload = {
    code: "DEMO5EA",
    class_id: DEMO.classId,
    expires_at: "2030-08-31T23:59:59.000Z",
    max_uses: 200,
    school_consent_enabled: true,
    created_by_profile_id: profiles.teacher,
    revoked_at: null,
  };
  const joinCodeWrite = existingJoinCode
    ? await supabase.from("class_join_codes").update(joinCodePayload).eq("id", existingJoinCode.id)
    : await supabase.from("class_join_codes").insert(joinCodePayload);
  if (joinCodeWrite.error) fail("Impossible de préparer le code de classe démo", joinCodeWrite.error);

  const { data: consent, error: consentReadError } = await supabase
    .from("consent_records")
    .select("id")
    .eq("student_id", studentId)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();
  if (consentReadError) fail("Impossible de vérifier le consentement", consentReadError);
  if (!consent) {
    const { error } = await supabase.from("consent_records").insert({
      student_id: studentId,
      guardian_profile_id: profiles.parent,
      consent_type: "guardian",
      consent_version: "demo-v1",
      privacy_policy_version: "demo-v1",
    });
    if (error) fail("Impossible de créer le consentement démo", error);
  }

  await ensureInternalDiagnosticPilotEnrollment(studentId, profiles.admin);
  await seedRelationalLearningData(studentId);

  console.log(`Données démo prêtes sur ${isLocal ? "Supabase local" : url.hostname}.`);
  console.log(`Classe : ${DEMO.schoolName} / ${DEMO.className}`);
  Object.values(DEMO.accounts).forEach((account) => console.log(`${account.role}: ${account.email}`));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
