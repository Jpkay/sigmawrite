begin;

-- Keep the existing four-argument editor for older deployments. Its assignment,
-- role, pending-status and choice-identity checks run under the same transaction.
create or replace function public.save_review_exercise_answers(
  p_item_id uuid, p_prompt_fr text, p_correct_answer text, p_choices jsonb,
  p_acceptable_answers text[] default null, p_required_ideas text[] default null
) returns void
language plpgsql security definer set search_path=public
as $$
begin
  if p_acceptable_answers is not null and (
    cardinality(p_acceptable_answers)>30 or exists (
      select 1 from unnest(p_acceptable_answers) a where a is null or char_length(btrim(a)) not between 1 and 1000
    )
  ) then raise exception 'invalid_accepted_answers'; end if;
  if p_required_ideas is not null and (
    cardinality(p_required_ideas) not between 1 and 8 or exists (
      select 1 from unnest(p_required_ideas) a where a is null or char_length(btrim(a)) not between 10 and 600
    )
  ) then raise exception 'invalid_reading_criteria'; end if;

  perform public.save_review_exercise_content(p_item_id,p_prompt_fr,p_correct_answer,p_choices);
  if p_required_ideas is not null and not exists (
    select 1 from public.competency_items where id=p_item_id
      and validator_config->'readingRubric'->>'version'='1'
  ) then raise exception 'item_has_no_reading_criteria'; end if;
  update public.competency_items set
    acceptable_answers=coalesce(p_acceptable_answers,acceptable_answers),
    validator_config=case when p_required_ideas is null then validator_config
      else jsonb_set(validator_config,'{readingRubric,requiredIdeas}',to_jsonb(p_required_ideas)) end,
    updated_at=now()
    where id=p_item_id;
end
$$;
revoke all on function public.save_review_exercise_answers(uuid,text,text,jsonb,text[],text[]) from public,anon;
grant execute on function public.save_review_exercise_answers(uuid,text,text,jsonb,text[],text[]) to authenticated;

