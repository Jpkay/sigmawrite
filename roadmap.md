# PRD: "Reading to Learn"

## 1. Product summary

### Working name

**Reading to Learn**

### Tagline

**Learn to love reading while reading to learn.**

### One-sentence description

A personalized French academic reading platform that helps secondary students improve comprehension, vocabulary, memory, and school knowledge by reading texts matched to their interests, reading level, and learning zone.

### Product category

This is not just a reading app. It is a:

> **secondary academic reading + knowledge acquisition engine**

It combines:

* adaptive reading
* interest-led content
* academic knowledge transfer
* spaced retrieval
* foundation repair
* progress proof for parents and teachers

### Core product thesis

Traditional classroom reading instruction is constrained by one-to-many teaching. This product gives each student individualized reading practice at the right level, on topics they care about, with immediate feedback, memory reinforcement, and micro-remediation.

The product aligns with the idea of **disciplinary literacy**, where reading and academic language are not only the responsibility of language teachers but are central to science, history, geography, art, and other subjects. The Education Endowment Foundation's secondary literacy guidance specifically emphasizes vocabulary, reading, writing, talk, disciplinary literacy, and support for struggling students across subject areas. ([EEF][1])

---

# 2. Product vision

## Long-term vision

Build the **Math Academy for academic reading and knowledge acquisition**.

Students should not only become better French readers. They should become better independent learners because they can read, understand, remember, and transfer knowledge from texts.

## Product philosophy

The app should help students:

1. **Read more** because the topic is interesting.
2. **Read better** because the text is at the right level.
3. **Learn more** because texts transfer knowledge from school subjects.
4. **Remember more** because concepts return through retrieval.
5. **Recover foundations** because weak prerequisites are detected and repaired.
6. **Build confidence** because the student succeeds roughly 80–85% of the time.

## What makes the product different

Most reading apps are either:

* early literacy apps,
* digital book libraries,
* generic AI story generators,
* language-learning apps,
* or school comprehension exercise platforms.

This app should be different because it is:

> **secondary-first, interest-led, assessment-aware, memory-based, and knowledge-transfer driven.**

---

# 3. Target users

## Primary student segment

Students in:

* Grade 7
* Grade 8
* Grade 9

This should be the initial focus.

## Secondary student segments

Later expansion:

* Grade 10–12
* Grade 5–6 students with advanced readiness
* Grade 5–6 students who need foundation repair before secondary school
* bilingual students
* French-as-second-language students
* Francophone African students
* international school students
* diaspora students trying to maintain academic French

## Adult users

### Parents

They want proof that the child is improving.

They care about:

* reading level
* confidence
* school performance
* vocabulary
* comprehension
* exam readiness
* whether the app is credible

### Teachers

They want:

* class overview
* skill gaps
* grouping recommendations
* student reading evidence
* progress by domain
* low-prep assignments
* actionable reports

### School administrators

They want:

* learning impact
* implementation simplicity
* privacy/security
* teacher adoption
* parent satisfaction
* measurable progress

### Tutors / learning centers

They want:

* diagnostic reports
* assigned reading paths
* parent-facing progress evidence
* practice between tutoring sessions

---

# 4. Problem statement

## The student problem

Many secondary students can technically read French, but they cannot comfortably learn from dense academic texts.

They struggle with:

* long sentences
* abstract vocabulary
* academic connectors
* implicit meaning
* inference
* summarization
* argument structure
* science/history/geography texts
* remembering what they read
* reading stamina
* transferring knowledge from one topic to another

The result:

> They can "read words," but they cannot reliably **read to learn**.

## The parent problem

Parents often do not know whether their child is genuinely improving.

They see:

* vague school feedback
* marks without diagnosis
* "needs to read more"
* app progress bars that do not feel credible

They need evidence like:

* what the child can read comfortably
* what is still too hard
* what skills are weak
* what vocabulary is improving
* whether progress is real

## The teacher problem

Teachers cannot personalize every text for every student every day.

In one class, students may differ by several grade levels in reading ability. A teacher may have 20–35 students and one shared text. That makes it hard to provide individualized reading level, topic interest, scaffolding, retrieval, and foundation repair at scale.

---

# 5. Goals and non-goals

## V1 goals

The first product should:

1. Diagnose a student's academic French reading profile.
2. Recommend texts based on interest and ability.
3. Generate or select French texts at controlled difficulty.
4. Test comprehension, vocabulary, inference, and summary.
5. Keep students near an 80–85% success zone.
6. Detect foundation gaps.
7. Trigger micro-remediation.
8. Build memory through spaced retrieval.
9. Show parent/teacher evidence of progress.
10. Collect clean learning data for future calibration.

## V1 non-goals

Do **not** build these first:

* native iOS app
* native Android app
* oral fluency scoring
* unrestricted AI chatbot
* full LMS integrations
* full curriculum coverage for Grade 7–12
* high-stakes placement claims
* dyslexia diagnosis
* student-to-student social features
* open community publishing
* payments/subscriptions in first internal pilot
* complex IRT engine before enough data exists

---

# 6. Product positioning

## Main positioning

> **Personalized French academic reading for secondary students.**

## Stronger positioning

> **Students learn to love reading while reading to learn.**

## More strategic positioning

> **The Math Academy for academic reading: diagnose foundations, personalize practice, and build the knowledge students need for school.**

## What not to say

Avoid:

> "AI stories for kids."

That sounds too shallow.

Avoid:

> "We replace teachers."

That is politically and pedagogically wrong.

Better:

> **Teachers teach. The app personalizes the reading practice, memory work, and foundation repair that teachers rarely have time to provide for every student.**

---

# 7. Core learning model

The app has five learning layers.

## Layer 1: Reading level

The app estimates what kind of French text a student can handle.

It should track reading level by text type:

```txt
narrative
biography
expository
argumentative
source-based
science text
history/geography text
current affairs text
```

A student may be strong in narrative reading but weak in science or argumentative reading.

## Layer 2: Interest

The app tracks what the student cares about.

Examples:

```txt
football
basketball
music
fashion
gaming
cars
medicine
animals
beauty
business
money
crime/mystery
technology
social media
psychology
politics
history
environment
space
food
travel
African history
celebrities
```

The app should learn both:

* declared interests
* revealed interests based on behavior

A student may claim to like science but actually complete more texts about sports, money, and mysteries.

## Layer 3: Knowledge transfer

The app connects interests to academic knowledge.

Example:

