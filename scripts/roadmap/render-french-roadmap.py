#!/usr/bin/env python3
"""Render the coordinator-owned roadmap; reject broken task dependencies."""
import json
from pathlib import Path
from collections import Counter
root=Path(__file__).resolve().parents[2]
directory=root/'docs/diagnostic'
plan=json.loads((directory/'atomic-roadmap-2026-09-13.json').read_text())
registry=json.loads((directory/'remaining-target-goals-2026-09-13.json').read_text())
tasks=plan['tasks']; targets=registry['targets']; all_tasks=tasks+[task for target in targets for task in target['tasks']]
ids=[task['id'] for task in all_tasks]
if len(ids)!=len(set(ids)):raise ValueError('Duplicate task ID')
by_id={task['id']:task for task in all_tasks}
visiting=set();visited=set()
def visit(key):
 if key in visiting:raise ValueError('Dependency cycle at '+key)
 if key in visited:return
 visiting.add(key)
 for dep in by_id[key]['dependsOn']:
  if dep not in by_id:raise ValueError('Unknown dependency '+dep)
  visit(dep)
 visiting.remove(key);visited.add(key)
for key in ids:visit(key)
assert len(targets)==registry['total']-registry['supported']
lines=['# Atomic French diagnostic and pilot roadmap','',f"Updated: {plan['updated']}. Coordinator maintains this file from the JSON ledger; agents update their own workstream reports.",'',
'**Execution:** three GPT‑5.6 Sol agents, High reasoning. The coordinator integrates and releases validated changes. The objective still covers all five priorities and all 544 approved targets.','',
'## Order and parallel work','',
'1. The already deployed result/review fixes form the starting point.','2. Run adaptive testing (P2), material-history implementation (P3), and missing content (P4) in parallel. Prepare pilot observation tools (P5.01) alongside them.','3. Within each lane, finish the dependencies shown below before dependent work. Questions and lessons for one content target may be authored in parallel, but their joint validation must finish before publication.','4. Integrate one validated release at a time: inspect the diff → run relevant and integration checks → freeze the matching code/content → verify candidate → promote → verify public behavior → record the deployment.','5. Owner review can run alongside publication and student use. Real-student observation requires actual students; automated profiles do not satisfy that task. A supervised pilot can start within a verified supported scope before all 184 remaining targets are released.','',
'```mermaid','flowchart LR','  A[Existing deployed foundation] --> B[Adaptive profiles P2]','  A --> C[Prior-material coverage P3]','  A --> D[Missing content P4]','  A --> E[Pilot tools P5.01]','  B --> F[Validated integration]','  C --> F','  D --> F','  F --> G[Candidate check]','  G --> H[Production and public check]','  H --> I[Supervised pilot]','  E --> I','  E --> J[Owner review in parallel]','  I --> K[Teacher comparison and fixes]','```','',
'## Status rules','',
'`planned → assigned → in_progress → implemented → validated → production`. A passing local test is not a production release. Human review and student observation remain explicitly pending until real evidence exists. Failed checks return a task to implementation; source and deployment evidence stay attached.','',
'## Atomic integration tasks','',
'| ID | Goal | Depends on | Owner | Status |','|---|---|---|---|---|']
for task in tasks:
 lines.append('| '+' | '.join([task['id'],task['title'],', '.join(task['dependsOn']) or 'None',task['owner'],task['status']])+' |')
lines += ['', '## Acceptance criteria', '']
for task in tasks:
 lines += [f"- **{task['id']}** — {task['acceptance']}" + (f" Evidence: {', '.join(task['evidence'])}." if task['evidence'] else '')]
counts=Counter(task['status'] for target in targets for task in target['tasks'])
lines += ['', '## Remaining content: 184 individually tracked targets','',
'Each approved target has five atomic records: **Q** assessment question pool, **L** guided lesson, **V** binding/separation validation, **R** verified production publication, and **O** actual owner review. Q and L can run in parallel; V requires both; R requires V; O can run alongside release after Q/L exist. Shared content may satisfy several targets only when each target’s own requirements pass.','',
f"The registry contains {len(targets)} targets and {sum(counts.values())} target-level tasks. Status counts: "+', '.join(f'{key}: {value}' for key,value in sorted(counts.items()))+'.','',
'[Exact target IDs, labels, evidence requirements and task dependencies](remaining-target-goals-2026-09-13.json).','',
'## Workstream reports','',
'- [Adaptive assessment](workstreams/adaptive.md)','- [Prior-material recording](workstreams/material.md)','- [Content coverage](workstreams/coverage.md)','',
'## Release log','',
*[f"- `{release['deploymentId']}` · `{release['sourceCommit']}` · {release['status']}: {release['scope']} Evidence: {release['evidence']}." for release in plan.get('releases',[])],'- New agent work is not deployed until an explicit validated release entry is added.','',
'No completion date is invented. Scope coverage, acceptance evidence and actual releases determine progress.']
(directory/'atomic-roadmap-2026-09-13.md').write_text('\n'.join(lines)+'\n')
print(f'Validated {len(all_tasks)} task IDs and dependencies; rendered roadmap.')