-- Backfill only authored reading items whose original answer has not been edited.

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Explique que les racines des mangroves protègent les jeunes poissons pendant leur croissance.","Reformule avec tes propres mots : changer seulement la ponctuation ou un mot de la citation ne suffit pas."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['Les racines de ces arbres offrent aux petits poissons un endroit protégé pour se développer.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='reformuler_sans_copier')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='mangrove'
 and i.correct_answer='Les jeunes poissons se développent à l’abri des racines des mangroves.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Conserve le sens de la mesure : les achats d’électricité de l’école A ont diminué de 38 % sur une année.","Reformule avec tes propres mots : changer seulement la ponctuation ou un mot de la citation ne suffit pas."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['Sur douze mois, l’école A a réduit de 38 % la quantité d’électricité achetée.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='reformuler_sans_copier')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='solar'
 and i.correct_answer='Après une année, les achats d’électricité de l’école A avaient diminué de 38 %.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Explique que réunir les ressources papier et numériques répond mieux aux différents besoins des lecteurs.","Reformule avec tes propres mots : changer seulement la ponctuation ou un mot de la citation ne suffit pas."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['Proposer à la fois des livres imprimés et des outils numériques satisfait mieux les besoins variés des lecteurs.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='reformuler_sans_copier')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='library'
 and i.correct_answer='Combiner papier et numérique convient davantage aux différents besoins.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Présente d’abord le problème : la destruction des mangroves a augmenté l’érosion.","Relie ensuite ce problème à la solution : des habitants replantent et protègent les mangroves."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['L’érosion s’est aggravée après la destruction des mangroves ; pour y remédier, les habitants replantent ces arbres et protègent les parcelles.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='organiser_resume_informatif')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='mangrove'
 and i.correct_answer='La coupe des mangroves a aggravé l’érosion, alors des habitants replantent et protègent ces forêts côtières.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Présente le résultat principal : les panneaux solaires ont réduit les achats d’électricité de l’école A.","Relie ce résultat à au moins une limite du texte : production variable avec la météo ou coût élevé de l’installation."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['L’école achète moins d’électricité grâce aux panneaux solaires, mais ceux-ci produisent moins pendant les périodes nuageuses.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='organiser_resume_informatif')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='solar'
 and i.correct_answer='Les panneaux ont réduit les achats d’électricité de l’école A, mais leur production varie avec la météo et leur installation coûte cher.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Présente le problème initial : le manque de fleurs en été fragilise les abeilles.","Présente l’action menée pour y répondre : la ville crée des corridors fleuris.","Indique le résultat observé ensuite : davantage d’espèces d’abeilles sont recensées le long des corridors."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['Pour aider les abeilles privées de fleurs en été, la ville a aménagé des passages fleuris où une plus grande diversité d’abeilles a ensuite été constatée.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='organiser_resume_informatif')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='bees'
 and i.correct_answer='Le manque estival de fleurs fragilisait les abeilles ; la ville a créé des corridors fleuris, le long desquels davantage d’espèces ont ensuite été observées.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Présente le besoin initial de la classe : pouvoir observer les insectes étudiés en sciences.","Relie l’action d’Aline et de la classe, créer un jardin, au résultat : les plantes commencent à pousser."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['La classe ayant besoin d’observer des insectes, Aline propose de créer un jardin qui finit par se couvrir de jeunes plantes.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='organiser_resume_narratif')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='garden'
 and i.correct_answer='Pour aider sa classe à observer les insectes, Aline organise un jardin scolaire qui se couvre de pousses deux semaines plus tard.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Indique que Malik découvre un ancien carnet contenant des relevés de pluie.","Explique qu’il le confie aux archives et participe à sa numérisation, permettant aux chercheurs d’utiliser les données."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['Après avoir trouvé de vieux relevés de pluie, Malik les remet aux archives et les numérise avec la bibliothécaire pour les rendre utiles aux scientifiques.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='organiser_resume_narratif')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='notebook'
 and i.correct_answer='Malik découvre un ancien carnet de pluie, le confie aux archives puis le numérise, ce qui permet aux chercheurs d’utiliser ses données.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Présente le danger : un bateau approche de la côte pendant une tempête alors que le phare est éteint.","Relie l’intervention d’Inès, qui rallume le phare, au dénouement : le bateau change de direction."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['Un navire approche dans la tempête alors que le phare ne fonctionne plus, mais Inès rétablit sa lumière et le bateau dévie sa route.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='organiser_resume_narratif')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='lighthouse'
 and i.correct_answer='Alors qu’un bateau approche pendant la tempête, Inès rallume courageusement le phare et le navire change de direction.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Explique le point de vue positif d’Aline : le jardin est une réussite utile à la classe.","Oppose ce point de vue à celui de l’élève imaginé dans la question, qui considérerait le jardin comme inutile."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['Aline est fière du jardin et le trouve utile pour apprendre, alors que l’autre élève n’y verrait aucun intérêt.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='comparer_points_de_vue')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='garden'
 and i.correct_answer='Aline voit le jardin comme une réussite utile aux sciences, tandis que l’autre élève le considérerait comme un effort sans intérêt.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Explique que l’auteur soutient la rue piétonne avec une organisation adaptée.","Oppose cette position à l’inquiétude des commerçants concernant la récupération ou le chargement des achats lourds."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['L’auteur souhaite une rue piétonne bien aménagée, tandis que les commerçants redoutent que leurs clients ne puissent plus emporter facilement leurs achats lourds.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='comparer_points_de_vue')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='street'
 and i.correct_answer='L’auteur soutient la rue piétonne si elle est organisée, tandis que certains commerçants craignent surtout les difficultés de chargement.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Explique que l’auteur souhaite conserver ensemble les ressources papier et numériques.","Oppose cette position à celle des responsables qui préfèrent le tout numérique pour gagner de la place."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['L’auteur veut garder les deux formats, mais certains responsables choisiraient uniquement le numérique afin de libérer de l’espace.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='comparer_points_de_vue')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='library'
 and i.correct_answer='L’auteur défend une collection hybride, alors que certains responsables privilégient le numérique pour gagner de la place.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Interprète la baisse des retards : commencer les cours plus tard peut aider les élèves à arriver à l’heure ; répéter le pourcentage seul ne suffit pas."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['La diminution des retards suggère qu’en décalant le début des cours, on facilite la ponctualité des élèves.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='relier_preuve_interpretation')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='school'
 and i.correct_answer='Cette baisse suggère qu’un horaire plus tardif aide davantage d’élèves à arriver à l’heure.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Explique ce que la baisse du dioxyde d’azote signifie : limiter les voitures ou rendre la rue piétonne peut améliorer la qualité de l’air ou réduire la pollution ; répéter le chiffre seul ne suffit pas."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['La baisse de 22 % du dioxyde d’azote suggère que rendre la rue piétonne améliore la qualité de l’air.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='relier_preuve_interpretation')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='street'
 and i.correct_answer='Cette mesure indique que limiter les voitures peut améliorer la qualité de l’air dans la rue.';

update public.competency_items i set validator_config=coalesce(i.validator_config, '{}'::jsonb) || jsonb_build_object('readingRubric','{"version":1,"requiredIdeas":["Interprète la baisse des achats : les panneaux solaires peuvent réduire le recours à l’électricité du réseau ; ne te limite pas à répéter le chiffre."]}'::jsonb),
 acceptable_answers=array(select distinct a from unnest(i.acceptable_answers || array['Ce résultat suggère que les panneaux rendent l’école moins dépendante de l’électricité achetée au réseau.']::text[]) a), updated_at=now()
where i.primary_node_id in (select id from public.competency_nodes where key='relier_preuve_interpretation')
 and i.prompt_version='diagnostic-bank-v2' and i.validator_type='exact' and i.response_type<>'mcq'
 and i.validator_config->>'sourceTextKey'='solar'
 and i.correct_answer='Cette baisse indique que les panneaux peuvent réduire la quantité d’électricité achetée au réseau.';

commit;