| Interest      | Transfer domains                                     |
| ------------- | ---------------------------------------------------- |
| Football      | geography, migration, economics, biology, statistics |
| Fashion       | chemistry, trade, labor, history, sustainability     |
| Gaming        | psychology, logic, storytelling, probability         |
| Music         | poetry, physics of sound, politics, culture          |
| Social media  | media literacy, economics, psychology, argumentation |
| Food          | chemistry, biology, geography, culture               |
| Crime/mystery | law, evidence, ethics, psychology                    |
| Cars          | physics, climate, energy, industry                   |

The student enters through an interest. The product routes them toward knowledge.

## Layer 4: Foundation repair

The app detects missing prerequisites and repairs them.

Foundation skills include:

```txt
literal comprehension
main idea
inference
evidence selection
cause/consequence
compare/contrast
academic connectors
sentence parsing
pronoun/reference tracking
vocabulary in context
summarization
argument structure
disciplinary vocabulary
reading stamina
```

## Layer 5: Memory

The app distinguishes:

### Storage memory

Helping knowledge enter long-term memory through:

* short summaries
* concept cards
* repeated examples
* vocabulary recycling
* visual maps later
* connection prompts

### Retrieval memory

Bringing knowledge back later through:

* same-day retrieval
* next-day retrieval
* 3-day retrieval
* 7-day retrieval
* 21-day retrieval
* 45-day retrieval

EEF's cognitive science review focuses on acquiring and retaining knowledge, and EEF's retrieval practice resources explain retrieval as an active attempt to bring knowledge back into working memory and strengthen later access. ([EEF][2])

---

# 8. Success metrics

## Student activation metrics

```txt
% students completing onboarding
% students completing diagnostic
% students completing first reading session
% students completing 3 sessions in first week
```

## Engagement metrics

```txt
weekly active students
sessions per student per week
average reading minutes per week
text completion rate
abandonment rate
topic re-selection rate
```

## Learning metrics

```txt
average success rate
% sessions in 80–85% learning zone
skill improvement by category
vocabulary retention rate
retrieval success rate
reading band movement
summary score movement
foundation gap closure rate
```

## Parent/teacher trust metrics

```txt
parent report open rate
teacher dashboard weekly usage
teacher assignment creation rate
parent satisfaction score
teacher perceived accuracy score
```

## Business/pilot metrics

```txt
pilot retention
school renewal intent
student weekly usage compliance
teacher recommendation rate
parent willingness to pay
```

---

# 9. Product modules

## Module A: Authentication and roles

### Roles

```txt
student
parent
teacher
school_admin
platform_admin
content_reviewer
```

### Auth requirements

* email/password
* magic link optional
* Google login optional for adults
* student join code for school pilots
* guardian consent flow
* role-based onboarding
* no public student profiles

Supabase Auth supports email/password, magic link, one-time passwords, social login, and SSO, which makes it a good fit for role-based school and parent onboarding. ([Supabase][3])

---

## Module B: Student onboarding

### Goal

Create the initial student profile.

### Flow

1. Student enters class code or parent-created account.
2. Student selects grade.
3. Student selects French background:

```txt
native / school language
bilingual
French second language
returning learner
struggling reader
not sure
```

4. Student selects interests.
5. Student completes reading diagnostic.
6. App creates initial reading profile.
7. App recommends first pathway.

### Output

Example:

```txt
Current academic French reading band: Grade 7.0–7.6
Confidence: medium

Strengths:
- literal comprehension
- reading familiar topics

Needs work:
- inference
- academic connectors
- summary quality

Recommended starting zone:
Grade 7A expository texts, 400–550 words, high-interest topics
```

---

## Module C: Diagnostic assessment

### Purpose

Estimate the student's initial reading ability and identify foundation gaps.

### Diagnostic structure

The diagnostic should take 20–30 minutes.

Sections:

1. Vocabulary in context
2. Sentence comprehension
3. Short paragraph comprehension
4. Expository text
5. Argumentative text
6. Short summary
7. Optional confidence/self-perception questions

### Diagnostic outputs

```ts
type DiagnosticResult = {
  studentId: string;
  overallReadingBand: {
    minGrade: number;
    maxGrade: number;
    confidence: "low" | "medium" | "high";
  };
  textTypeEstimates: {
    narrative: number;
    expository: number;
    argumentative: number;
    sourceBased: number;
  };
  skillEstimates: {
    literalComprehension: number;
    inference: number;
    vocabularyInContext: number;
    sentenceParsing: number;
    summary: number;
    argumentStructure: number;
    academicConnectors: number;
  };
  recommendedStartingLevel: string;
  foundationGaps: string[];
};
```

### Important rule

The diagnostic should not claim medical or clinical accuracy.

It should say:

> "Estimated academic French reading band based on app performance."

Not:

> "Certified reading diagnosis."

---

## Module D: Interest graph

### Purpose

Use student interests to increase reading volume and motivation.

### Interest data

Each interest should have:

```ts
type StudentInterest = {
  studentId: string;
  interestKey: string;
  declaredStrength: number;
  inferredStrength: number;
  sessionsCompleted: number;
  avgCompletionRate: number;
  avgSuccessRate: number;
  avgTimeOnTask: number;
  lastUsedAt: string;
};
```

### Interest behavior rules

If the student repeatedly completes a topic, increase inferred interest.

If the student abandons a topic repeatedly, decrease inferred interest.

If performance is high but engagement is low, keep difficulty but change topic.

If engagement is high but performance is low, keep topic but lower complexity or add scaffolding.

---

## Module E: Knowledge graph

### Purpose

Map interests to serious academic knowledge.

### Knowledge domains

V1 should include:

```txt
history
geography
science
biology
physics
economics
society
technology
media literacy
environment
culture
health
psychology
law/ethics
```

### Knowledge concepts

Examples:

```txt
migration
urbanization
inequality
resources
ecosystem
energy
climate change
trade
industrialization
colonialism
democracy
evidence
bias
opportunity cost
algorithm
public health
nutrition
```

### Knowledge object

```ts
type KnowledgeConcept = {
  id: string;
  labelFr: string;
  labelEn?: string;
  domain: string;
  descriptionFr: string;
  prerequisiteConceptIds: string[];
  relatedConceptIds: string[];
  gradeBandMin: number;
  gradeBandMax: number;
};
```

---

## Module F: Text library

### Text types

V1 should support:

```txt
expository
biography
argumentative
narrative nonfiction
short source-based
```

Later:

```txt
data/chart-based
map-based
historical document analysis
scientific procedure
literary extract
```

### Text object

Every text must have stable versions.

