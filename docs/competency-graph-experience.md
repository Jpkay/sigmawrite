# SigmaWrite competency graph experience

**Status:** student, administrator, parent, and teacher graph milestones implemented; live staging validation prepared
**First milestone:** student mastery map on `/student/frontier`
**Last updated:** 2026-07-15

## Decision

SigmaWrite will make its competency graph visible as both a learning tool and a
signature product visual. The graph must first explain the learner's next step;
the large constellation view is a secondary expression of the same verified
data.

The experience will therefore have two views:

1. **Ta carte de maîtrise** — a focused student view containing the active path,
   immediate foundations, and competencies unlocked next.
2. **Le français, compétence par compétence** — a complete constellation for
   teachers, administrators, and eventually the public website.

The product will not present a dense force-directed graph as the default student
navigation. A large graph communicates scale, but a focused path communicates
what to do.

## Product thesis

> Une moyenne cache le vrai obstacle. SigmaWrite montre ce que l'élève maîtrise,
> ce qui reste fragile et la plus petite étape qui débloque la suite.

### Visual thesis

A calm luminous map on deep navy: warm SigmaWrite pink, teal, violet, blue, and
gold identify meaningful learning strands while the current path remains the
strongest visual signal.

### Content plan

- **Orientation:** show the learner where they are and what is ready now.
- **Explanation:** selecting a competency reveals evidence, uncertainty,
  foundations, and what it unlocks.
- **Action:** provide one direct route into the appropriate practice.
- **Detail:** retain the complete textual frontier for evidence inspection and
  accessibility.

### Interaction thesis

- The map enters in a stable deterministic layout; it never wobbles perpetually.
- Selecting a node quiets unrelated edges and illuminates its prerequisites and
  dependents.
- Switching between **Mon parcours** and **Toute la carte** changes scope, not
  the meaning of the data.

## Aesthetic assessment of the reference

The reference graph is effective because it uses one dominant visual idea,
strong depth, restrained chrome, and luminous clusters. Its weakness is that it
communicates magnitude more readily than meaning: labels, relationship types,
and actionable next steps are not evident at overview scale.

SigmaWrite should adapt rather than copy it:

- use the existing navy, pink, teal, gold, and warm-light-mode identity;
- cluster by learning strand without inventing pedagogical relationships;
- reveal labels and edges through focus rather than showing everything at once;
- use a deterministic layout and restrained transitions;
- keep the graph paired with a searchable, keyboard-accessible textual view;
- reserve tiny item satellites for a later multi-resolution overview.

The current landing page is coherent but conventional. Its card grid makes the
core intellectual property—the graph-driven mastery engine—nearly invisible.
After the student experience proves useful, a release-backed constellation can
become the homepage's dominant visual anchor.

## Content assessment of the reference model

The reference's sequence—source, observable skill, relationship, evidence,
mastery, adaptive movement, and repair—closely matches SigmaWrite's architecture.
The following distinctions must remain explicit:

- **Node kind:** competency, lexical item, construction, content concept, or
  learning package.
- **Relationship:** prerequisite, part-of, contrast, confusion, family, or
  remediation.
- **Progression mapping:** grade, CEFR, learner profile, or another framework.
- **Learner state:** mastered, fragile, missing, unknown, ready, or due for
  review.
- **Evidence:** attempts and observations attached to a competency; evidence is
  not itself the competency.

### Truth-in-marketing rules

- Say that SigmaWrite creates original mappings aligned to official frameworks;
  do not imply official endorsement or copied curriculum content.
- Describe a missing foundation as an evidence-backed hypothesis to verify, not
  an infallible diagnosis.
- Do not claim a learning-hour total without an auditable calculation.
- Do not use rhetoric that blames teachers.
- Do not describe candidate items as validated learning items.
- Do not publish candidate-release counts as approved product coverage.

### Current release facts

- Approved taxonomy v1: 121 competency nodes, 103 prerequisite relationships,
  121 mastery-evidence definitions, and 242 progression mappings.
- Taxonomy v2 candidate: 161 competency nodes, 155 prerequisite relationships,
  238 mastery-evidence definitions, and 322 progression mappings.
- V2 remains pending diagnostic-bank review and is not yet a public claim.

## User-facing language

### View titles

- Student: **Ta carte de maîtrise**
- Parent and teacher: **Carte des compétences en français**
- Marketing: **Le français, compétence par compétence**

### Learner states

- **Maîtrisé**
- **À consolider**
- **À construire**
- **Encore à vérifier**
- **Prêt à apprendre**
- **À revoir**

