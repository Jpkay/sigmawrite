-- Complete the final three legacy reading snapshots that were created with a
-- placeholder body. Reviewer assignments remain attached to the same versions.

begin;

alter table public.content_review_versions
  disable trigger content_review_version_snapshot_immutable;

do $repair$
declare
  v_trees_body text := $passage$
Dans de nombreuses villes, les rues et les places sont couvertes de béton ou d’asphalte. Ces matériaux absorbent la chaleur pendant la journée et la libèrent lentement le soir. La température reste alors plus élevée qu’à la campagne : c’est le phénomène d’îlot de chaleur. Pour le limiter, les municipalités plantent des arbres le long des routes, près des écoles et dans les parcs.

Leur canopée, c’est-à-dire l’ensemble formé par le sommet et les branches feuillues, crée de l’ombre. Les feuilles rejettent aussi une partie de l’eau absorbée, ce qui rafraîchit l’air. Sous un grand arbre, un banc ou un trottoir peut ainsi rester beaucoup plus agréable pendant une journée chaude.

Les arbres sont également utiles lorsqu’il pleut. Leurs racines absorbent une partie de l’eau et aident le sol à la retenir. Moins d’eau ruisselle rapidement vers les égouts, ce qui réduit le risque d’inondation après une forte averse. Les racines maintiennent aussi la terre en place.

Enfin, les fleurs de certains arbres nourrissent les insectes pollinisateurs. Les troncs, les branches et les feuilles offrent un habitat à des oiseaux et à d’autres animaux. Les espaces arborés deviennent des lieux où les habitants marchent, jouent, discutent ou se reposent.

Planter un arbre ne consiste donc pas seulement à embellir une rue. Il faut choisir une espèce adaptée, lui laisser assez de place et l’entretenir pendant sa croissance. Bien planifiés, les arbres apportent à la ville des bénéfices écologiques et sociaux : ils rafraîchissent les quartiers, gèrent une partie de la pluie, soutiennent la biodiversité et rendent les espaces publics plus accueillants.
$passage$;
  v_concert_body text := $passage$
Quand le public entre dans une salle de concert, la scène est éclairée, les instruments sont accordés et les artistes semblent prêts à commencer. Pourtant, cette soirée a demandé le travail de nombreuses personnes que les spectateurs ne verront presque jamais. Leur journée commence parfois dès l’aube, bien avant l’arrivée des musiciens.

Le logisticien organise le transport du matériel. Il vérifie les horaires des camions, l’accès à la salle et la liste des caisses. Il arrive tôt pour que les instruments, les câbles, les projecteurs et les décors soient disponibles au bon endroit. Un retard ou un oubli peut bloquer toute l’installation. Avec les techniciens de plateau, il veille donc à ce que chaque élément soit déchargé et manipulé sans danger.

Le régisseur coordonne ensuite les différentes équipes. Il suit le planning, indique quand effectuer les essais et transmet les changements de dernière minute. Pendant le spectacle, il coordonne le son et les lumières afin que les effets prévus se produisent au bon moment. Grâce à son casque, il peut parler aux techniciens sans interrompre les artistes.

L’ingénieur du son place les microphones et écoute chaque instrument pendant les répétitions. Il ajuste les volumes pour que la musique soit claire et agréable, sans qu’une voix ou une guitare couvre toutes les autres. Il doit aussi éviter les sifflements désagréables produits lorsqu’un microphone capte le son d’un haut-parleur. De son côté, l’éclairagiste oriente les projecteurs, choisit leurs couleurs et prépare les changements qui accompagneront les morceaux.

D’autres métiers restent tout aussi essentiels. Les agents de sécurité guident le public et surveillent les accès. L’équipe d’accueil renseigne les spectateurs. Les habilleurs préparent parfois les costumes, tandis que les agents d’entretien gardent les lieux propres. Une personne chargée de la production s’assure que les contrats, les repas et les horaires sont respectés.

Après le dernier morceau, le travail continue. Le matériel doit être éteint, compté, rangé puis chargé pour la prochaine date. Une salle qui se vide rapidement peut donc rester active plusieurs heures. Le concert est visible sur scène, mais sa réussite dépend d’une équipe entière. Ces métiers « invisibles » transforment un projet artistique en événement sûr, précis et accueillant pour le public.
$passage$;
  v_tourism_body text := $passage$
Un site naturel ou historique attire souvent des visiteurs parce qu’il possède un paysage, une architecture ou une histoire exceptionnelle. Leur venue peut financer des emplois, des guides et des commerces locaux. Mais une fréquentation trop importante peut aussi abîmer précisément ce que les voyageurs sont venus découvrir. Des pas répétés tassent le sol, des déchets s’accumulent et certaines personnes quittent les chemins pour prendre une photographie.