```ts
type Text = {
  id: string;
  canonicalTitle: string;
  topic: string;
  primaryInterest: string;
  primaryDomain: string;
  status: "draft" | "active" | "retired";
  createdAt: string;
  updatedAt: string;
};
```

```ts
type TextVersion = {
  id: string;
  textId: string;
  versionNumber: number;
  title: string;
  body: string;
  language: "fr";
  wordCount: number;
  textType:
    | "expository"
    | "biography"
    | "argumentative"
    | "narrative_nonfiction"
    | "source_based";
  estimatedGradeMin: number;
  estimatedGradeMax: number;
  difficulty: {
    lexical: number;
    syntax: number;
    knowledge: number;
    inference: number;
    stamina: number;
    overall: number;
  };
  targetSkills: string[];
  targetVocabulary: string[];
  concepts: string[];
  generationType: "human" | "ai" | "ai_human_reviewed";
  reviewStatus:
    | "draft"
    | "auto_approved"
    | "human_approved"
    | "rejected"
    | "benchmark_locked";
  sourcePolicy: "generated" | "licensed" | "public_domain" | "original_human";
  createdAt: string;
};
```

### Non-negotiable rule

Student answers must reference `text_version_id`, not only `text_id`.

Otherwise, progress reports become unreproducible after content edits.

---

## Module G: Text difficulty engine

### Purpose

The app must know whether a text is easier or harder than previous texts.

GenAI should not decide difficulty alone.

The correct architecture is:

```txt
GenAI writes.
Scoring engine judges.
Student data recalibrates.
```

### Difficulty dimensions

Each text receives separate scores:

```txt
lexical difficulty
syntax difficulty
knowledge difficulty
inference difficulty
stamina difficulty
question difficulty
overall difficulty
```

### Deterministic text features

Calculate:

```txt
word count
average sentence length
maximum sentence length
paragraph count
average paragraph length
rare word percentage
academic word count
new vocabulary count
abstract noun density
connector count
subordinate clause count
verb tense complexity
pronoun/reference complexity
disciplinary vocabulary density
knowledge novelty
inference load
text structure complexity
```

### Difficulty bands

Use internal bands, not fake exact grade precision.

Example:

```txt
Foundation 5A
Foundation 5B
Foundation 6A
Foundation 6B
Secondary 7A
Secondary 7B
Secondary 8A
Secondary 8B
Secondary 9A
Secondary 9B
Secondary 10A
Secondary 10B
Advanced 11–12
```

### Example progression

Topic: football migration.

```txt
Level 6B:
350 words, concrete, simple cause/effect, 4 new academic words

Level 7A:
450 words, more explanation, 5–6 academic words, 1 inference question

Level 7B:
550 words, economic/geographic explanation, 7–8 academic words

Level 8A:
650 words, colonial history/context, compare/contrast

Level 8B:
750 words, argument structure, multiple viewpoints

Level 9A:
900 words, nuance, abstract terms, synthesis question
```

### One-step-harder rule

The app should increase only one or two difficulty variables at a time.

Example:

```txt
Good next step:
450 words → 550 words
5 target words → 7 target words
same topic family

Bad next step:
450 words → 900 words
football → unfamiliar history topic
literal questions → source synthesis
5 target words → 20 target words
```

---

## Module H: AI content generation pipeline

### Purpose

Generate controlled French academic texts and questions.

### AI architecture

The app should use OpenAI for generation, but outputs must be constrained and validated.

OpenAI's Responses API supports direct model requests for text, structured output, tools, and multimodal workflows, while Structured Outputs force responses to match a supplied JSON schema. ([OpenAI Developers][4])

### Pipeline

```txt
1. Student profile selected
2. Topic selected
3. Target reading band selected
4. Prompt created with strict constraints
5. AI generates structured JSON
6. Zod validates JSON
7. Deterministic text scorer checks difficulty
8. Moderation/safety check runs
9. Factuality check runs
10. Question generator creates questions
11. Question scorer checks difficulty
12. System stores candidate
13. Candidate is auto-approved or human-reviewed
14. Approved content becomes assignable
```

OpenAI's safety guidance recommends moderation, adversarial testing, human oversight, constrained inputs/outputs, and safety identifiers; these are especially relevant because the product serves minors and uses generated educational content. ([OpenAI Developers][5])

### Generation input schema

```ts
type GenerateTextInput = {
  language: "fr";
  studentGrade: number;
  targetReadingBand: string;
  topic: string;
  primaryInterest: string;
  knowledgeDomains: string[];
  targetConcepts: string[];
  textType: "expository" | "argumentative" | "biography" | "narrative_nonfiction";
  wordCountTarget: number;
  maxAverageSentenceLength: number;
  maxNewAcademicWords: number;
  targetVocabulary: string[];
  targetSkills: string[];
  avoid: string[];
  tone: "respectful_teen" | "neutral_academic" | "curious_explainer";
};
```

### AI output schema

```ts
type GeneratedTextCandidate = {
  title: string;
  body: string;
  estimatedReadingBand: string;
  targetVocabulary: {
    word: string;
    definitionFr: string;
    exampleSentenceFr: string;
  }[];
  knowledgeConcepts: string[];
  skillsPracticed: string[];
  questions: GeneratedQuestion[];
  safetyNotes: string[];
  factualClaims: {
    claim: string;
    confidence: "low" | "medium" | "high";
    needsHumanReview: boolean;
  }[];
};
```

### Question schema

```ts
type GeneratedQuestion = {
  questionText: string;
  questionType:
    | "literal"
    | "vocabulary_in_context"
    | "inference"
    | "main_idea"
    | "cause_consequence"
    | "compare_contrast"
    | "evidence_selection"
    | "summary"
    | "transfer";
  answerFormat: "multiple_choice" | "short_answer" | "written_summary";
  choices?: string[];
  correctAnswer?: string;
  rubric?: string;
  skillIds: string[];
  difficulty: number;
};
```

---

## Module I: Reading session

### Purpose

Deliver one adaptive reading experience.

### Session length

Target:

```txt
15–25 minutes
```

### Session flow

1. Student opens home.
2. App recommends a topic/pathway.
3. Student reads the text.
4. Student answers questions.
5. Student completes vocabulary practice.
6. Student writes a short summary.
7. Student answers one retrieval question from previous knowledge.
8. App gives feedback.
9. App updates skill estimates.
10. App recommends the next action.

### Student experience example

```txt
Today's reading:
"Pourquoi de jeunes footballeurs quittent leur pays"

You are building:
- Geography: migration
- Economics: opportunity
- French: cause/consequence connectors
```