Use **Base à consolider** rather than **Bloqué** in student-facing copy.

### Relationship labels

- Hard prerequisite: **Nécessaire avant**
- Soft prerequisite: **Aide à réussir**
- Part-of: **Fait partie de**
- Confusion: **Souvent confondu avec**
- Contrast: **À comparer avec**
- Family: **Même famille**
- Remediation: **Répare cette difficulté**
- Concept dependency: **S'appuie sur ce concept**

## Concrete implementation goals

### Goal 1 — Stable graph data contract

Create one serializable, release-aware graph payload containing:

- release and diagnostic-run identifiers;
- competency nodes and prerequisite edges;
- hard or soft prerequisite class when available;
- mastery probability, uncertainty, and evidence count;
- persisted diagnostic classification;
- ready-to-learn state and blockers;
- active learning-path position, stage, status, and rationale.

Only the learner's permitted or explicitly pilot-scoped release may be exposed.

### Goal 2 — Reusable graph renderer

Build a renderer that supports:

- a deterministic strand-clustered layout;
- path and complete-map scopes;
- pan, zoom, reset, search, and strand filtering;
- node selection and keyboard activation;
- focused prerequisite and dependent highlighting;
- a textual inspector;
- reduced motion and a non-colour status explanation.

The first renderer is SVG because the current graph contains at most a few
hundred visible competencies. The DTO and selection logic remain renderer-
agnostic. A future multi-resolution view with hundreds or thousands of item
satellites may replace only the rendering layer with WebGL.

### Goal 3 — Student mastery map

Make `/student/frontier` the first useful graph surface.

The default view shows the active path plus one relationship hop. The complete
graph is available through an explicit control. Selecting a node explains:

- what the learner can do;
- observed evidence and remaining uncertainty;
- foundations required;
- competencies unlocked;
- the next practice action.

The existing evidence-rich frontier list remains below the map.

### Goal 4 — Accessible alternative

- Keep the grouped textual frontier.
- Make graph nodes keyboard-selectable.
- Never encode learner state with colour alone.
- Announce selected-node details in ordinary document content.
- Respect reduced motion.
- Use a list-first presentation when the graph is not useful on a small screen.

### Goal 5 — Adult and administrative modes

- Parents receive a simplified read-only path.
- Teachers can trace foundations and upcoming unlocks for a student.
- Administrators can inspect the complete release and validate relationships.
- Editing and relationship approval remain administrative actions, never student
  interactions.

### Goal 6 — Marketing constellation

Create a public, non-personal snapshot generated only from an approved release.
It may become the homepage's main visual, but must contain no learner data and
must derive every count from release metadata.

### Goal 7 — Content governance

Keep approved and candidate releases visibly separate. Preserve provenance,
review status, evidence definitions, and unresolved coverage gaps. Do not add
relationships merely to make a denser visual.

### Goal 8 — Measured rollout

Roll out in this order:

1. administrator inspection;
2. student frontier;
3. parent and teacher read-only views;
4. public marketing view;
5. optional item-satellite universe mode.

Measure graph opens, node selections, path-focus use, and practice starts.

## First implementation milestone

### Objective

Deliver a useful interactive personalized competency graph on
`/student/frontier` without changing taxonomy content or public marketing.

### Acceptance criteria

- The Server Component continues to perform protected data access.
- A plain serializable graph DTO crosses the Server/Client boundary.
- The default view contains active path steps and their immediate neighbours.
- The user can switch to the complete permitted graph.
- The user can search, filter by strand, select, pan, zoom, and reset.
- Selected nodes show classification, readiness, mastery, uncertainty, evidence,
  foundations, unlocks, path rationale, and a practice action.
- Existing detailed frontier lists remain available below the graph.
- Mobile, keyboard operation, and reduced motion have deliberate fallbacks.
- Focused unit tests, TypeScript, lint, the test suite, and a production build
  pass.

### Non-goals

- No homepage redesign.
- No taxonomy, edge, or diagnostic-item authoring.
- No new public coverage claims.
- No item satellites.
- No graph editing from the student surface.
- No deployment or database mutation.

## Verification

Run the narrow checks first, then the repository checks:

```text
npx vitest run src/lib/graph/presentation.test.ts
npm run typecheck
npm run lint
npm test
npm run build
```

### Current implementation state

- The release-aware graph DTO and deterministic strand layout are implemented.
- `/student/frontier` now contains the interactive personalized and complete-map
  views while retaining the evidence-rich textual frontier.