Pour limiter ces effets, les responsables d’un site commencent par observer les zones les plus fragiles. Ils installent des sentiers balisés afin d’éviter que les visiteurs piétinent la végétation ou s’approchent de bâtiments instables. Des panneaux expliquent les règles, tandis que des guides montrent comment regarder sans toucher. Dans certains lieux, le nombre d’entrées par heure est limité. Cette mesure réduit la pression sur le site et permet à chacun de le découvrir dans de meilleures conditions.

La protection a cependant un coût. Il faut entretenir les chemins, réparer les barrières, ramasser les déchets et surveiller l’état des monuments. Une partie du prix des billets peut être consacrée à ces travaux. Les visiteurs comprennent mieux ce paiement lorsqu’on leur explique précisément comment l’argent est utilisé. Ils participent alors directement à la conservation du lieu.

Les habitants doivent également prendre part aux décisions. Ils connaissent le territoire, ses saisons et ses usages. Certains deviennent guides, restaurateurs ou artisans, mais ils peuvent aussi signaler une source polluée ou une zone menacée. Lorsque la population locale bénéficie du tourisme et peut exprimer ses besoins, elle a davantage intérêt à protéger le site sur le long terme.

Le voyageur possède lui aussi une responsabilité. Il peut emporter ses déchets, respecter les distances indiquées, choisir un hébergement attentif à l’environnement et éviter les périodes déjà très fréquentées. Ces gestes paraissent modestes, mais ils deviennent importants quand des milliers de personnes les adoptent.

Le tourisme et la protection ne sont donc pas forcément opposés. Un tourisme bien organisé permet de découvrir un lieu tout en finançant sa conservation. L’objectif n’est pas d’empêcher toute visite, mais de trouver un équilibre : accueillir le public aujourd’hui sans priver les générations futures du même patrimoine.
$passage$;
  v_tourism_questions jsonb := $questions$