### Reading session result

```ts
type ReadingSessionResult = {
  studentId: string;
  textVersionId: string;
  startedAt: string;
  completedAt?: string;
  abandoned: boolean;
  successRate: number;
  literalScore: number;
  inferenceScore: number;
  vocabularyScore: number;
  summaryScore: number;
  retrievalScore: number;
  timeOnTaskSeconds: number;
  hintsUsed: number;
  targetSuccessZone: {
    min: 0.8;
    max: 0.85;
  };
  recommendedNextAction:
    | "increase_difficulty"
    | "maintain"
    | "add_scaffolding"
    | "foundation_repair"
    | "reduce_difficulty"
    | "change_topic";
};
```

---

## Module J: Adaptive engine

### Purpose

Keep practice at the right level.

### Target success zone

The default target is:

```txt
80–85% success
```

This is not a public claim of perfect science. It is the product's operating principle: enough success to keep motivation, enough challenge to produce growth.

### Inputs

```txt
student reading band
student skill estimates
student vocabulary mastery
student domain familiarity
student recent success rate
student engagement
text difficulty
question difficulty
summary difficulty
retrieval history
reading stamina
```

### Simple V1 rules

```txt
If success = 80–85%:
  maintain level and continue pathway

If success = 86–95% for 2 consecutive sessions:
  increase one difficulty variable

If success > 95%:
  increase difficulty more quickly

If success = 70–79%:
  keep same level but add scaffolding

If success < 70%:
  trigger foundation repair or lower difficulty

If student abandons:
  shorten text or change topic

If student performs well but engagement is low:
  change interest/topic, not necessarily level

If student is engaged but struggling:
  keep topic, reduce complexity
```

### Skill estimate object

```ts
type StudentSkillEstimate = {
  studentId: string;
  skillId: string;
  ability: number;        // 0–100
  uncertainty: number;    // 0–100
  evidenceCount: number;
  lastEvidenceAt: string;
};
```

### Later algorithm upgrade

Start with rules.

Later, when enough data exists, move toward:

```txt
Elo-style text/student difficulty adjustment
IRT-style skill modeling
Bayesian knowledge tracing
confidence intervals
cohort-based calibration
```

Do not overbuild this before real student data.

---

## Module K: Foundation repair

### Purpose

Repair the exact missing prerequisite blocking progress.

### Trigger examples

If the student misses cause/consequence questions repeatedly, trigger a micro-lesson on:

```txt
parce que
puisque
car
donc
ainsi
par conséquent
en raison de
à cause de
grâce à
```

If the student misses contrast questions:

```txt
mais
pourtant
cependant
néanmoins
en revanche
alors que
malgré
bien que
```

If the student cannot summarize:

```txt
identify main idea
remove details
keep cause/effect
write 2–3 sentence summary
compare with model answer
```

### Foundation repair format

Each repair should be short:

```txt
2-minute explanation
5 micro-questions
1 return-to-text question
```

### Important UX rule

Foundation repair must not feel childish.

A Grade 10 student with Grade 6 foundations should receive mature, age-respectful content at lower complexity.

---

## Module L: Memory and retrieval

### Purpose

Turn reading into durable learning.

### Retrieval card

```ts
type RetrievalCard = {
  id: string;
  studentId: string;
  conceptId: string;
  sourceTextVersionId: string;
  cardType:
    | "definition"
    | "why_question"
    | "example"
    | "compare"
    | "transfer"
    | "short_written_response";
  promptFr: string;
  expectedAnswerFr?: string;
  rubric?: string;
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
  lastResult?: "forgot" | "hard" | "good" | "easy";
};
```

### Retrieval schedule

Initial V1 schedule:

```txt
same session
next day
3 days
7 days
21 days
45 days
```

### Example retrieval chain

Topic: football migration.

```txt
Day 1:
Qu'est-ce que la migration ?

Day 3:
Pourquoi un jeune footballeur peut-il migrer vers un autre pays ?

Day 7:
Explique le lien entre migration et opportunité économique.

Day 21:
Compare la migration dans le football avec la migration vers les grandes villes.

Day 45:
Utilise le concept de migration pour expliquer un exemple en histoire ou géographie.
```

---

## Module M: Parent dashboard

### Purpose

Build trust through evidence.

### Parent home

Show:

```txt
current academic reading band
confidence level
weekly reading minutes
texts completed
questions answered
success zone percentage
vocabulary practiced
retrieval success
skills improving
skills needing work
```

### Parent report example

```txt
Current academic French reading band:
Grade 7.1–7.6

Confidence:
Medium

This week:
- 4 texts completed
- 82 minutes read
- 31 questions answered
- 84% average success
- 14 vocabulary words practiced
- 6 retrieval items reviewed

Strengths:
- literal comprehension
- reading stamina on sports/economics topics

Needs work:
- inference
- cause/consequence connectors
- summary precision
```

### Parent proof layer

Show three categories:

```txt
Texts your child reads comfortably
Texts your child can read with support
Texts currently too difficult
```

This is crucial because parents can see concrete evidence rather than just a score.

---

## Module N: Teacher dashboard

### Purpose

Help teachers intervene with precision.

### Teacher dashboard views

1. Class overview
2. Student list
3. Reading band by student
4. Skill gaps
5. Domain performance
6. Retrieval weakness
7. Low-engagement students
8. Recommended groups
9. Assignment creation
10. Report export

### Grouping example

```txt
Group A: weak inference
Students: 8
Recommended activity: evidence + implied meaning

Group B: weak academic vocabulary
Students: 11
Recommended activity: cause/consequence connectors

Group C: low reading stamina
Students: 5
Recommended activity: shorter high-interest texts
```

---

## Module O: Admin and content review

### Purpose

Prevent the product from becoming a random AI generator.

### Admin features

```txt
view generated text candidates
approve/reject/edit text
view difficulty score
view factuality flags
view moderation result
view prompt version
view model version
view student performance by text
retire bad texts
lock benchmark texts
manage skills
manage vocabulary
manage knowledge concepts
manage AI prompts
```

### Review statuses

```txt
draft
auto_approved
needs_human_review
human_approved
rejected
retired
benchmark_locked
```

### Benchmark rule

Benchmark passages must be:

```txt
fixed
versioned
human-reviewed
not dynamically generated per student
used periodically for calibration
```

---

# 10. Privacy, safety, and compliance

Because the app serves minors, privacy is a core product requirement.

For France/EU, CNIL's children's digital rights guidance emphasizes children's privacy, parental involvement under age 15, and age-appropriate information for children. ([CNIL][6])