- Desktop and mobile have explicit empty and filtered-out states.
- Stale node, blocker, path, and edge references are removed at the presentation
  boundary so counts cannot describe records outside the displayed release.
- Active learning paths are scoped to the same taxonomy release as the displayed
  graph.
- Focused graph tests cover normal, empty, pathless, and stale-reference cases.

### Read-only live-data smoke check

Run the following against staging after providing a staging environment file:

```text
GRAPH_SMOKE_ENV_FILE=.env.staging npm run graph:smoke
```

The command refuses the known production project, performs no writes, and emits
only anonymous aggregate counts. It validates node and edge uniqueness, endpoint
and blocker integrity, mastery value ranges, learning-path positions,
personalized selection limits, and deterministic-layout coordinates. It uses a
service role when available or the configured demo student's normal signed-in
access otherwise.

The repository's current `.env.local` points to production and no local Supabase
instance is running, so live validation remains intentionally pending until a
staging environment is supplied. The production refusal must not be relaxed to
complete this check.

## Next implementation goals

### Goal 9 — Complete staging validation

1. Provide `.env.staging` or set `GRAPH_SMOKE_ENV_FILE` to an equivalent
   non-production environment file.
2. Run `npm run graph:smoke` and retain the anonymous coverage summary.
3. Ensure at least one completed diagnostic graph and one active learning path
   are covered; seed synthetic staging data only in a separately approved
   operation if those cases do not exist.
4. Fix any schema drift, dangling references, invalid estimates, or empty
   release membership exposed by the smoke check.

### Goal 10 — Administrator graph inspection — implemented

Add the same release-backed renderer to the administrative graph studio with:

- release selection and approved-versus-candidate labeling;
- hard, soft, and unknown prerequisite filters;
- orphan, cycle, dangling-reference, and missing-evidence warnings;
- node provenance and review status in the inspector;
- no relationship editing until validation and approval workflows are explicit.

Implemented at `/admin/graph` as a read-only, release-backed inspector. It uses
immutable membership snapshots for the displayed graph, supplements them with
current authoring review status, and surfaces release identity, checksums,
record versions, source keys, prerequisite classes, cycles, dangling edges,
isolated nodes, missing evidence definitions, and unknown prerequisite classes.
Search, domain filtering, alert-only filtering, relation-class filtering,
keyboard node selection, mobile lists, and a provenance inspector are included.

The unauthenticated browser check confirms the route redirects to
`/login?next=/admin/graph`. Full visual QA with release data requires an existing
authenticated platform-administrator session; no authentication bypass or
production query is part of this milestone.

### Goal 11 — Parent and teacher read-only views — implemented

Create a simplified learner overlay that emphasizes the current path, verified
strengths, fragile foundations, and near-term unlocks. Define authorization and
privacy acceptance tests before exposing cross-student access.

Implemented on the existing RLS-scoped student detail routes:

- `/parent/students/[studentId]` shows supportive, low-jargon states, evidence
  confidence instead of raw probabilities, useful foundations, and near-term
  unlocks. Detailed evidence remains available in a collapsed section.
- `/teacher/students/[studentId]` adds mastery, uncertainty, evidence counts,
  prerequisite classes, and the full evidence frontier below the map.
- Both views support French and English interface copy, current-path and full-map
  scopes, domain filtering, keyboard node selection, and mobile list fallbacks.
- A shared access loader runs the role guard first, requires the student to be
  returned by the authenticated RLS-scoped lookup, and does not load graph data
  for a hidden student. Privacy acceptance tests cover parent, teacher,
  school-administrator, hidden-student, and exact-student behavior.
- No service-role client, cross-student list expansion, graph editing, or data
  mutation is used by either experience.

### Goal 12 — Public approved-release constellation

Generate a non-personal snapshot from an approved release, derive every count
from its metadata, and use it for homepage storytelling. This milestone follows
admin validation so the public visual never outpaces content governance.

### Goal 13 — Product measurement and rendering budget

Measure graph opens, node selections, path-versus-complete-map use, and practice
starts. Establish SVG performance thresholds with the full v2 candidate before
considering WebGL or item satellites.

## Follow-up milestones

1. Add the complete graph to the existing administrative graph studio with
   validation context.
2. Add simplified parent and teacher overlays.
3. Create an approved-release public snapshot and homepage storytelling.
4. Evaluate a WebGL renderer only when the visible graph includes item-level
   satellites or exceeds the SVG interaction budget.
