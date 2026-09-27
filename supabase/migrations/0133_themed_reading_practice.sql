begin;
-- Practice-only drafts. They are never added to diagnostic memberships and must
-- pass the normal reviewer approval before a student can receive them.

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '0534d217-e0d4-5b12-a699-40565e5bfeaf'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, l’équipe de football de Nora perd souvent le ballon parce que ses joueurs se parlent peu. Nora propose de consacrer dix minutes de chaque entraînement à des passes accompagnées d’un appel du prénom du partenaire. Elle note les pertes de balle pendant les petits matchs. Après quatre séances, leur nombre passe de vingt à douze par match.

Nora souhaite garder cet exercice, car elle trouve la circulation du ballon plus facile. Sami préférerait utiliser ces dix minutes pour tirer au but : il juge les passes répétées ennuyeuses. L’entraîneuse propose d’alterner les deux activités. Elle précise que les adversaires n’étaient pas les mêmes à chaque match ; les notes de Nora sont encourageantes, mais ne prouvent pas que cet exercice explique à lui seul le progrès.

Reformule avec tes mots : « Les pertes de balle passent de vingt à douze par match. »','Réponds avec tes mots en t’appuyant sur le texte.','L’équipe ne perd plus que douze ballons par rencontre, contre vingt auparavant.','{}'::text[],'exact','{"interestKeys":["football"],"interestLabelFr":"Football","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Conserve cette information : Les pertes de balle passent de vingt à douze par match.","Reformule avec tes propres mots, sans simplement recopier la citation."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='reformuler_sans_copier'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '39df8ddc-5b3e-503b-8c7c-bc16ec87e590'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, l’équipe de football de Nora perd souvent le ballon parce que ses joueurs se parlent peu. Nora propose de consacrer dix minutes de chaque entraînement à des passes accompagnées d’un appel du prénom du partenaire. Elle note les pertes de balle pendant les petits matchs. Après quatre séances, leur nombre passe de vingt à douze par match.

Nora souhaite garder cet exercice, car elle trouve la circulation du ballon plus facile. Sami préférerait utiliser ces dix minutes pour tirer au but : il juge les passes répétées ennuyeuses. L’entraîneuse propose d’alterner les deux activités. Elle précise que les adversaires n’étaient pas les mêmes à chaque match ; les notes de Nora sont encourageantes, mais ne prouvent pas que cet exercice explique à lui seul le progrès.

Résume en une phrase le problème rencontré et la solution proposée.','Réponds avec tes mots en t’appuyant sur le texte.','L’équipe perd souvent le ballon parce que les joueurs communiquent peu ; nora met en place un exercice de passes où les joueurs appellent leur partenaire.','{}'::text[],'exact','{"interestKeys":["football"],"interestLabelFr":"Football","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Présente le problème : L’équipe perd souvent le ballon parce que les joueurs communiquent peu.","Explique la solution : Nora met en place un exercice de passes où les joueurs appellent leur partenaire."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='organiser_resume_informatif'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '6ecae2f9-ff15-55bb-800e-3067a5423ecd'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, l’équipe de football de Nora perd souvent le ballon parce que ses joueurs se parlent peu. Nora propose de consacrer dix minutes de chaque entraînement à des passes accompagnées d’un appel du prénom du partenaire. Elle note les pertes de balle pendant les petits matchs. Après quatre séances, leur nombre passe de vingt à douze par match.

Nora souhaite garder cet exercice, car elle trouve la circulation du ballon plus facile. Sami préférerait utiliser ces dix minutes pour tirer au but : il juge les passes répétées ennuyeuses. L’entraîneuse propose d’alterner les deux activités. Elle précise que les adversaires n’étaient pas les mêmes à chaque match ; les notes de Nora sont encourageantes, mais ne prouvent pas que cet exercice explique à lui seul le progrès.

Résume le récit en une phrase reliant la situation, l’action et le résultat.','Réponds avec tes mots en t’appuyant sur le texte.','L’équipe perd souvent le ballon parce que les joueurs communiquent peu ; Nora met en place un exercice de passes où les joueurs appellent leur partenaire ; Les pertes de balle passent de vingt à douze par match.','{}'::text[],'exact','{"interestKeys":["football"],"interestLabelFr":"Football","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["L’équipe perd souvent le ballon parce que les joueurs communiquent peu.","Nora met en place un exercice de passes où les joueurs appellent leur partenaire.","Les pertes de balle passent de vingt à douze par match."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='organiser_resume_narratif'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'c9de6cd1-6e3e-5c1c-b073-2f3b1c503c3d'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, l’équipe de football de Nora perd souvent le ballon parce que ses joueurs se parlent peu. Nora propose de consacrer dix minutes de chaque entraînement à des passes accompagnées d’un appel du prénom du partenaire. Elle note les pertes de balle pendant les petits matchs. Après quatre séances, leur nombre passe de vingt à douze par match.

Nora souhaite garder cet exercice, car elle trouve la circulation du ballon plus facile. Sami préférerait utiliser ces dix minutes pour tirer au but : il juge les passes répétées ennuyeuses. L’entraîneuse propose d’alterner les deux activités. Elle précise que les adversaires n’étaient pas les mêmes à chaque match ; les notes de Nora sont encourageantes, mais ne prouvent pas que cet exercice explique à lui seul le progrès.

Compare les deux points de vue exprimés à propos de la nouvelle méthode.','Réponds avec tes mots en t’appuyant sur le texte.','Nora veut poursuivre les passes avec communication, tandis que Sami préfère travailler les tirs.','{}'::text[],'exact','{"interestKeys":["football"],"interestLabelFr":"Football","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Compare les deux positions en les attribuant aux bonnes personnes : Nora veut poursuivre les passes avec communication, tandis que Sami préfère travailler les tirs."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='comparer_points_de_vue'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'fe53eb77-5e85-5aa1-8f30-b7cde0963b54'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, l’équipe de football de Nora perd souvent le ballon parce que ses joueurs se parlent peu. Nora propose de consacrer dix minutes de chaque entraînement à des passes accompagnées d’un appel du prénom du partenaire. Elle note les pertes de balle pendant les petits matchs. Après quatre séances, leur nombre passe de vingt à douze par match.

Nora souhaite garder cet exercice, car elle trouve la circulation du ballon plus facile. Sami préférerait utiliser ces dix minutes pour tirer au but : il juge les passes répétées ennuyeuses. L’entraîneuse propose d’alterner les deux activités. Elle précise que les adversaires n’étaient pas les mêmes à chaque match ; les notes de Nora sont encourageantes, mais ne prouvent pas que cet exercice explique à lui seul le progrès.

Que suggère ce résultat sur l’utilité de la méthode proposée : « Les pertes de balle passent de vingt à douze par match. » ?','Réponds avec tes mots en t’appuyant sur le texte.','Ces résultats suggèrent que mieux communiquer pendant les passes peut aider l’équipe à conserver le ballon.','{}'::text[],'exact','{"interestKeys":["football"],"interestLabelFr":"Football","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Interprète le résultat au-delà du chiffre : Ces résultats suggèrent que mieux communiquer pendant les passes peut aider l’équipe à conserver le ballon."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='relier_preuve_interpretation'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '3bc2aa1c-603d-52fa-ade0-c3179a44e465'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le groupe de musique de Lina prépare une fête au collège. Les musiciens ont du mal à commencer ensemble. Lina enregistre une répétition et relève six départs décalés. Elle propose ensuite qu’un membre donne quatre pulsations régulières avant chaque morceau. Après plusieurs essais, le groupe enregistre de nouveau sa répétition. Il ne compte plus que deux départs décalés.

Lina souhaite conserver ce signal commun. Yanis préfère commencer directement, car le compte lui semble casser la spontanéité. Ils décident d’utiliser le signal pendant les répétitions et d’en discuter avant le concert. Leur professeur les invite à rester prudents : le groupe connaissait aussi mieux les morceaux lors du second enregistrement.

Reformule avec tes mots : « Le nombre de départs décalés passe de six à deux. »','Réponds avec tes mots en t’appuyant sur le texte.','On ne relève plus que deux débuts mal synchronisés, contre six au départ.','{}'::text[],'exact','{"interestKeys":["music"],"interestLabelFr":"Musique","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Conserve cette information : Le nombre de départs décalés passe de six à deux.","Reformule avec tes propres mots, sans simplement recopier la citation."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='reformuler_sans_copier'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '9c9e42ae-6e30-5150-9818-1b68d708c971'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le groupe de musique de Lina prépare une fête au collège. Les musiciens ont du mal à commencer ensemble. Lina enregistre une répétition et relève six départs décalés. Elle propose ensuite qu’un membre donne quatre pulsations régulières avant chaque morceau. Après plusieurs essais, le groupe enregistre de nouveau sa répétition. Il ne compte plus que deux départs décalés.

Lina souhaite conserver ce signal commun. Yanis préfère commencer directement, car le compte lui semble casser la spontanéité. Ils décident d’utiliser le signal pendant les répétitions et d’en discuter avant le concert. Leur professeur les invite à rester prudents : le groupe connaissait aussi mieux les morceaux lors du second enregistrement.

Résume en une phrase le problème rencontré et la solution proposée.','Réponds avec tes mots en t’appuyant sur le texte.','Les musiciens n’arrivent pas à commencer les morceaux ensemble ; lina propose de donner quatre pulsations communes avant chaque morceau.','{}'::text[],'exact','{"interestKeys":["music"],"interestLabelFr":"Musique","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Présente le problème : Les musiciens n’arrivent pas à commencer les morceaux ensemble.","Explique la solution : Lina propose de donner quatre pulsations communes avant chaque morceau."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='organiser_resume_informatif'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'e4e46dc0-6d86-544b-963d-4845efd3990e'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le groupe de musique de Lina prépare une fête au collège. Les musiciens ont du mal à commencer ensemble. Lina enregistre une répétition et relève six départs décalés. Elle propose ensuite qu’un membre donne quatre pulsations régulières avant chaque morceau. Après plusieurs essais, le groupe enregistre de nouveau sa répétition. Il ne compte plus que deux départs décalés.

Lina souhaite conserver ce signal commun. Yanis préfère commencer directement, car le compte lui semble casser la spontanéité. Ils décident d’utiliser le signal pendant les répétitions et d’en discuter avant le concert. Leur professeur les invite à rester prudents : le groupe connaissait aussi mieux les morceaux lors du second enregistrement.

Résume le récit en une phrase reliant la situation, l’action et le résultat.','Réponds avec tes mots en t’appuyant sur le texte.','Les musiciens n’arrivent pas à commencer les morceaux ensemble ; Lina propose de donner quatre pulsations communes avant chaque morceau ; Le nombre de départs décalés passe de six à deux.','{}'::text[],'exact','{"interestKeys":["music"],"interestLabelFr":"Musique","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Les musiciens n’arrivent pas à commencer les morceaux ensemble.","Lina propose de donner quatre pulsations communes avant chaque morceau.","Le nombre de départs décalés passe de six à deux."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='organiser_resume_narratif'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '6548e5b0-e784-5018-9051-a2dd328cdfb4'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le groupe de musique de Lina prépare une fête au collège. Les musiciens ont du mal à commencer ensemble. Lina enregistre une répétition et relève six départs décalés. Elle propose ensuite qu’un membre donne quatre pulsations régulières avant chaque morceau. Après plusieurs essais, le groupe enregistre de nouveau sa répétition. Il ne compte plus que deux départs décalés.

Lina souhaite conserver ce signal commun. Yanis préfère commencer directement, car le compte lui semble casser la spontanéité. Ils décident d’utiliser le signal pendant les répétitions et d’en discuter avant le concert. Leur professeur les invite à rester prudents : le groupe connaissait aussi mieux les morceaux lors du second enregistrement.

Compare les deux points de vue exprimés à propos de la nouvelle méthode.','Réponds avec tes mots en t’appuyant sur le texte.','Lina souhaite un signal commun, tandis que Yanis préfère un départ spontané sans compter.','{}'::text[],'exact','{"interestKeys":["music"],"interestLabelFr":"Musique","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Compare les deux positions en les attribuant aux bonnes personnes : Lina souhaite un signal commun, tandis que Yanis préfère un départ spontané sans compter."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='comparer_points_de_vue'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '2f73b292-cf5f-5fa0-af2d-e26197c1acdd'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le groupe de musique de Lina prépare une fête au collège. Les musiciens ont du mal à commencer ensemble. Lina enregistre une répétition et relève six départs décalés. Elle propose ensuite qu’un membre donne quatre pulsations régulières avant chaque morceau. Après plusieurs essais, le groupe enregistre de nouveau sa répétition. Il ne compte plus que deux départs décalés.

Lina souhaite conserver ce signal commun. Yanis préfère commencer directement, car le compte lui semble casser la spontanéité. Ils décident d’utiliser le signal pendant les répétitions et d’en discuter avant le concert. Leur professeur les invite à rester prudents : le groupe connaissait aussi mieux les morceaux lors du second enregistrement.

Que suggère ce résultat sur l’utilité de la méthode proposée : « Le nombre de départs décalés passe de six à deux. » ?','Réponds avec tes mots en t’appuyant sur le texte.','Cette diminution suggère qu’un signal partagé peut aider les musiciens à démarrer ensemble.','{}'::text[],'exact','{"interestKeys":["music"],"interestLabelFr":"Musique","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Interprète le résultat au-delà du chiffre : Cette diminution suggère qu’un signal partagé peut aider les musiciens à démarrer ensemble."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='relier_preuve_interpretation'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'bb92e96d-ee21-5826-9029-4261d43c9611'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, Amine et ses amis testent un jeu coopératif qu’ils ont créé au club informatique. Leur équipe échoue souvent parce que deux joueurs cherchent le même objet pendant que personne ne surveille la porte. Amine propose de répartir les rôles avant chaque partie. Sur la première série de dix essais, ils terminent trois missions ; dans la série suivante, avec les rôles répartis, ils en terminent sept.

Amine veut garder cette organisation pour mieux coopérer. Zoé préfère choisir librement son rôle en cours de partie, afin de varier les expériences. Le club propose de changer les rôles entre les parties. Comme les joueurs connaissent mieux le jeu au fil des essais, ils ne peuvent pas attribuer toute leur progression à la répartition des rôles.

Reformule avec tes mots : « Les missions réussies passent de trois à sept sur dix essais. »','Réponds avec tes mots en t’appuyant sur le texte.','Sur dix parties, le groupe atteint son objectif sept fois au lieu de trois.','{}'::text[],'exact','{"interestKeys":["gaming"],"interestLabelFr":"Jeux vidéo","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Conserve cette information : Les missions réussies passent de trois à sept sur dix essais.","Reformule avec tes propres mots, sans simplement recopier la citation."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='reformuler_sans_copier'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '755b25d0-4da5-591b-ba64-7c581e75ab0f'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, Amine et ses amis testent un jeu coopératif qu’ils ont créé au club informatique. Leur équipe échoue souvent parce que deux joueurs cherchent le même objet pendant que personne ne surveille la porte. Amine propose de répartir les rôles avant chaque partie. Sur la première série de dix essais, ils terminent trois missions ; dans la série suivante, avec les rôles répartis, ils en terminent sept.

Amine veut garder cette organisation pour mieux coopérer. Zoé préfère choisir librement son rôle en cours de partie, afin de varier les expériences. Le club propose de changer les rôles entre les parties. Comme les joueurs connaissent mieux le jeu au fil des essais, ils ne peuvent pas attribuer toute leur progression à la répartition des rôles.

Résume en une phrase le problème rencontré et la solution proposée.','Réponds avec tes mots en t’appuyant sur le texte.','Les joueurs échouent parce que certaines tâches sont faites en double et d’autres oubliées ; amine propose de répartir les rôles avant la partie.','{}'::text[],'exact','{"interestKeys":["gaming"],"interestLabelFr":"Jeux vidéo","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Présente le problème : Les joueurs échouent parce que certaines tâches sont faites en double et d’autres oubliées.","Explique la solution : Amine propose de répartir les rôles avant la partie."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='organiser_resume_informatif'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'ae455ec9-0f29-5c90-8fba-0decd386fd6d'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, Amine et ses amis testent un jeu coopératif qu’ils ont créé au club informatique. Leur équipe échoue souvent parce que deux joueurs cherchent le même objet pendant que personne ne surveille la porte. Amine propose de répartir les rôles avant chaque partie. Sur la première série de dix essais, ils terminent trois missions ; dans la série suivante, avec les rôles répartis, ils en terminent sept.

Amine veut garder cette organisation pour mieux coopérer. Zoé préfère choisir librement son rôle en cours de partie, afin de varier les expériences. Le club propose de changer les rôles entre les parties. Comme les joueurs connaissent mieux le jeu au fil des essais, ils ne peuvent pas attribuer toute leur progression à la répartition des rôles.

Résume le récit en une phrase reliant la situation, l’action et le résultat.','Réponds avec tes mots en t’appuyant sur le texte.','Les joueurs échouent parce que certaines tâches sont faites en double et d’autres oubliées ; Amine propose de répartir les rôles avant la partie ; Les missions réussies passent de trois à sept sur dix essais.','{}'::text[],'exact','{"interestKeys":["gaming"],"interestLabelFr":"Jeux vidéo","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Les joueurs échouent parce que certaines tâches sont faites en double et d’autres oubliées.","Amine propose de répartir les rôles avant la partie.","Les missions réussies passent de trois à sept sur dix essais."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='organiser_resume_narratif'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'f9bd38bd-41da-5b9c-9888-892a6e8f3289'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, Amine et ses amis testent un jeu coopératif qu’ils ont créé au club informatique. Leur équipe échoue souvent parce que deux joueurs cherchent le même objet pendant que personne ne surveille la porte. Amine propose de répartir les rôles avant chaque partie. Sur la première série de dix essais, ils terminent trois missions ; dans la série suivante, avec les rôles répartis, ils en terminent sept.

Amine veut garder cette organisation pour mieux coopérer. Zoé préfère choisir librement son rôle en cours de partie, afin de varier les expériences. Le club propose de changer les rôles entre les parties. Comme les joueurs connaissent mieux le jeu au fil des essais, ils ne peuvent pas attribuer toute leur progression à la répartition des rôles.

Compare les deux points de vue exprimés à propos de la nouvelle méthode.','Réponds avec tes mots en t’appuyant sur le texte.','Amine préfère des rôles prévus pour coopérer, alors que Zoé souhaite rester libre de changer pendant le jeu.','{}'::text[],'exact','{"interestKeys":["gaming"],"interestLabelFr":"Jeux vidéo","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Compare les deux positions en les attribuant aux bonnes personnes : Amine préfère des rôles prévus pour coopérer, alors que Zoé souhaite rester libre de changer pendant le jeu."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='comparer_points_de_vue'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '7831928b-2031-5b56-baf2-083d9afb49ac'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, Amine et ses amis testent un jeu coopératif qu’ils ont créé au club informatique. Leur équipe échoue souvent parce que deux joueurs cherchent le même objet pendant que personne ne surveille la porte. Amine propose de répartir les rôles avant chaque partie. Sur la première série de dix essais, ils terminent trois missions ; dans la série suivante, avec les rôles répartis, ils en terminent sept.

Amine veut garder cette organisation pour mieux coopérer. Zoé préfère choisir librement son rôle en cours de partie, afin de varier les expériences. Le club propose de changer les rôles entre les parties. Comme les joueurs connaissent mieux le jeu au fil des essais, ils ne peuvent pas attribuer toute leur progression à la répartition des rôles.

Que suggère ce résultat sur l’utilité de la méthode proposée : « Les missions réussies passent de trois à sept sur dix essais. » ?','Réponds avec tes mots en t’appuyant sur le texte.','La progression suggère que répartir les tâches peut aider une équipe à réussir des missions communes.','{}'::text[],'exact','{"interestKeys":["gaming"],"interestLabelFr":"Jeux vidéo","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Interprète le résultat au-delà du chiffre : La progression suggère que répartir les tâches peut aider une équipe à réussir des missions communes."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='relier_preuve_interpretation'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '87d2bb87-30a4-52a0-aba1-fe02c9a57161'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le club nature d’Aya observe les oiseaux depuis la fenêtre de la bibliothèque. Les élèves font tellement de bruit que les oiseaux s’éloignent souvent avant qu’ils puissent les dessiner. Aya propose de communiquer par gestes pendant les observations. Lors de la première matinée, ils dessinent deux oiseaux ; une semaine plus tard, avec la nouvelle règle, ils en dessinent cinq.

Aya souhaite garder cette règle pour observer sans déranger. Malo préfère pouvoir poser ses questions à voix haute dès qu’il en a une. Les élèves proposent de réserver un moment de discussion après l’observation. La responsable rappelle que la météo et le nombre d’oiseaux présents ont aussi changé entre les deux matinées.

Reformule avec tes mots : « Les élèves dessinent cinq oiseaux au lieu de deux. »','Réponds avec tes mots en t’appuyant sur le texte.','Le groupe parvient à représenter cinq oiseaux, contre seulement deux lors de la première matinée.','{}'::text[],'exact','{"interestKeys":["animals"],"interestLabelFr":"Animaux","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Conserve cette information : Les élèves dessinent cinq oiseaux au lieu de deux.","Reformule avec tes propres mots, sans simplement recopier la citation."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='reformuler_sans_copier'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'a38b321c-8143-5d65-8f5c-8f0551882b07'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le club nature d’Aya observe les oiseaux depuis la fenêtre de la bibliothèque. Les élèves font tellement de bruit que les oiseaux s’éloignent souvent avant qu’ils puissent les dessiner. Aya propose de communiquer par gestes pendant les observations. Lors de la première matinée, ils dessinent deux oiseaux ; une semaine plus tard, avec la nouvelle règle, ils en dessinent cinq.

Aya souhaite garder cette règle pour observer sans déranger. Malo préfère pouvoir poser ses questions à voix haute dès qu’il en a une. Les élèves proposent de réserver un moment de discussion après l’observation. La responsable rappelle que la météo et le nombre d’oiseaux présents ont aussi changé entre les deux matinées.

Résume en une phrase le problème rencontré et la solution proposée.','Réponds avec tes mots en t’appuyant sur le texte.','Le bruit des élèves fait partir les oiseaux avant qu’ils puissent les observer ; aya propose de communiquer par gestes pendant l’observation.','{}'::text[],'exact','{"interestKeys":["animals"],"interestLabelFr":"Animaux","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Présente le problème : Le bruit des élèves fait partir les oiseaux avant qu’ils puissent les observer.","Explique la solution : Aya propose de communiquer par gestes pendant l’observation."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='organiser_resume_informatif'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '65fe732f-afb6-5383-8fd3-8af3cfed9952'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le club nature d’Aya observe les oiseaux depuis la fenêtre de la bibliothèque. Les élèves font tellement de bruit que les oiseaux s’éloignent souvent avant qu’ils puissent les dessiner. Aya propose de communiquer par gestes pendant les observations. Lors de la première matinée, ils dessinent deux oiseaux ; une semaine plus tard, avec la nouvelle règle, ils en dessinent cinq.

Aya souhaite garder cette règle pour observer sans déranger. Malo préfère pouvoir poser ses questions à voix haute dès qu’il en a une. Les élèves proposent de réserver un moment de discussion après l’observation. La responsable rappelle que la météo et le nombre d’oiseaux présents ont aussi changé entre les deux matinées.

Résume le récit en une phrase reliant la situation, l’action et le résultat.','Réponds avec tes mots en t’appuyant sur le texte.','Le bruit des élèves fait partir les oiseaux avant qu’ils puissent les observer ; Aya propose de communiquer par gestes pendant l’observation ; Les élèves dessinent cinq oiseaux au lieu de deux.','{}'::text[],'exact','{"interestKeys":["animals"],"interestLabelFr":"Animaux","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Le bruit des élèves fait partir les oiseaux avant qu’ils puissent les observer.","Aya propose de communiquer par gestes pendant l’observation.","Les élèves dessinent cinq oiseaux au lieu de deux."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='organiser_resume_narratif'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'fc4219ed-bd6d-5174-a2d5-4ecfb1984c8b'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le club nature d’Aya observe les oiseaux depuis la fenêtre de la bibliothèque. Les élèves font tellement de bruit que les oiseaux s’éloignent souvent avant qu’ils puissent les dessiner. Aya propose de communiquer par gestes pendant les observations. Lors de la première matinée, ils dessinent deux oiseaux ; une semaine plus tard, avec la nouvelle règle, ils en dessinent cinq.

Aya souhaite garder cette règle pour observer sans déranger. Malo préfère pouvoir poser ses questions à voix haute dès qu’il en a une. Les élèves proposent de réserver un moment de discussion après l’observation. La responsable rappelle que la météo et le nombre d’oiseaux présents ont aussi changé entre les deux matinées.

Compare les deux points de vue exprimés à propos de la nouvelle méthode.','Réponds avec tes mots en t’appuyant sur le texte.','Aya veut observer en silence, tandis que Malo souhaite poser immédiatement ses questions à voix haute.','{}'::text[],'exact','{"interestKeys":["animals"],"interestLabelFr":"Animaux","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Compare les deux positions en les attribuant aux bonnes personnes : Aya veut observer en silence, tandis que Malo souhaite poser immédiatement ses questions à voix haute."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='comparer_points_de_vue'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '90328b41-9c4c-5ae8-a32c-176f826f3438'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le club nature d’Aya observe les oiseaux depuis la fenêtre de la bibliothèque. Les élèves font tellement de bruit que les oiseaux s’éloignent souvent avant qu’ils puissent les dessiner. Aya propose de communiquer par gestes pendant les observations. Lors de la première matinée, ils dessinent deux oiseaux ; une semaine plus tard, avec la nouvelle règle, ils en dessinent cinq.

Aya souhaite garder cette règle pour observer sans déranger. Malo préfère pouvoir poser ses questions à voix haute dès qu’il en a une. Les élèves proposent de réserver un moment de discussion après l’observation. La responsable rappelle que la météo et le nombre d’oiseaux présents ont aussi changé entre les deux matinées.

Que suggère ce résultat sur l’utilité de la méthode proposée : « Les élèves dessinent cinq oiseaux au lieu de deux. » ?','Réponds avec tes mots en t’appuyant sur le texte.','Cette observation suggère que faire moins de bruit peut faciliter l’observation des oiseaux.','{}'::text[],'exact','{"interestKeys":["animals"],"interestLabelFr":"Animaux","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Interprète le résultat au-delà du chiffre : Cette observation suggère que faire moins de bruit peut faciliter l’observation des oiseaux."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='relier_preuve_interpretation'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '17923bf5-dc9c-5ff0-af43-89a6ee9f50ba'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le club d’astronomie de Sofia organise une soirée pour apprendre à reconnaître des constellations sur une carte du ciel. Les débutants se perdent parmi les nombreux signes. Sofia crée une fiche qui montre trois repères à chercher dans l’ordre. Avant de recevoir la fiche, quatre participants sur dix retrouvent la constellation demandée ; avec la fiche, ils sont huit.

Sofia souhaite distribuer cette aide à la prochaine séance. Idriss préfère laisser chacun explorer librement la carte, pour le plaisir de chercher. Ils proposent de rendre la fiche facultative. La responsable précise que les participants avaient déjà vu la carte une première fois : la fiche n’est pas forcément la seule raison de leurs progrès.

Reformule avec tes mots : « Huit participants sur dix retrouvent la constellation, contre quatre auparavant. »','Réponds avec tes mots en t’appuyant sur le texte.','La recherche aboutit pour huit personnes sur dix, alors qu’elle n’avait réussi que pour quatre au début.','{}'::text[],'exact','{"interestKeys":["space"],"interestLabelFr":"Espace","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Conserve cette information : Huit participants sur dix retrouvent la constellation, contre quatre auparavant.","Reformule avec tes propres mots, sans simplement recopier la citation."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='reformuler_sans_copier'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '43107e15-1fe3-53a5-961a-dd1fa363c027'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le club d’astronomie de Sofia organise une soirée pour apprendre à reconnaître des constellations sur une carte du ciel. Les débutants se perdent parmi les nombreux signes. Sofia crée une fiche qui montre trois repères à chercher dans l’ordre. Avant de recevoir la fiche, quatre participants sur dix retrouvent la constellation demandée ; avec la fiche, ils sont huit.

Sofia souhaite distribuer cette aide à la prochaine séance. Idriss préfère laisser chacun explorer librement la carte, pour le plaisir de chercher. Ils proposent de rendre la fiche facultative. La responsable précise que les participants avaient déjà vu la carte une première fois : la fiche n’est pas forcément la seule raison de leurs progrès.

Résume en une phrase le problème rencontré et la solution proposée.','Réponds avec tes mots en t’appuyant sur le texte.','Les débutants ont du mal à se repérer sur la carte du ciel ; sofia crée une fiche présentant trois repères dans un ordre précis.','{}'::text[],'exact','{"interestKeys":["space"],"interestLabelFr":"Espace","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Présente le problème : Les débutants ont du mal à se repérer sur la carte du ciel.","Explique la solution : Sofia crée une fiche présentant trois repères dans un ordre précis."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='organiser_resume_informatif'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'e150e3ea-bfdf-50f9-bb68-3ce464f6e893'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le club d’astronomie de Sofia organise une soirée pour apprendre à reconnaître des constellations sur une carte du ciel. Les débutants se perdent parmi les nombreux signes. Sofia crée une fiche qui montre trois repères à chercher dans l’ordre. Avant de recevoir la fiche, quatre participants sur dix retrouvent la constellation demandée ; avec la fiche, ils sont huit.

Sofia souhaite distribuer cette aide à la prochaine séance. Idriss préfère laisser chacun explorer librement la carte, pour le plaisir de chercher. Ils proposent de rendre la fiche facultative. La responsable précise que les participants avaient déjà vu la carte une première fois : la fiche n’est pas forcément la seule raison de leurs progrès.

Résume le récit en une phrase reliant la situation, l’action et le résultat.','Réponds avec tes mots en t’appuyant sur le texte.','Les débutants ont du mal à se repérer sur la carte du ciel ; Sofia crée une fiche présentant trois repères dans un ordre précis ; Huit participants sur dix retrouvent la constellation, contre quatre auparavant.','{}'::text[],'exact','{"interestKeys":["space"],"interestLabelFr":"Espace","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Les débutants ont du mal à se repérer sur la carte du ciel.","Sofia crée une fiche présentant trois repères dans un ordre précis.","Huit participants sur dix retrouvent la constellation, contre quatre auparavant."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='organiser_resume_narratif'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'cc51d395-2ad8-5d1b-a6c1-57d90f6245d7'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le club d’astronomie de Sofia organise une soirée pour apprendre à reconnaître des constellations sur une carte du ciel. Les débutants se perdent parmi les nombreux signes. Sofia crée une fiche qui montre trois repères à chercher dans l’ordre. Avant de recevoir la fiche, quatre participants sur dix retrouvent la constellation demandée ; avec la fiche, ils sont huit.

Sofia souhaite distribuer cette aide à la prochaine séance. Idriss préfère laisser chacun explorer librement la carte, pour le plaisir de chercher. Ils proposent de rendre la fiche facultative. La responsable précise que les participants avaient déjà vu la carte une première fois : la fiche n’est pas forcément la seule raison de leurs progrès.

Compare les deux points de vue exprimés à propos de la nouvelle méthode.','Réponds avec tes mots en t’appuyant sur le texte.','Sofia veut proposer une fiche pour guider les débutants, tandis qu’Idriss préfère une exploration libre.','{}'::text[],'exact','{"interestKeys":["space"],"interestLabelFr":"Espace","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Compare les deux positions en les attribuant aux bonnes personnes : Sofia veut proposer une fiche pour guider les débutants, tandis qu’Idriss préfère une exploration libre."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='comparer_points_de_vue'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'b3825848-b151-5bfc-8f58-dd66174a067b'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, le club d’astronomie de Sofia organise une soirée pour apprendre à reconnaître des constellations sur une carte du ciel. Les débutants se perdent parmi les nombreux signes. Sofia crée une fiche qui montre trois repères à chercher dans l’ordre. Avant de recevoir la fiche, quatre participants sur dix retrouvent la constellation demandée ; avec la fiche, ils sont huit.

Sofia souhaite distribuer cette aide à la prochaine séance. Idriss préfère laisser chacun explorer librement la carte, pour le plaisir de chercher. Ils proposent de rendre la fiche facultative. La responsable précise que les participants avaient déjà vu la carte une première fois : la fiche n’est pas forcément la seule raison de leurs progrès.

Que suggère ce résultat sur l’utilité de la méthode proposée : « Huit participants sur dix retrouvent la constellation, contre quatre auparavant. » ?','Réponds avec tes mots en t’appuyant sur le texte.','Ce résultat suggère que des repères ordonnés peuvent aider les débutants à lire une carte du ciel.','{}'::text[],'exact','{"interestKeys":["space"],"interestLabelFr":"Espace","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Interprète le résultat au-delà du chiffre : Ce résultat suggère que des repères ordonnés peuvent aider les débutants à lire une carte du ciel."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='relier_preuve_interpretation'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '66e9f7e7-8fb2-5748-b3f3-33b62052637a'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, Karim prépare des galettes avec son groupe de cuisine. La recette est écrite dans un long paragraphe et plusieurs élèves oublient une étape. Karim la transforme en une liste numérotée que chacun peut cocher. Lors du premier essai, le groupe oublie quatre étapes au total ; au second, avec la liste, il n’en oublie qu’une.

Karim souhaite conserver ce format pour les prochaines recettes. Léa préfère un texte continu qui explique les gestes et leurs raisons. Le groupe propose d’ajouter de courtes explications sous les étapes numérotées. Leur animateur rappelle qu’ils connaissaient aussi mieux la recette lors du second essai.

Reformule avec tes mots : « Le nombre d’étapes oubliées passe de quatre à une. »','Réponds avec tes mots en t’appuyant sur le texte.','Le groupe ne saute plus qu’une étape, contre quatre pendant le premier essai.','{}'::text[],'exact','{"interestKeys":["food"],"interestLabelFr":"Cuisine","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Conserve cette information : Le nombre d’étapes oubliées passe de quatre à une.","Reformule avec tes propres mots, sans simplement recopier la citation."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='reformuler_sans_copier'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'e887535d-0efe-5765-bb0a-815b701b2e13'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, Karim prépare des galettes avec son groupe de cuisine. La recette est écrite dans un long paragraphe et plusieurs élèves oublient une étape. Karim la transforme en une liste numérotée que chacun peut cocher. Lors du premier essai, le groupe oublie quatre étapes au total ; au second, avec la liste, il n’en oublie qu’une.

Karim souhaite conserver ce format pour les prochaines recettes. Léa préfère un texte continu qui explique les gestes et leurs raisons. Le groupe propose d’ajouter de courtes explications sous les étapes numérotées. Leur animateur rappelle qu’ils connaissaient aussi mieux la recette lors du second essai.

Résume en une phrase le problème rencontré et la solution proposée.','Réponds avec tes mots en t’appuyant sur le texte.','Les élèves oublient des étapes dans une recette présentée en un long paragraphe ; karim transforme la recette en liste numérotée à cocher.','{}'::text[],'exact','{"interestKeys":["food"],"interestLabelFr":"Cuisine","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Présente le problème : Les élèves oublient des étapes dans une recette présentée en un long paragraphe.","Explique la solution : Karim transforme la recette en liste numérotée à cocher."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='organiser_resume_informatif'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '1842d9b5-6e2e-599a-9fef-b95c0ad33ef1'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, Karim prépare des galettes avec son groupe de cuisine. La recette est écrite dans un long paragraphe et plusieurs élèves oublient une étape. Karim la transforme en une liste numérotée que chacun peut cocher. Lors du premier essai, le groupe oublie quatre étapes au total ; au second, avec la liste, il n’en oublie qu’une.

Karim souhaite conserver ce format pour les prochaines recettes. Léa préfère un texte continu qui explique les gestes et leurs raisons. Le groupe propose d’ajouter de courtes explications sous les étapes numérotées. Leur animateur rappelle qu’ils connaissaient aussi mieux la recette lors du second essai.

Résume le récit en une phrase reliant la situation, l’action et le résultat.','Réponds avec tes mots en t’appuyant sur le texte.','Les élèves oublient des étapes dans une recette présentée en un long paragraphe ; Karim transforme la recette en liste numérotée à cocher ; Le nombre d’étapes oubliées passe de quatre à une.','{}'::text[],'exact','{"interestKeys":["food"],"interestLabelFr":"Cuisine","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Les élèves oublient des étapes dans une recette présentée en un long paragraphe.","Karim transforme la recette en liste numérotée à cocher.","Le nombre d’étapes oubliées passe de quatre à une."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='organiser_resume_narratif'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select '8827a455-a62d-5ca7-b88e-26f5e3c8fe63'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, Karim prépare des galettes avec son groupe de cuisine. La recette est écrite dans un long paragraphe et plusieurs élèves oublient une étape. Karim la transforme en une liste numérotée que chacun peut cocher. Lors du premier essai, le groupe oublie quatre étapes au total ; au second, avec la liste, il n’en oublie qu’une.

Karim souhaite conserver ce format pour les prochaines recettes. Léa préfère un texte continu qui explique les gestes et leurs raisons. Le groupe propose d’ajouter de courtes explications sous les étapes numérotées. Leur animateur rappelle qu’ils connaissaient aussi mieux la recette lors du second essai.

Compare les deux points de vue exprimés à propos de la nouvelle méthode.','Réponds avec tes mots en t’appuyant sur le texte.','Karim préfère une liste d’étapes à cocher, tandis que Léa souhaite un texte qui explique les gestes.','{}'::text[],'exact','{"interestKeys":["food"],"interestLabelFr":"Cuisine","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Compare les deux positions en les attribuant aux bonnes personnes : Karim préfère une liste d’étapes à cocher, tandis que Léa souhaite un texte qui explique les gestes."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='comparer_points_de_vue'
on conflict(id) do nothing;

insert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)
select 'a4242ca3-ad30-514d-9e53-aee3f284b4aa'::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer','Lis le texte.

Dans ce récit fictif, Karim prépare des galettes avec son groupe de cuisine. La recette est écrite dans un long paragraphe et plusieurs élèves oublient une étape. Karim la transforme en une liste numérotée que chacun peut cocher. Lors du premier essai, le groupe oublie quatre étapes au total ; au second, avec la liste, il n’en oublie qu’une.

Karim souhaite conserver ce format pour les prochaines recettes. Léa préfère un texte continu qui explique les gestes et leurs raisons. Le groupe propose d’ajouter de courtes explications sous les étapes numérotées. Leur animateur rappelle qu’ils connaissaient aussi mieux la recette lors du second essai.

Que suggère ce résultat sur l’utilité de la méthode proposée : « Le nombre d’étapes oubliées passe de quatre à une. » ?','Réponds avec tes mots en t’appuyant sur le texte.','Cette diminution suggère qu’une liste numérotée peut aider à suivre toutes les étapes d’une recette.','{}'::text[],'exact','{"interestKeys":["food"],"interestLabelFr":"Cuisine","contentFamily":"interest-reading-v1","readingRubric":{"version":1,"requiredIdeas":["Interprète le résultat au-delà du chiffre : Cette diminution suggère qu’une liste numérotée peut aider à suivre toutes les étapes d’une recette."]}}'::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1','{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate0_computed":{"applied":false},"gate2_answer_key":{"ok":true},"gate3_ensemble":{"agreement":1,"agrees":true},"verdict":"auto_approved"}'::jsonb,'needs_human_review'
from public.competency_nodes n where n.key='relier_preuve_interpretation'
on conflict(id) do nothing;

-- Existing reviewed material also participates in interest-aware practice selection.
update public.competency_items set validator_config=coalesce(validator_config,'{}'::jsonb) || jsonb_build_object('interestKeys',case validator_config->>'sourceTextKey'
 when 'garden' then '["environment","animals"]'::jsonb
 when 'notebook' then '["history","mystery"]'::jsonb
 when 'lighthouse' then '["travel","mystery"]'::jsonb
 when 'mangrove' then '["environment","animals"]'::jsonb
 when 'solar' then '["technology","environment"]'::jsonb
 when 'bees' then '["animals","environment"]'::jsonb
 when 'school' then '["psychology"]'::jsonb
 when 'street' then '["cars","environment","politics"]'::jsonb
 when 'library' then '["technology"]'::jsonb end)
where prompt_version='diagnostic-bank-v2' and prompt_fr like 'Lis le texte.%'
 and validator_config->>'sourceTextKey' in ('garden','notebook','lighthouse','mangrove','solar','bees','school','street','library')
 and not(validator_config ? 'interestKeys');
commit;