## V1 requirements

```txt
guardian consent flow
student-friendly privacy explanation
data deletion request workflow
data export workflow
school-controlled student accounts
minimal personal data collection
no public profiles
no ads
no selling student data
no open student-to-student messaging
no unrestricted AI chat
AI content moderation
audit logs for sensitive actions
```

## Data to store for consent

```ts
type ConsentRecord = {
  studentId: string;
  guardianUserId?: string;
  consentType: "guardian" | "school" | "student_over_15";
  consentVersion: string;
  privacyPolicyVersion: string;
  acceptedAt: string;
  revokedAt?: string;
};
```

## AI safety rules

* Student free-text inputs must be moderated.
* Generated content must be moderated.
* Sensitive topics should be age-banded.
* User input should be constrained with dropdowns where possible.
* No open-ended AI companion in V1.
* Human review required for benchmark content.
* Human review required for sensitive domains such as politics, violence, health, sex education, religion, and current events.

---

# 11. Full tech stack recommendation

## Stack summary

```txt
Frontend:
Next.js + TypeScript + Tailwind CSS + shadcn/ui

Backend:
Next.js Server Actions / Route Handlers

Database:
Supabase Postgres

Auth:
Supabase Auth

Security:
Supabase Row Level Security

Storage:
Supabase Storage

Vector search:
pgvector inside Supabase

Background jobs:
Supabase Queues + Supabase Cron
Optional later: Inngest

AI:
OpenAI Responses API
OpenAI Structured Outputs
OpenAI embeddings
OpenAI moderation/safety tooling

Validation:
Zod

Analytics:
PostHog for product analytics
Postgres for learning analytics

Monitoring:
Sentry

Hosting:
Vercel + Supabase Cloud

Later:
ClickHouse / BigQuery for large-scale learning analytics
```

---

# 12. Why this tech stack

## Frontend: Next.js

Use **Next.js App Router**.

Why:

* strong React ecosystem
* fast full-stack development
* good fit for dashboards
* good fit for AI coder productivity
* server and client components
* server-side data fetching
* easy Vercel deployment

Next.js App Router supports server and client components, and Next.js Server Functions/Server Actions run on the server and can be used for form submissions and data mutations. ([Next.js][7])

## UI: Tailwind + shadcn/ui

Use:

```txt
Tailwind CSS
shadcn/ui
lucide-react icons
```

Tailwind is a utility-first CSS framework, while shadcn/ui provides accessible, customizable components and a code distribution approach rather than a traditional fixed component library. ([Tailwind CSS][8])

## Backend: Next.js Server Actions and Route Handlers

Use Server Actions for:

```txt
form submissions
student answers
profile updates
teacher assignments
parent report requests
```

Use Route Handlers for:

```txt
webhooks
AI job callbacks
admin API endpoints
file exports
```

Important security rule:

> Every server action must verify authentication and authorization server-side.

Next.js data security guidance explicitly notes that Server Actions should still be treated as reachable through direct requests and must verify authentication and authorization inside the action. ([Next.js][9])

---

# 13. Database: Supabase Postgres

## Recommendation

Use **Supabase Postgres as the source of truth**.

Supabase provides a full Postgres database, Auth, Storage, Realtime, Edge Functions, and vector embeddings in one platform. ([Supabase][10])

## Why Supabase/Postgres is the right default

This product is relational and evidence-heavy.

You need clean links between:

```txt
students
parents
teachers
schools
classes
texts
text versions
questions
skills
answers
retrieval cards
reports
AI jobs
benchmark results
```

Postgres gives:

```txt
foreign keys
constraints
transactions
indexes
views
materialized views
JSONB flexibility
SQL analytics
auditability
portability
```

## Why not MongoDB first

MongoDB can work for flexible AI metadata, but this product is not mainly a document repository. It is a structured learning system. The relationships matter too much.

## Why not Convex first

Convex is attractive for fast realtime MVPs, but the long-term moat is clean assessment and learning evidence data. Postgres is the better system of record.

---

# 14. Row Level Security

Enable RLS from the beginning.

Supabase RLS uses Postgres policies to restrict row-level access and can be combined with Supabase Auth for end-to-end user security. ([Supabase][11])

## Access model

```txt
student:
  can read own assignments, sessions, reports
  can insert own answers
  cannot read other students

parent:
  can read linked child data
  cannot modify learning records

teacher:
  can read students in assigned classes
  can create assignments
  cannot access unrelated classes

school_admin:
  can manage school users/classes
  can access school-level reports

platform_admin:
  full access through service-role-only backend tools

content_reviewer:
  can review content
  cannot access student personal data unless explicitly allowed
```

## Critical rule

Never expose service-role keys to the client.

---

# 15. Vector search

Use **pgvector inside Supabase** for V1.

pgvector is a Postgres extension for storing embeddings and performing vector similarity search, including RAG-style use cases. ([Supabase][12])

## Use cases

```txt
match student interests to texts
find similar texts
recommend prerequisite texts
find concept-related texts
retrieve approved background snippets
detect duplicate generated content
```

## Do not overbuild

Do not start with Pinecone, Weaviate, or Qdrant unless vector search becomes a core scaling bottleneck.

---

# 16. Background jobs

Use:

```txt
Supabase Queues
Supabase Cron
Supabase Edge Functions
```

Supabase Queues can be consumed server-side with Edge Functions, and Supabase Cron schedules recurring jobs using cron syntax inside Postgres. ([Supabase][13])

## Background job types

```txt
generate_text_candidate
score_text_candidate
moderate_text_candidate
generate_questions
score_questions
create_retrieval_cards
send_weekly_parent_report
recalculate_student_skill_estimates
recalculate_text_difficulty_stats
archive_old_events
```

Supabase Edge Functions are globally distributed server-side TypeScript functions and can be used for API/webhook integrations. ([Supabase][14])

---

# 17. AI stack

## Provider

Use OpenAI first.

## AI capabilities

Use AI for:

```txt
text generation
text simplification
question generation
summary feedback
vocabulary explanations
content tagging suggestions
interest-to-knowledge mapping
parent report drafting
teacher report drafting
```

Do **not** use AI as the sole source for:

```txt
student level decisions
final content difficulty
high-stakes placement
diagnosis
unreviewed benchmark texts
```

## Required AI provider interface

