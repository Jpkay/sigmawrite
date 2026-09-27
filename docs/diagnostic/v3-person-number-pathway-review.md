# Person and number: teaching and assessment review

Draft feasibility only. No approval, publication or activation.

| Lesson | Eligible | Drafts | Distinct target sentences | Exposed by lesson | Guess floor | Minimum correct per pool | Initial / later | Allocation |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
| Choisir la forme du verbe qui va avec le sujet | 0 | 24 | 24 | 0 | 0.16666666666666666 | 3 | 12 / 12 | allocated |

Questions use the assessed sentence as their context identity, independently of task wording or question IDs. Repeated assessed sentences are retained at most once across the proposed pools, even if item IDs or instructions differ. Candidates whose annotated assessed sentence occurs in the lesson are excluded from both proposed pools. This detects exact normalized sentence reuse, not semantic paraphrases, complete exposure history or unannotated teaching material.

Six choices imply a 1/6 random-guess floor, requiring at least three correct answers for the chance gate. Distractor quality can make real guessing easier; the floor and difficulty require calibration. Graph accuracy and occasion criteria still apply. The category split is rechecked against the original evidence requirements. It does not guarantee balanced coverage of sentence constructions.

The subject is explicitly supplied. Choosing its grammatical person and number does not establish subject identification, verb production or free explanation. The bank has four cases per person/number combination, and the review allocator alternates each category between the two candidate pools, requiring every category in both. This reserves variety; it does not establish mastery of every category or force the live selector to ask one of each. Review grammatical versus referential number for on, polite vous and collective nouns, coordinated subjects and cues from verb endings. Review target fit, cueing and teaching overlap before publishing any binding.

The JSON pins target mappings, prerequisites, evidence rules, lesson/question checksums and material identities. No graph rule is weakened. Reproduce with npx tsx scripts/build-person-number-pathway-review.mts; append --check to verify.

## Category coverage

Balance: balanced.

| Category | Initial | Later |
| --- | ---: | ---: |
| listener-group | 2 | 2 |
| listener-one | 2 | 2 |
| other-group | 2 | 2 |
| other-one | 2 | 2 |
| speaker-group | 2 | 2 |
| speaker-one | 2 | 2 |

A balance failure remains explicit even if the generic pool has enough questions overall. Taught or discarded questions are never restored to fill a category. The runtime adapter independently derives sampling categories from the same complete six-choice format. Its allocator balances available categories when the evidence contract permits, and its selector prefers less-tested categories within a skill/mode. It does not import this draft review packet. Category sampling does not require testing all six categories before the existing target-level stopping rule can be met.

## Assessment drafts

### je-dessine

Je dessine un paysage.

Complète avec la bonne forme de « aller » : « Je ___ chercher un pinceau. »

- vais
- vas
- va
- allons
- allez
- vont

Answer: vais

Review rationale: Je commande la forme vais.

### j-ecoute

J’écoute cette chanson.

Complète avec la bonne forme de « être » : « Je ___ près des enceintes. »

- suis
- es
- est
- sommes
- êtes
- sont

Answer: suis

Review rationale: Je commande la forme suis.

### je-negation

Je ne regarde pas la série.

Complète avec la bonne forme de « être » : « Je ___ encore occupé. »

- suis
- es
- est
- sommes
- êtes
- sont

Answer: suis

Review rationale: La négation de la première phrase ne change pas la forme attendue avec je.

### je-incise

Demain, je préparerai le repas.

Complète avec la bonne forme de « aller » : « Je ___ acheter les ingrédients. »

- vais
- vas
- va
- allons
- allez
- vont

Answer: vais

Review rationale: Le moment indiqué ne change pas la forme attendue avec je.

### tu-choisis

Tu choisis un livre.

Complète avec la bonne forme de « avoir » : « Tu ___ plusieurs choix. »

- as
- ai
- a
- avons
- avez
- ont

Answer: as

Review rationale: Tu commande la forme as.

### tu-question

Pourquoi hésites-tu ?

Complète avec la bonne forme de « être » : « Tu ___ presque prêt. »

- es
- suis
- est
- sommes
- êtes
- sont

Answer: es

Review rationale: Même après le verbe dans la première question, tu commande la forme es.

### tu-negative

Tu ne connais pas ce chemin.

Complète avec la bonne forme de « aller » : « Tu ___ suivre le panneau. »

- vas
- vais
- va
- allons
- allez
- vont

Answer: vas

Review rationale: Tu commande la forme vas.

### tu-future

Ce soir, tu présenteras ton dessin.

Complète avec la bonne forme de « avoir » : « Tu ___ cinq minutes pour parler. »

- as
- ai
- a
- avons
- avez
- ont

Answer: as

Review rationale: Le moment de l’action ne change pas la forme attendue avec tu.

### nom-singulier

Le robot avance sur la piste.

Complète avec la bonne forme de « aller » : « Le robot ___ tourner à gauche. »

- va
- vais
- vas
- allons
- allez
- vont

Answer: va

Review rationale: Le robot commande la même forme que il : va.

### elle

Elle range les pinceaux.

Complète avec la bonne forme de « avoir » : « Elle ___ encore de la peinture. »

- a
- ai
- as
- avons
- avez
- ont

Answer: a

Review rationale: Elle commande la forme a.

### on-nous

On prépare notre spectacle. Ici, on désigne toute notre équipe.

Complète avec la bonne forme de « être » : « On ___ prêts à commencer. »

- est
- suis
- es
- sommes
- êtes
- sont

Answer: est

Review rationale: Même quand on désigne plusieurs personnes, on commande ici la forme est.

### collectif

La foule applaudit.

Complète avec la bonne forme de « aller » : « La foule ___ quitter la salle. »

