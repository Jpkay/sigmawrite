# Person and number: teaching and assessment review

Draft feasibility only. No approval, publication or activation.

| Lesson | Eligible | Drafts | Distinct target sentences | Exposed by lesson | Guess floor | Minimum correct per pool | Initial / later | Allocation |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
| Qui parle, à qui, et de qui ? | 0 | 24 | 24 | 0 | 0.16666666666666666 | 3 | 12 / 12 | allocated |

Questions use the assessed sentence as their context identity, independently of task wording or question IDs. Repeated assessed sentences are retained at most once across the proposed pools, even if item IDs or instructions differ. Candidates whose annotated assessed sentence occurs in the lesson are excluded from both proposed pools. This detects exact normalized sentence reuse, not semantic paraphrases, complete exposure history or unannotated teaching material.

Six choices imply a 1/6 random-guess floor, requiring at least three correct answers for the chance gate. Distractor quality can make real guessing easier; the floor and difficulty require calibration. Graph accuracy and occasion criteria still apply. The category split is rechecked against the original evidence requirements. It does not guarantee balanced coverage of sentence constructions.

The subject is explicitly supplied. Choosing its grammatical person and number does not establish subject identification, verb production or free explanation. The bank has four cases per person/number combination, and the review allocator alternates each category between the two candidate pools, requiring every category in both. This reserves variety; it does not establish mastery of every category or force the live selector to ask one of each. Review grammatical versus referential number for on, polite vous and collective nouns, coordinated subjects and cues from verb endings. Review target fit, cueing and teaching overlap before publishing any binding.

The JSON pins target mappings, prerequisites, evidence rules, lesson/question checksums and material identities. No graph rule is weakened. Reproduce with npx tsx scripts/build-person-number-pathway-review.mts; append --check to verify.

## Category coverage

Balance: balanced.

| Category | Initial | Later |
| --- | ---: | ---: |
| 1re personne du pluriel | 2 | 2 |
| 1re personne du singulier | 2 | 2 |
| 2e personne du pluriel | 2 | 2 |
| 2e personne du singulier | 2 | 2 |
| 3e personne du pluriel | 2 | 2 |
| 3e personne du singulier | 2 | 2 |

A balance failure remains explicit even if the generic pool has enough questions overall. Taught or discarded questions are never restored to fill a category. The runtime adapter independently derives sampling categories from the same complete six-choice format. Its allocator balances available categories when the evidence contract permits, and its selector prefers less-tested categories within a skill/mode. It does not import this draft review packet. Category sampling does not require testing all six categories before the existing target-level stopping rule can be met.

## Assessment drafts

### je-dessine

Je dessine un paysage.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Je » pour l’accord du verbe ?

- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 1re personne du singulier

Review rationale: Je désigne la personne qui parle : première personne du singulier.

### j-ecoute

J’écoute cette chanson.

Quelle personne et quel nombre grammaticaux correspondent au sujet « J’ » pour l’accord du verbe ?

- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 1re personne du singulier

Review rationale: J’ est la forme de je devant une voyelle; la personne et le nombre ne changent pas.

### je-negation

Je ne regarde pas la série.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Je » pour l’accord du verbe ?

- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 1re personne du singulier

Review rationale: La négation ne change pas les traits du sujet je.

### je-incise

Demain, je préparerai le repas.

Quelle personne et quel nombre grammaticaux correspondent au sujet « je » pour l’accord du verbe ?

- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 1re personne du singulier

Review rationale: Le moment de l’action ne change pas la personne et le nombre de je.

### tu-choisis

Tu choisis un livre.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Tu » pour l’accord du verbe ?

- 2e personne du singulier
- 1re personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 2e personne du singulier

Review rationale: Tu désigne une seule personne à qui l’on parle.

### tu-question

Pourquoi hésites-tu ?

Quelle personne et quel nombre grammaticaux correspondent au sujet « tu » pour l’accord du verbe ?

- 2e personne du singulier
- 1re personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 2e personne du singulier

Review rationale: Même après le verbe dans une question, tu reste à la deuxième personne du singulier.

### tu-negative

Tu ne connais pas ce chemin.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Tu » pour l’accord du verbe ?

- 2e personne du singulier
- 1re personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 2e personne du singulier

Review rationale: La négation ne modifie pas les traits de tu.

### tu-future

Ce soir, tu présenteras ton dessin.

Quelle personne et quel nombre grammaticaux correspondent au sujet « tu » pour l’accord du verbe ?

- 2e personne du singulier
- 1re personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 2e personne du singulier

Review rationale: Le futur du verbe ne modifie pas les traits de tu.

### nom-singulier

Le robot avance sur la piste.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Le robot » pour l’accord du verbe ?

- 3e personne du singulier
- 1re personne du singulier
- 2e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 3e personne du singulier

Review rationale: Ce groupe se remplace par il : troisième personne du singulier, même si le robot n’est pas humain.

### elle

