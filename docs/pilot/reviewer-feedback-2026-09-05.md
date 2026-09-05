# Retours de relecture — banque diagnostique v2 (état au 2026-09-05)

Source : `competency_item_review_assignments` et `competency_items.review_note` sur le projet
staging. Trois relecteurs actifs. Les décisions et les corrections de texte saisies dans le
portail sont déjà appliquées aux items ; ce document trace ce que les **notes libres** ont
déclenché.

| Relecteur | Approuvés | Rejetés | Encore assignés |
| --- | --- | --- | --- |
| Astrid | 182 | 8 | 37 |
| Jean-Philippe Kayobotsi | 23 | 0 | 204 |
| Alice Van Mierlo | 1 | 0 | 226 |

24 notes libres (19 sur des items approuvés, 5 sur des rejets).

## Ce qui a été fait le 2026-09-05

### 1. Corrections de formulation appliquées, items renvoyés dans la file de la relectrice

Sept items ont été modifiés d’après la note, repassés en `needs_human_review` et réassignés à
leur relectrice pour reconfirmation (journal : `content.items_revised_from_reviewer_notes`).

| Nœud | Changement |
| --- | --- |
| `interpreter_passe_compose` | Choix en phrases complètes (« C’est une action achevée. ») |
| `relation_exemple_reformulation` (gestes / sac) | Virgule avant « par exemple » ; ancienne forme conservée en réponse acceptable |
| `construction_chaine_reference` | « Réécris la deuxième phrase avec des pronoms » ; réponse « Ils les accompagnent. » |
| `relation_but` (afin que) | L’énoncé donne « peut dormir » et demande d’adapter le verbe |
| `construction_phrase_canonique` | « ordre canonique » → « ordre grammatical (sujet, verbe, complément) » |
| `construction_portee_negation` | Consigne reformulée : « la négation sert à indiquer que… » |
| `construction_point_de_vue_narratif` | Trois extraits narratifs comparables |

### 2. Rejets

Les cinq rejets motivés (réponse erronée sur a/à, choix en double, consignes lacunaires sur la
nominalisation et la progression thématique, ponctuation de la relative) passent par le flux de
remplacement existant (`diagnostic:replace-rejected:v2`). Les remplacements reviennent en
`needs_human_review`.

### 3. Portail : niveau visible

Quatre notes demandaient « pour quel âge ? ». Le portail affiche désormais, sous le titre de la
compétence, les attendus du programme (cycle 3 / cycle 4, évaluation 6e, brevet) issus de
`curriculum_mappings`, en plus des repères FLP / CECRL.

## À traiter par les auteurs de leçons

- `construction_accord_sujet_verbe` : la relectrice demande une explication des cas où
  « ni… ni » est suivi du singulier (sujets exclusifs : « Ni Paul ni Mina ne sera élu »).
  À ajouter dans la carte de règle (exceptions) de ce nœud.
- `construction_subordonnee_completive`, `construction_nominalisation` : les termes
  « complétive » et « nominaliser » supposent un enseignement préalable. Vérifier que la carte
  de règle définit le terme avant l’exercice ; sinon reformuler la consigne sans le terme.
- `construction_subordonnee_relative` : rappeler dans la carte la ponctuation de la relative
  explicative (virgules) par opposition à la déterminative.

## Notes sans action

« Assez simple », « trop facile peut-être » (trois notes) : le niveau visé est le début du
parcours (CM2–6e) ; l’affichage des attendus rend ce choix lisible. Aucune modification.

## Suite

- La relectrice retrouve les sept items modifiés en tête de sa file.
- `npm run diagnostic:plan-review-hour` a été relancé après synchronisation : 26 items rendent
  la banque publiable en mode partiel (`docs/pilot/review-hour-plan.md`).