- va
- vais
- vas
- allons
- allez
- vont

Answer: va

Review rationale: Le nom foule commande ici la forme va, même s’il désigne de nombreuses personnes.

### nous

Nous inventons une histoire.

Complète avec la bonne forme de « avoir » : « Nous ___ beaucoup d’idées. »

- avons
- ai
- as
- a
- avez
- ont

Answer: avons

Review rationale: Nous commande la forme avons.

### toi-moi

Toi et moi partageons cette table.

Complète avec la bonne forme de « être » : « Toi et moi ___ près de la fenêtre. »

- sommes
- suis
- es
- est
- êtes
- sont

Answer: sommes

Review rationale: Toi et moi commande la même forme que nous : sommes.

### elle-moi

Elle et moi dessinons les costumes.

Complète avec la bonne forme de « aller » : « Elle et moi ___ choisir les tissus. »

- allons
- vais
- vas
- va
- allez
- vont

Answer: allons

Review rationale: Elle et moi commande la même forme que nous : allons.

### vous-moi

Vous et moi organiserons la rencontre.

Complète avec la bonne forme de « avoir » : « Vous et moi ___ le même programme. »

- avons
- ai
- as
- a
- avez
- ont

Answer: avons

Review rationale: Vous et moi inclut la personne qui parle et commande avons.

### vous-groupe

Vous cherchez vos places. Je parle à trois amis.

Complète avec la bonne forme de « aller » : « Vous ___ entrer ensemble. »

- allez
- vais
- vas
- va
- allons
- vont

Answer: allez

Review rationale: Vous commande la forme allez.

### vous-politesse

Madame, vous pouvez entrer. Je parle à une seule personne.

Complète avec la bonne forme de « être » : « Vous ___ attendue dans le bureau. »

- êtes
- suis
- es
- est
- sommes
- sont

Answer: êtes

Review rationale: Même adressé à une seule personne poliment, vous commande êtes.

### toi-elle

Toi et elle préparerez les affiches.

Complète avec la bonne forme de « avoir » : « Toi et elle ___ tout le matériel. »

- avez
- ai
- as
- a
- avons
- ont

Answer: avez

Review rationale: Toi et elle commande la même forme que vous : avez.

### lui-toi

Lui et toi jouez dans la même équipe.

Complète avec la bonne forme de « être » : « Lui et toi ___ sur le terrain. »

- êtes
- suis
- es
- est
- sommes
- sont

Answer: êtes

Review rationale: Lui et toi commande la même forme que vous : êtes.

### elles

Elles arrivent avant le début du film.

Complète avec la bonne forme de « avoir » : « Elles ___ des places au premier rang. »

- ont
- ai
- as
- a
- avons
- avez

Answer: ont

Review rationale: Elles commande la forme ont.

### noms-coordonnes

Lina et Sami ferment la porte.

Complète avec la bonne forme de « aller » : « Lina et Sami ___ rejoindre le groupe. »

- vont
- vais
- vas
- va
- allons
- allez

Answer: vont

Review rationale: Lina et Sami commande la même forme que ils : vont.

### objets-pluriels

Les lampes éclairent la scène.

Complète avec la bonne forme de « être » : « Les lampes ___ près des rideaux. »

- sont
- suis
- es
- est
- sommes
- êtes

Answer: sont

Review rationale: Les lampes commande la même forme que elles : sont.

### lui-elle

Lui et elle repeignent le banc.

Complète avec la bonne forme de « avoir » : « Lui et elle ___ deux pots de peinture. »

- ont
- ai
- as
- a
- avons
- avez

Answer: ont

Review rationale: Lui et elle commande la même forme que ils : ont.

## Teaching draft

### Choisir la forme du verbe qui va avec le sujet

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

Complète avec la bonne forme de « avoir » : « Je ___ aussi du papier. »

ai / as / a / avons / avez / ont

Answer: ai
Hint: Regarde qui fait l’action, puis choisis la forme qui va avec. Attention à on et au vous de politesse.
Je commande la forme ai.

Tu portes le sac.

Complète avec la bonne forme de « être » : « Tu ___ près de la porte. »

suis / es / est / sommes / êtes / sont

Answer: es
Hint: Regarde qui fait l’action, puis choisis la forme qui va avec. Attention à on et au vous de politesse.
Tu commande la forme es.

On travaille ensemble. Ici, on désigne mes amis et moi.

Complète avec la bonne forme de « aller » : « On ___ finir avant midi. »

vais / vas / va / allons / allez / vont

Answer: va
Hint: Regarde qui fait l’action, puis choisis la forme qui va avec. Attention à on et au vous de politesse.
On commande va, même lorsqu’il désigne plusieurs personnes.

Mon frère et moi cuisinons.

Complète avec la bonne forme de « avoir » : « Mon frère et moi ___ tous les ingrédients. »

ai / as / a / avons / avez / ont

Answer: avons
Hint: Regarde qui fait l’action, puis choisis la forme qui va avec. Attention à on et au vous de politesse.
Mon frère et moi commande la même forme que nous : avons.

Monsieur, vous avez oublié votre écharpe.

Complète avec la bonne forme de « être » : « vous ___ déjà attendu dehors. »

suis / es / est / sommes / êtes / sont

Answer: êtes
Hint: Regarde qui fait l’action, puis choisis la forme qui va avec. Attention à on et au vous de politesse.
Même pour un seul monsieur, vous commande êtes.

Les vélos restent dehors.

Complète avec la bonne forme de « aller » : « Les vélos ___ rester sous l’abri. »

vais / vas / va / allons / allez / vont

Answer: vont
Hint: Regarde qui fait l’action, puis choisis la forme qui va avec. Attention à on et au vous de politesse.
Les vélos commande la même forme que ils : vont.