Elle range les pinceaux.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Elle » pour l’accord du verbe ?

- 3e personne du singulier
- 1re personne du singulier
- 2e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 3e personne du singulier

Review rationale: Elle désigne un être dont on parle : troisième personne du singulier.

### on-nous

On prépare notre spectacle. Ici, on désigne toute notre équipe.

Quelle personne et quel nombre grammaticaux correspondent au sujet « On » pour l’accord du verbe ?

- 3e personne du singulier
- 1re personne du singulier
- 2e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 3e personne du singulier

Review rationale: Même quand on désigne plusieurs personnes, sa personne grammaticale reste la troisième du singulier.

### collectif

La foule applaudit.

Quelle personne et quel nombre grammaticaux correspondent au sujet « La foule » pour l’accord du verbe ?

- 3e personne du singulier
- 1re personne du singulier
- 2e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 3e personne du singulier

Review rationale: Le nom foule est singulier. Le groupe se remplace par elle, même s’il désigne de nombreuses personnes.

### nous

Nous inventons une histoire.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Nous » pour l’accord du verbe ?

- 1re personne du pluriel
- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 1re personne du pluriel

Review rationale: Nous comprend la personne qui parle et au moins une autre personne.

### toi-moi

Toi et moi partageons cette table.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Toi et moi » pour l’accord du verbe ?

- 1re personne du pluriel
- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 1re personne du pluriel

Review rationale: La personne qui parle, moi, fait partie du groupe : on le remplace par nous.

### elle-moi

Elle et moi dessinons les costumes.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Elle et moi » pour l’accord du verbe ?

- 1re personne du pluriel
- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 1re personne du pluriel

Review rationale: Un groupe comprenant moi se remplace ici par nous, pas par elles.

### vous-moi

Vous et moi organiserons la rencontre.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Vous et moi » pour l’accord du verbe ?

- 1re personne du pluriel
- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 2e personne du pluriel
- 3e personne du pluriel

Answer: 1re personne du pluriel

Review rationale: Le groupe inclut moi : la première personne commande l’accord au pluriel.

### vous-groupe

Vous cherchez vos places. Je parle à trois amis.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Vous » pour l’accord du verbe ?

- 2e personne du pluriel
- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 3e personne du pluriel

Answer: 2e personne du pluriel

Review rationale: Vous s’adresse ici à plusieurs personnes : deuxième personne du pluriel.

### vous-politesse

Madame, vous pouvez entrer. Je parle à une seule personne.

Quelle personne et quel nombre grammaticaux correspondent au sujet « vous » pour l’accord du verbe ?

- 2e personne du pluriel
- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 3e personne du pluriel

Answer: 2e personne du pluriel

Review rationale: Le vous de politesse garde les traits grammaticaux de la deuxième personne du pluriel pour le verbe.

### toi-elle

Toi et elle préparerez les affiches.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Toi et elle » pour l’accord du verbe ?

- 2e personne du pluriel
- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 3e personne du pluriel

Answer: 2e personne du pluriel

Review rationale: Le groupe inclut la personne à qui l’on parle, toi, sans inclure moi : il se remplace par vous.

### lui-toi

Lui et toi jouez dans la même équipe.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Lui et toi » pour l’accord du verbe ?

- 2e personne du pluriel
- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 3e personne du pluriel

Answer: 2e personne du pluriel

Review rationale: Lui et toi se remplace par vous : deuxième personne du pluriel.

### elles

Elles arrivent avant le début du film.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Elles » pour l’accord du verbe ?

- 3e personne du pluriel
- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel

Answer: 3e personne du pluriel

Review rationale: Elles désigne plusieurs êtres dont on parle : troisième personne du pluriel.

### noms-coordonnes

Lina et Sami ferment la porte.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Lina et Sami » pour l’accord du verbe ?

- 3e personne du pluriel
- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel

Answer: 3e personne du pluriel

Review rationale: Ces deux personnes sont celles dont on parle : le groupe se remplace par ils.

### objets-pluriels

Les lampes éclairent la scène.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Les lampes » pour l’accord du verbe ?

- 3e personne du pluriel
- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel

Answer: 3e personne du pluriel

Review rationale: Les lampes se remplace par elles : troisième personne du pluriel, même pour des objets.

### lui-elle

Lui et elle repeignent le banc.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Lui et elle » pour l’accord du verbe ?

- 3e personne du pluriel
- 1re personne du singulier
- 2e personne du singulier
- 3e personne du singulier
- 1re personne du pluriel
- 2e personne du pluriel

Answer: 3e personne du pluriel

Review rationale: Ni moi ni toi ne figure dans ce groupe : il se remplace par ils.

## Teaching draft

### Qui parle, à qui, et de qui ?

Pourquoi dit-on je chante, tu chantes et nous chantons ?

Je chante. Tu danses. Elle filme.

Je désigne la personne qui parle : première personne. Tu désigne celle à qui l’on parle : deuxième personne. Elle désigne celle dont on parle : troisième personne. Ici, les trois sujets sont au singulier.