[
  {
    "questionText": "Pourquoi les responsables installent-ils des sentiers balisés ?",
    "questionType": "literal",
    "answerFormat": "multiple_choice",
    "choices": [
      "Pour éviter que les visiteurs piétinent les zones fragiles.",
      "Pour rendre le trajet volontairement plus long.",
      "Pour cacher les monuments aux habitants."
    ],
    "correctAnswer": "Pour éviter que les visiteurs piétinent les zones fragiles.",
    "rubric": "La réponse reprend la fonction explicite des sentiers balisés.",
    "skillIds": ["literal"],
    "difficulty": 34
  },
  {
    "questionText": "Quel effet produit la limitation du nombre d'entrées par heure ?",
    "questionType": "cause_consequence",
    "answerFormat": "multiple_choice",
    "choices": [
      "Elle réduit la pression exercée sur le site.",
      "Elle supprime tous les emplois locaux.",
      "Elle rend les bâtiments plus anciens."
    ],
    "correctAnswer": "Elle réduit la pression exercée sur le site.",
    "rubric": "La réponse établit la conséquence indiquée dans le deuxième paragraphe.",
    "skillIds": ["cause_consequence"],
    "difficulty": 42
  },
  {
    "questionText": "Pourquoi est-il important d'associer les habitants aux décisions ?",
    "questionType": "inference",
    "answerFormat": "multiple_choice",
    "choices": [
      "Parce que leurs connaissances et leurs bénéfices favorisent une protection durable.",
      "Parce qu'ils sont les seuls à pouvoir acheter des billets.",
      "Parce qu'ils souhaitent interdire toutes les visites."
    ],
    "correctAnswer": "Parce que leurs connaissances et leurs bénéfices favorisent une protection durable.",
    "rubric": "La réponse relie la connaissance du territoire, les bénéfices locaux et la protection à long terme.",
    "skillIds": ["inference"],
    "difficulty": 52
  },
  {
    "questionText": "Quelle est l'idée principale du texte ?",
    "questionType": "main_idea",
    "answerFormat": "multiple_choice",
    "choices": [
      "Un tourisme organisé peut concilier la découverte d'un lieu et sa protection.",
      "Tous les sites fragiles doivent être définitivement fermés.",
      "Les voyageurs sont les seuls responsables de la conservation."
    ],
    "correctAnswer": "Un tourisme organisé peut concilier la découverte d'un lieu et sa protection.",
    "rubric": "La réponse exprime l'équilibre défendu dans l'ensemble du texte.",
    "skillIds": ["main_idea"],
    "difficulty": 46
  }
]
$questions$::jsonb;
begin
  update public.content_review_versions
  set payload=jsonb_set(payload,'{generated,body}',to_jsonb(btrim(v_trees_body)),false),
      updated_at=now()
  where id='30919071-7c94-44f8-828d-068ef3d53c42'
    and btrim(coalesce(payload#>>'{generated,body}',''))='...';

  update public.ai_generated_candidates
  set payload=jsonb_set(payload,'{generated,body}',to_jsonb(btrim(v_trees_body)),false),
      updated_at=now()
  where id='aea72baf-df81-4772-b48c-95a38536f74e'
    and btrim(coalesce(payload#>>'{generated,body}',''))='...';

  update public.content_review_versions
  set payload=jsonb_set(payload,'{generated,body}',to_jsonb(btrim(v_concert_body)),false),
      updated_at=now()
  where id='80443afb-8173-4f9d-8c02-f2c53a989533'
    and btrim(coalesce(payload#>>'{generated,body}',''))='...';

  update public.ai_generated_candidates
  set payload=jsonb_set(payload,'{generated,body}',to_jsonb(btrim(v_concert_body)),false),
      updated_at=now()
  where id='b464f63e-b156-4c87-9088-381d4b5e5f23'
    and btrim(coalesce(payload#>>'{generated,body}',''))='...';

  update public.content_review_versions
  set payload=jsonb_set(
        jsonb_set(payload,'{generated,body}',to_jsonb(btrim(v_tourism_body)),false),
        '{generated,questions}',v_tourism_questions,false
      ),
      updated_at=now()
  where id='96736306-2136-4c8d-a3a1-302f41c5d5f9'
    and btrim(coalesce(payload#>>'{generated,body}',''))='...'
    and jsonb_array_length(coalesce(payload#>'{generated,questions}','[]'::jsonb))=0;

  update public.ai_generated_candidates
  set payload=jsonb_set(
        jsonb_set(payload,'{generated,body}',to_jsonb(btrim(v_tourism_body)),false),
        '{generated,questions}',v_tourism_questions,false
      ),
      updated_at=now()
  where id='6bc1c6bd-0e30-478c-9362-643f7a4e93ec'
    and btrim(coalesce(payload#>>'{generated,body}',''))='...'
    and jsonb_array_length(coalesce(payload#>'{generated,questions}','[]'::jsonb))=0;

  if exists(
    select 1
    from public.content_review_versions
    where id in (
      '30919071-7c94-44f8-828d-068ef3d53c42',
      '96736306-2136-4c8d-a3a1-302f41c5d5f9',
      '80443afb-8173-4f9d-8c02-f2c53a989533'
    )
      and (
        char_length(btrim(coalesce(payload#>>'{generated,body}',''))) < 100
        or jsonb_array_length(coalesce(payload#>'{generated,questions}','[]'::jsonb)) = 0
      )
  ) then
    raise exception 'remaining_passage_snapshot_repair_failed';
  end if;

  insert into public.audit_logs(action,target_type,target_id,metadata)
  select 'content_review_snapshot.repaired','content_review_version',version.id,
    jsonb_build_object(
      'candidateId',version.candidate_id,
      'reason','legacy_placeholder_body',
      'assignmentsPreserved',true,
      'restoredCharacterCount',char_length(version.payload#>>'{generated,body}'),
      'restoredQuestionCount',jsonb_array_length(version.payload#>'{generated,questions}')
    )
  from public.content_review_versions version
  where version.id in (
      '30919071-7c94-44f8-828d-068ef3d53c42',
      '96736306-2136-4c8d-a3a1-302f41c5d5f9',
      '80443afb-8173-4f9d-8c02-f2c53a989533'
    )
    and not exists(
      select 1 from public.audit_logs log
      where log.action='content_review_snapshot.repaired'
        and log.target_id=version.id
    );
end
$repair$;

alter table public.content_review_versions
  enable trigger content_review_version_snapshot_immutable;

create or replace function public.validate_content_review_version_payload()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if char_length(btrim(coalesce(new.payload#>>'{generated,body}',''))) < 100 then
    raise exception 'review_version_passage_body_incomplete';
  end if;
  if jsonb_typeof(new.payload#>'{generated,questions}') is distinct from 'array'
    or jsonb_array_length(new.payload#>'{generated,questions}') = 0 then
    raise exception 'review_version_questions_incomplete';
  end if;
  return new;
end
$$;

comment on function public.validate_content_review_version_payload() is
  'Prevents incomplete passage or question snapshots from entering the human-review workflow.';

commit;
