# Doves teacher demonstration · 11 September 2026

Synthetic account: doves.demo, in the same Doves school and demonstration class as
doves.student. Credentials are stored separately in /tmp/plume-doves-demo.json;
they are not included in this guide or the answer review.

Completed the deployed diagnostic through the student interface: 48 questions,
31 marked correct and 17 incorrect. This is simulated behaviour, not an assessment
of a real student. The answers intentionally show relative-pronoun, object-pronoun,
avoir agreement and plus-que-parfait difficulties alongside stronger responses.

## Presentation order

1. Open the completed results tab at https://app.trouvetaplume.com/student/diagnostic.
   Its saved result shows 5 mastered, 21 to consolidate, 1 to build and 134 to verify.
   These are the deployed system's classifications; unknown is not failure.
2. Log in as doves.demo and open
   https://app.trouvetaplume.com/student/diagnostic/demo-review. Use Les erreurs / Les réussites.
   All questions, submitted answers and stored expected answers are available.
3. Show the lesson introductions:
   - https://app.trouvetaplume.com/student/practice/d3f58bbc-764d-5d56-bacc-a707d8306dfe
   - https://app.trouvetaplume.com/student/practice/8b76dea6-193a-5b70-9b10-0c6ab0475efc

## Verified limitation

The current lesson introductions load but are generic. The first pronoun exercise
accepted and stored “que” as correct, then surfaced a React server error instead
of feedback. Do not describe exercise submission as verified working. The database cause was subsequently fixed by migration 0145 and verified with a
rolled-back production transaction. Fresh end-to-end exercise feedback still needs
verification; the diagnostic and its answer review completed correctly.
No graph release or application deployment was performed for this demonstration.
The granular graph implementation continues separately.

## Export refresh

node --import tsx scripts/export-doves-demo-diagnostic.mts

Read-only export, scoped to this synthetic student. It includes no credentials or
other students' data. Local HTTP server is loopback-only on port 4187.

## Deployed answer review

The authenticated demo-review route serves a saved snapshot of this synthetic
session. It is restricted to the doves.demo auth user, sends private/no-store
headers, and does not publish the answer keys as public static assets.
The snapshot contains all 48 answers (31 correct and 17 incorrect).