```ts
export interface AIProvider {
  generateText(input: GenerateTextInput): Promise<GeneratedTextCandidate>;
  generateQuestions(input: GenerateQuestionInput): Promise<GeneratedQuestion[]>;
  scoreSummary(input: ScoreSummaryInput): Promise<SummaryScore>;
  tagText(input: TagTextInput): Promise<TextTagResult>;
  moderate(input: ModerationInput): Promise<ModerationResult>;
  embed(input: EmbeddingInput): Promise<number[]>;
}
```

## Validation

Use Zod to validate every AI output.

Zod is a TypeScript-first schema validation library for validating data from simple primitives to complex nested objects. ([Zod][15])

---

# 18. Analytics

## Product analytics

Use PostHog for:

```txt
activation
retention
funnels
feature flags
A/B tests
teacher dashboard usage
parent report usage
student engagement
```

PostHog feature flags can toggle features for users, groups, or traffic percentages without redeploying code, which is useful for pilots and staged rollouts. ([PostHog][16])

## Learning analytics

Store learning events in Postgres.

Do not rely only on PostHog for learning evidence.

Learning events:

```txt
reading_started
paragraph_viewed
question_answered
hint_used
summary_submitted
retrieval_attempted
foundation_repair_triggered
difficulty_adjusted
text_completed
session_abandoned
```

Later, export to:

```txt
ClickHouse
BigQuery
Snowflake
```

Only add this after event volume justifies it.

---

# 19. Monitoring

Use Sentry.

Sentry supports error monitoring, tracing, session replay, logs, and Next.js setup. ([Sentry Docs][17])

Track:

```txt
frontend errors
backend errors
AI job failures
database errors
slow pages
failed report generation
failed moderation calls
failed content generation
```

---

# 20. Hosting

Use:

```txt
Vercel for Next.js
Supabase Cloud for database/auth/storage/functions
```

Vercel describes Next.js as a full-stack React framework and provides zero-configuration deployment with global performance enhancements. ([Vercel][18])

---

# 21. Data model

## Core tables

### Organizations and schools

```sql
organizations (
  id uuid primary key,
  name text not null,
  type text check (type in ('school', 'tutoring_center', 'family', 'internal')),
  created_at timestamptz default now()
);

schools (
  id uuid primary key,
  organization_id uuid references organizations(id),
  name text not null,
  country text,
  city text,
  curriculum_type text,
  created_at timestamptz default now()
);

classes (
  id uuid primary key,
  school_id uuid references schools(id),
  name text not null,
  grade_level int,
  academic_year text,
  created_at timestamptz default now()
);
```

### Users and profiles

```sql
profiles (
  id uuid primary key,
  auth_user_id uuid unique not null,
  role text check (role in ('student', 'parent', 'teacher', 'school_admin', 'platform_admin', 'content_reviewer')),
  first_name text,
  last_name text,
  display_name text,
  preferred_language text default 'fr',
  created_at timestamptz default now()
);

students (
  id uuid primary key,
  profile_id uuid references profiles(id),
  school_id uuid references schools(id),
  current_grade int,
  french_background text,
  date_of_birth date,
  created_at timestamptz default now()
);

student_guardians (
  student_id uuid references students(id),
  guardian_profile_id uuid references profiles(id),
  relationship text,
  primary key (student_id, guardian_profile_id)
);

teacher_classes (
  teacher_profile_id uuid references profiles(id),
  class_id uuid references classes(id),
  primary key (teacher_profile_id, class_id)
);

enrollments (
  student_id uuid references students(id),
  class_id uuid references classes(id),
  status text default 'active',
  primary key (student_id, class_id)
);
```

### Skills and knowledge

```sql
skills (
  id uuid primary key,
  key text unique not null,
  label_fr text not null,
  category text not null,
  description_fr text,
  prerequisite_skill_ids uuid[],
  grade_band_min numeric,
  grade_band_max numeric
);

knowledge_domains (
  id uuid primary key,
  key text unique not null,
  label_fr text not null
);

knowledge_concepts (
  id uuid primary key,
  domain_id uuid references knowledge_domains(id),
  label_fr text not null,
  description_fr text,
  prerequisite_concept_ids uuid[],
  related_concept_ids uuid[],
  grade_band_min numeric,
  grade_band_max numeric
);
```

### Content

```sql
texts (
  id uuid primary key,
  canonical_title text not null,
  primary_interest text,
  primary_domain_id uuid references knowledge_domains(id),
  status text check (status in ('draft', 'active', 'retired')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

text_versions (
  id uuid primary key,
  text_id uuid references texts(id),
  version_number int not null,
  title text not null,
  body text not null,
  language text default 'fr',
  word_count int,
  text_type text,
  estimated_grade_min numeric,
  estimated_grade_max numeric,
  lexical_difficulty numeric,
  syntax_difficulty numeric,
  knowledge_difficulty numeric,
  inference_difficulty numeric,
  stamina_difficulty numeric,
  overall_difficulty numeric,
  generation_type text,
  review_status text,
  source_policy text,
  created_at timestamptz default now(),
  unique (text_id, version_number)
);

questions (
  id uuid primary key,
  text_version_id uuid references text_versions(id),
  question_text text not null,
  question_type text not null,
  answer_format text not null,
  correct_answer text,
  rubric jsonb,
  difficulty numeric,
  created_at timestamptz default now()
);

question_choices (
  id uuid primary key,
  question_id uuid references questions(id),
  choice_text text not null,
  is_correct boolean default false
);

text_skills (
  text_version_id uuid references text_versions(id),
  skill_id uuid references skills(id),
  primary key (text_version_id, skill_id)
);

question_skills (
  question_id uuid references questions(id),
  skill_id uuid references skills(id),
  primary key (question_id, skill_id)
);
```

### Vocabulary

```sql
vocabulary_items (
  id uuid primary key,
  lemma text not null,
  display_word text not null,
  definition_fr text,
  example_fr text,
  difficulty numeric,
  domain_id uuid references knowledge_domains(id),
  created_at timestamptz default now()
);

text_vocabulary (
  text_version_id uuid references text_versions(id),
  vocabulary_item_id uuid references vocabulary_items(id),
  is_target_word boolean default false,
  primary key (text_version_id, vocabulary_item_id)
);

student_word_mastery (
  student_id uuid references students(id),
  vocabulary_item_id uuid references vocabulary_items(id),
  mastery numeric default 0,
  exposures int default 0,
  retrieval_successes int default 0,
  last_seen_at timestamptz,
  next_review_at timestamptz,
  primary key (student_id, vocabulary_item_id)
);
```

### Student estimates