Nous chantons. Vous dansez. Ils filment.

Nous inclut la personne qui parle : première personne du pluriel. Vous désigne ceux à qui l’on parle : deuxième personne du pluriel. Ils et elles désignent ceux dont on parle : troisième personne du pluriel. Singulier et pluriel sont les deux nombres grammaticaux.

Le chien court. Les chiens courent. Toi et moi courons. Toi et Léa courez.

Remplace le sujet par un pronom : le chien devient il; les chiens devient ils. Toi et moi devient nous, car moi fait partie du groupe. Toi et Léa devient vous : on s’adresse à toi, sans inclure moi. La personne grammaticale sert aussi pour les animaux et les objets.

On part ensemble. Madame, vous êtes attendue.

Ne compte pas seulement les personnes réelles. On garde la troisième personne du singulier pour le verbe, même s’il signifie nous. Vous garde la deuxième personne du pluriel pour le verbe, même si l’on parle poliment à une seule dame. Dans le second exemple, êtes s’accorde avec vous; attendue est féminin singulier parce qu’il s’agit d’une seule dame.

Pour accorder le verbe, associe le sujet à je, tu, il/elle/on, nous, vous ou ils/elles. Vérifie à la fois sa personne et son nombre grammaticaux. Si le groupe comprend moi, pense à nous; s’il comprend toi sans moi, pense à vous.

Boundary: Cette leçon te donne le sujet et t’aide à trouver ses traits pour le verbe. Elle ne vérifie pas encore que tu sais trouver le sujet dans toute phrase ni écrire toutes les formes du verbe. Avec on ou un vous de politesse, l’accord d’un adjectif ou d’un participe peut dépendre des personnes désignées; ne lui applique pas automatiquement le nombre du verbe.

J’apporte les feutres.

Quelle personne et quel nombre grammaticaux correspondent au sujet « J’ » pour le verbe ?

1re personne du singulier / 2e personne du singulier / 3e personne du singulier / 1re personne du pluriel / 2e personne du pluriel / 3e personne du pluriel

Answer: 1re personne du singulier
Hint: Compare le sujet à je, tu, il/elle/on, nous, vous et ils/elles. Attention à on et au vous de politesse.
J’ remplace je devant une voyelle : première personne du singulier.

Tu portes le sac.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Tu » pour le verbe ?

1re personne du singulier / 2e personne du singulier / 3e personne du singulier / 1re personne du pluriel / 2e personne du pluriel / 3e personne du pluriel

Answer: 2e personne du singulier
Hint: Compare le sujet à je, tu, il/elle/on, nous, vous et ils/elles. Attention à on et au vous de politesse.
Tu désigne la personne à qui l’on parle : deuxième personne du singulier.

On travaille ensemble. Ici, on désigne mes amis et moi.

Quelle personne et quel nombre grammaticaux correspondent au sujet « On » pour le verbe ?

1re personne du singulier / 2e personne du singulier / 3e personne du singulier / 1re personne du pluriel / 2e personne du pluriel / 3e personne du pluriel

Answer: 3e personne du singulier
Hint: Compare le sujet à je, tu, il/elle/on, nous, vous et ils/elles. Attention à on et au vous de politesse.
On peut désigner notre groupe, mais il commande un verbe à la troisième personne du singulier.

Mon frère et moi cuisinons.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Mon frère et moi » pour le verbe ?

1re personne du singulier / 2e personne du singulier / 3e personne du singulier / 1re personne du pluriel / 2e personne du pluriel / 3e personne du pluriel

Answer: 1re personne du pluriel
Hint: Compare le sujet à je, tu, il/elle/on, nous, vous et ils/elles. Attention à on et au vous de politesse.
Le groupe comprend moi; on le remplace par nous : première personne du pluriel.

Monsieur, vous avez oublié votre écharpe.

Quelle personne et quel nombre grammaticaux correspondent au sujet « vous » pour le verbe ?

1re personne du singulier / 2e personne du singulier / 3e personne du singulier / 1re personne du pluriel / 2e personne du pluriel / 3e personne du pluriel

Answer: 2e personne du pluriel
Hint: Compare le sujet à je, tu, il/elle/on, nous, vous et ils/elles. Attention à on et au vous de politesse.
Même pour un seul monsieur, le vous de politesse commande la deuxième personne du pluriel au verbe.

Les vélos restent dehors.

Quelle personne et quel nombre grammaticaux correspondent au sujet « Les vélos » pour le verbe ?

1re personne du singulier / 2e personne du singulier / 3e personne du singulier / 1re personne du pluriel / 2e personne du pluriel / 3e personne du pluriel

Answer: 3e personne du pluriel
Hint: Compare le sujet à je, tu, il/elle/on, nous, vous et ils/elles. Attention à on et au vous de politesse.
Les vélos se remplace par ils : troisième personne du pluriel. Personne grammaticale ne signifie pas être humain.
