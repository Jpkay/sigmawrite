-- Local-only browser fixture. Never apply to staging or production.
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,confirmation_token,recovery_token,email_change_token_new,email_change,phone_change_token,email_change_token_current,reauthentication_token,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('51000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','review-admin@local.test',crypt('Review1234!',gen_salt('bf')),now(),'','','','','','','','{}','{"role":"platform_admin","display_name":"Admin Revue"}',now(),now()),
('51000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','reviewer-a@local.test',crypt('Review1234!',gen_salt('bf')),now(),'','','','','','','','{}','{"role":"content_reviewer","display_name":"Marie Évaluatrice"}',now(),now())
on conflict(id) do nothing;

insert into public.content_reviewer_profiles(profile_id,active,invite_status,activated_at,invited_email)
select id,true,'active',now(),case when auth_user_id='51000000-0000-4000-8000-000000000002' then 'reviewer-a@local.test' end
from public.profiles where auth_user_id in ('51000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000002')
on conflict(profile_id) do update set active=true,invite_status='active';

insert into public.ai_generated_candidates(id,candidate_type,payload,review_status)
values('52000000-0000-4000-8000-000000000001','reading_text','{
  "id":"52000000-0000-4000-8000-000000000001","createdAt":"2026-07-10T12:00:00Z","reviewStatus":"needs_human_review",
  "input":{"language":"fr","studentGrade":7,"targetReadingBand":"Secondary 7A","topic":"Les volcans du Rwanda","primaryInterest":"science","knowledgeDomains":["science"],"targetConcepts":["volcan"],"textType":"expository","wordCountTarget":220,"maxAverageSentenceLength":18,"maxNewAcademicWords":8,"targetVocabulary":["cratère"],"targetSkills":["inference","main_idea"],"avoid":[],"tone":"curious_explainer"},
  "generated":{"title":"Quand les volcans façonnent le paysage","body":"Au nord-ouest du Rwanda, la chaîne des Virunga dessine une ligne de sommets imposants. Ces volcans ne sont pas seulement des reliefs à observer : ils ont aussi contribué à former des sols riches où les agriculteurs cultivent différentes plantes.\n\nAutour des pentes, la végétation change avec l’altitude. Les forêts humides abritent de nombreuses espèces, tandis que les zones plus élevées sont plus fraîches. Les habitants et les scientifiques observent régulièrement cette région afin de mieux comprendre son évolution.\n\nVivre près d’un volcan demande donc de connaître à la fois les avantages du paysage et les risques possibles. Cette connaissance aide les communautés à prendre des décisions prudentes sans perdre le lien qui les unit à leur environnement.","estimatedReadingBand":"Secondary 7A","targetVocabulary":[{"word":"cratère","definitionFr":"Ouverture située au sommet d’un volcan.","exampleSentenceFr":"Le cratère est observé à distance."}],"knowledgeConcepts":["volcan","altitude"],"skillsPracticed":["inference","main_idea"],"questions":[{"questionText":"Quelle est l’idée principale du texte ?","questionType":"main_idea","answerFormat":"multiple_choice","choices":["Les volcans influencent le paysage et la vie locale.","Tous les volcans entrent en éruption chaque année.","Les habitants doivent quitter la région."],"correctAnswer":"Les volcans influencent le paysage et la vie locale.","rubric":"La réponse relie le paysage, les sols et les communautés.","skillIds":["main_idea"],"difficulty":42},{"questionText":"Pourquoi les communautés observent-elles la région ?","questionType":"inference","answerFormat":"multiple_choice","choices":["Pour comprendre son évolution et agir avec prudence.","Pour empêcher la végétation de pousser.","Pour rendre les sommets plus élevés."],"correctAnswer":"Pour comprendre son évolution et agir avec prudence.","rubric":"La réponse s’appuie sur les deux derniers paragraphes.","skillIds":["inference"],"difficulty":48}],"safetyNotes":[],"factualClaims":[]},
  "difficulty":{"lexical":34,"syntax":38,"knowledge":40,"inference":44,"stamina":28,"overall":38,"band":"Secondary 7A","features":{"wordCount":132,"sentenceCount":9,"avgSentenceLength":14.7,"longSentenceRatio":0.1,"rareWordRatio":0.08,"academicWordRatio":0.1,"connectorCount":5,"subordinateMarkerCount":3,"abstractNounCount":4}},
  "moderation":{"passed":true,"flaggedCategories":[],"needsHumanReview":false},"questionDifficulties":[42,48],"flags":{"moderationPassed":true,"factualNeedsReview":false,"sensitive":false,"difficultyMismatch":false,"nearDuplicate":false}
}'::jsonb,'needs_human_review') on conflict(id) do nothing;

insert into public.content_review_versions(id,candidate_id,version_number,payload,workflow_status,required_reviewers)
select '53000000-0000-4000-8000-000000000001',id,1,payload,'in_review',2 from public.ai_generated_candidates where id='52000000-0000-4000-8000-000000000001'
on conflict(id) do nothing;

insert into public.review_assignments(id,review_version_id,reviewer_profile_id,assigned_by)
select '54000000-0000-4000-8000-000000000001','53000000-0000-4000-8000-000000000001',reviewer.id,admin.id
from public.profiles reviewer cross join public.profiles admin
where reviewer.auth_user_id='51000000-0000-4000-8000-000000000002' and admin.auth_user_id='51000000-0000-4000-8000-000000000001'
on conflict(id) do nothing;