```sql
student_reading_estimates (
  id uuid primary key,
  student_id uuid references students(id),
  estimate_type text,
  grade_min numeric,
  grade_max numeric,
  confidence text,
  evidence_count int,
  created_at timestamptz default now()
);

student_skill_estimates (
  student_id uuid references students(id),
  skill_id uuid references skills(id),
  ability numeric,
  uncertainty numeric,
  evidence_count int,
  last_evidence_at timestamptz,
  primary key (student_id, skill_id)
);

student_domain_estimates (
  student_id uuid references students(id),
  domain_id uuid references knowledge_domains(id),
  familiarity numeric,
  evidence_count int,
  last_evidence_at timestamptz,
  primary key (student_id, domain_id)
);
```

### Reading sessions

```sql
reading_sessions (
  id uuid primary key,
  student_id uuid references students(id),
  text_version_id uuid references text_versions(id),
  started_at timestamptz default now(),
  completed_at timestamptz,
  abandoned boolean default false,
  success_rate numeric,
  literal_score numeric,
  inference_score numeric,
  vocabulary_score numeric,
  summary_score numeric,
  retrieval_score numeric,
  time_on_task_seconds int,
  hints_used int default 0,
  recommended_next_action text
);

student_answers (
  id uuid primary key,
  session_id uuid references reading_sessions(id),
  question_id uuid references questions(id),
  answer_text text,
  selected_choice_id uuid references question_choices(id),
  is_correct boolean,
  score numeric,
  feedback text,
  answered_at timestamptz default now()
);

student_summaries (
  id uuid primary key,
  session_id uuid references reading_sessions(id),
  summary_text text not null,
  ai_score jsonb,
  teacher_score jsonb,
  created_at timestamptz default now()
);

reading_session_events (
  id uuid primary key,
  session_id uuid references reading_sessions(id),
  student_id uuid references students(id),
  event_type text not null,
  event_payload jsonb,
  created_at timestamptz default now()
);
```

### Retrieval

```sql
retrieval_cards (
  id uuid primary key,
  student_id uuid references students(id),
  concept_id uuid references knowledge_concepts(id),
  source_text_version_id uuid references text_versions(id),
  card_type text,
  prompt_fr text not null,
  expected_answer_fr text,
  rubric jsonb,
  created_at timestamptz default now()
);

retrieval_schedules (
  id uuid primary key,
  retrieval_card_id uuid references retrieval_cards(id),
  due_at timestamptz not null,
  interval_days int,
  ease_factor numeric default 2.5,
  status text default 'due'
);

retrieval_attempts (
  id uuid primary key,
  retrieval_card_id uuid references retrieval_cards(id),
  student_id uuid references students(id),
  answer_text text,
  score numeric,
  result text,
  attempted_at timestamptz default now()
);
```

### AI workflow

```sql
ai_generation_jobs (
  id uuid primary key,
  job_type text not null,
  status text not null,
  input_payload jsonb not null,
  output_payload jsonb,
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

ai_generated_candidates (
  id uuid primary key,
  generation_job_id uuid references ai_generation_jobs(id),
  candidate_type text,
  payload jsonb not null,
  review_status text default 'draft',
  created_at timestamptz default now()
);

ai_scoring_results (
  id uuid primary key,
  candidate_id uuid references ai_generated_candidates(id),
  score_payload jsonb not null,
  created_at timestamptz default now()
);

ai_moderation_results (
  id uuid primary key,
  candidate_id uuid references ai_generated_candidates(id),
  moderation_payload jsonb not null,
  passed boolean not null,
  created_at timestamptz default now()
);

prompt_versions (
  id uuid primary key,
  prompt_key text not null,
  version_number int not null,
  prompt_text text not null,
  schema jsonb,
  active boolean default false,
  created_at timestamptz default now(),
  unique (prompt_key, version_number)
);
```

### Reports

```sql
parent_reports (
  id uuid primary key,
  student_id uuid references students(id),
  report_period_start date,
  report_period_end date,
  report_payload jsonb not null,
  created_at timestamptz default now()
);

teacher_reports (
  id uuid primary key,
  class_id uuid references classes(id),
  report_period_start date,
  report_period_end date,
  report_payload jsonb not null,
  created_at timestamptz default now()
);

benchmark_results (
  id uuid primary key,
  student_id uuid references students(id),
  text_version_id uuid references text_versions(id),
  result_payload jsonb not null,
  created_at timestamptz default now()
);
```

---

# 22. App routes

## Public

```txt
/
 /about
 /schools
 /parents
 /privacy
 /terms
```

## Auth

```txt
/login
/signup
/join
/consent
/reset-password
```

## Student

```txt
/student
/student/onboarding
/student/diagnostic
/student/read/[sessionId]
/student/results/[sessionId]
/student/vocabulary
/student/memory
/student/progress
/student/settings
```

## Parent

```txt
/parent
/parent/students/[studentId]
/parent/reports/[reportId]
/parent/settings
/parent/privacy
```

## Teacher

```txt
/teacher
/teacher/classes
/teacher/classes/[classId]
/teacher/students/[studentId]
/teacher/groups
/teacher/assignments
/teacher/reports
```

## Admin

```txt
/admin
/admin/content
/admin/content/review
/admin/texts/[textId]
/admin/skills
/admin/vocabulary
/admin/concepts
/admin/ai-jobs
/admin/prompts
/admin/benchmarks
/admin/schools
```

---

# 23. API / server action map

## Student actions

```ts
startDiagnostic()
submitDiagnosticAnswer()
completeDiagnostic()
selectInterests()
startReadingSession()
submitAnswer()
submitSummary()
completeReadingSession()
submitRetrievalAttempt()
```

## Teacher actions

```ts
createClass()
inviteStudents()
createAssignment()
viewClassProgress()
createInterventionGroup()
exportClassReport()
```

## Parent actions

```ts
linkStudent()
viewStudentProgress()
downloadReport()
requestDataExport()
requestDataDeletion()
```

## Admin actions

```ts
createSkill()
createKnowledgeConcept()
generateTextCandidate()
reviewTextCandidate()
approveTextVersion()
retireTextVersion()
runDifficultyScoring()
runModeration()
activatePromptVersion()
```

---

# 24. MVP acceptance criteria

## Student

MVP is acceptable when:

```txt
student can join/create account
student can complete onboarding
student can complete diagnostic
student receives reading profile
student can read assigned text
student can answer comprehension questions
student can submit summary
student receives feedback
student receives retrieval question
student sees progress
```

## Adaptive engine

MVP is acceptable when:

```txt
system calculates text difficulty
system tracks student skill estimates
system tracks vocabulary mastery
system chooses next text based on success rate
system triggers foundation repair
system schedules retrieval cards
```

## Parent

MVP is acceptable when:

```txt
parent can view child progress
parent can see reading band
parent can see weekly report
parent can see strengths/weaknesses
parent can see sample texts
```

## Teacher

MVP is acceptable when:

```txt
teacher can create class
teacher can see students
teacher can view class skill gaps
teacher can assign reading
teacher can see recommended groups
```

## Admin

MVP is acceptable when:

```txt
admin can review AI-generated text
admin can approve/reject/edit content
admin can see scoring results
admin can see moderation results
admin can manage skills and concepts
```

---

# 25. Build roadmap

## Phase 0: Product skeleton

Build:

```txt
Next.js app
Supabase project
Auth
RLS foundations
basic roles
student dashboard shell
teacher dashboard shell
admin dashboard shell
```

## Phase 1: Diagnostic and reading session

Build:

```txt
student onboarding
interest picker
diagnostic flow
manual seed texts
question answering
basic scoring
reading result page
```

## Phase 2: AI content pipeline

Build:

```txt
AI generation jobs
structured output schemas
Zod validation
text scoring engine v1
question generation
moderation
admin review
approved content library
```

## Phase 3: Adaptive engine v1

Build:

```txt
student skill estimates
success-zone logic
next-text recommendation
difficulty adjustment
foundation repair triggers
basic micro-lessons
```

## Phase 4: Memory system

Build:

```txt
retrieval cards
retrieval schedule
retrieval attempts
concept mastery
vocabulary retention
```

## Phase 5: Parent and teacher dashboards

Build:

```txt
parent weekly report
teacher class dashboard
student grouping
assignment creation
report export
```

## Phase 6: Pilot readiness

Build:

```txt
benchmark passages
school admin tools
privacy workflows
audit logs
usage analytics
error monitoring
content QA workflow
```

---

# 26. Testing plan

## Unit tests

Test:

```txt
difficulty scoring
success-zone decisions
retrieval scheduling
skill estimate updates
RLS policy helper functions
Zod schemas
question scoring
```

## Integration tests

Test:

```txt
student onboarding to diagnostic completion
reading session completion
AI generation to review pipeline
parent report generation
teacher class report generation
```

## Safety tests

Test:

```txt
student tries unsafe prompt
generated text contains unsafe topic
AI outputs invalid JSON
AI includes unverifiable claims
student tries to access another student
parent tries to access unlinked child
teacher tries to access unrelated class
```

## Learning QA

Manually review:

```txt
text difficulty
age appropriateness
question answerability
summary rubric quality
foundation repair quality
retrieval prompt quality
```

---

# 27. Risks and mitigations

## Risk 1: The app becomes a shallow AI story generator

Mitigation:

```txt
controlled difficulty engine
skill taxonomy
knowledge graph
retrieval system
foundation repair
admin review
benchmark passages
```

## Risk 2: Parents do not trust the level

Mitigation:

```txt
confidence bands
sample texts
skill evidence
weekly reports
benchmark passages
avoid fake precision
```

## Risk 3: AI-generated facts are wrong

Mitigation:

```txt
prefer evergreen topics in V1
fact-check step
human review for sensitive/factual content
no unverified statistics
source policy field
retire content quickly
```

## Risk 4: Teachers do not adopt

Mitigation:

```txt
low-prep assignments
clear class dashboard
intervention grouping
exportable reports
teacher override controls
```

## Risk 5: Students do not use it

Mitigation:

```txt
interest-led content
teen-respectful tone
short sessions
visible progress
topic choice
not babyish for weak readers
```

## Risk 6: Data privacy failure

Mitigation:

```txt
RLS from day one
role-based access
audit logs
minimal data
guardian consent
no social features
no public profiles
```

---

# 28. Brutal product priorities

If you only build five things well, build these:

1. **Diagnostic reading profile**
2. **Controlled text difficulty engine**
3. **Interest-to-knowledge reading paths**
4. **80–85% adaptive learning-zone logic**
5. **Parent/teacher proof reports**

Everything else is secondary.

The moat is not AI generation.

The moat is:

```txt
clean learning data
calibrated text difficulty
student skill profiles
knowledge graph
memory/retrieval history
foundation repair
credible progress evidence
```

---

# 29. Final recommended stack

Use this exact stack for V1:

```txt
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Supabase Postgres
Supabase Auth
Supabase Row Level Security
Supabase Storage
Supabase Queues
Supabase Cron
Supabase Edge Functions
pgvector
OpenAI Responses API
OpenAI Structured Outputs
OpenAI embeddings
OpenAI moderation/safety
Zod
PostHog
Sentry
Vercel
```

Blunt recommendation:

> Build this as a **serious learning-data product**, not an AI content product. AI should generate, explain, and assist. The platform should score, adapt, remember, repair, and prove.

[1]: https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/literacy-ks3-ks4 "Improving Literacy in Secondary Schools"
[2]: https://educationendowmentfoundation.org.uk/education-evidence/evidence-reviews/cognitive-science-approaches-in-the-classroom "Cognitive science approaches in the classroom | EEF"
[3]: https://supabase.com/docs/guides/auth "Auth | Supabase Docs"
[4]: https://developers.openai.com/api/docs "OpenAI API Platform Documentation"
[5]: https://developers.openai.com/api/docs/guides/safety-best-practices "Safety best practices | OpenAI API"
[6]: https://www.cnil.fr/en/topics/digital-rights-children "Digital rights of children"
[7]: https://nextjs.org/docs/app "Next.js Docs: App Router"
[8]: https://tailwindcss.com/ "Tailwind CSS - Rapidly build modern websites"
[9]: https://nextjs.org/docs/app/guides/data-security "Guides: Data Security"
[10]: https://supabase.com/ "Supabase | The Postgres Development Platform."
[11]: https://supabase.com/docs/guides/database/postgres/row-level-security "Row Level Security | Supabase Docs"
[12]: https://supabase.com/docs/guides/database/extensions/pgvector "pgvector: Embeddings and vector similarity"
[13]: https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions "Consuming Messages with Edge Functions"
[14]: https://supabase.com/docs/guides/functions "Edge Functions | Supabase Docs"
[15]: https://zod.dev/ "Zod: Intro"
[16]: https://posthog.com/docs/feature-flags "Feature flags - Docs"
[17]: https://docs.sentry.io/ "Sentry Docs | Application Performance Monitoring & Error"
[18]: https://vercel.com/docs/frameworks/full-stack/nextjs "Next.js on Vercel"
