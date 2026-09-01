-- Repair one legacy pilot snapshot whose generated body was the placeholder
-- "..." while preserving every reviewer assignment and saved draft.

begin;

alter table public.content_review_versions
  disable trigger content_review_version_snapshot_immutable;

do $repair$
declare
  v_body text := $passage$
Avant d’arriver sur un étal, un aliment suit une chaîne de déplacements et de transformations. Prenons l’exemple d’une tomate. Son voyage commence dans une exploitation agricole, où un producteur choisit une variété, prépare le sol, plante les jeunes pousses et surveille leur croissance. Il doit fournir assez d’eau, protéger les plants contre certaines maladies et attendre que les fruits atteignent une maturité suffisante. La production agricole constitue donc la première étape du trajet.

Lorsque les tomates sont prêtes, elles sont récoltées avec soin. Les fruits abîmés ou trop mûrs sont séparés de ceux qui peuvent voyager. Les autres sont triés selon leur taille et leur qualité, puis placés dans des caisses qui les protègent contre les chocs. Cette préparation peut avoir lieu directement à la ferme ou dans un centre de conditionnement voisin. Certaines tomates seront vendues fraîches. D’autres partiront vers une entreprise qui les transformera en sauce, en purée ou en conserve.

Le transport doit ensuite être organisé. Un camion vient chercher les caisses et les conduit vers un marché de gros, un entrepôt ou un atelier de transformation. Pour les aliments périssables, la température joue un rôle essentiel. Un véhicule réfrigéré ralentit le développement des micro-organismes et les réactions qui détériorent les aliments. Le froid ne rend pas un produit éternel, mais il prolonge sa durée de conservation et aide à maintenir sa qualité jusqu’à sa destination.

Entre la ferme et le magasin interviennent souvent plusieurs professionnels. Un collecteur peut réunir les récoltes de différents producteurs. Un transporteur planifie les trajets et respecte les horaires. Un grossiste achète de grandes quantités, les stocke, puis les répartit entre plusieurs commerces. Une entreprise peut aussi laver, découper, emballer ou transformer les produits. Ces intermédiaires assurent ainsi la logistique et relient des exploitations parfois éloignées aux lieux où vivent les consommateurs.

Chaque étape demande des décisions. Si le camion arrive trop tard, une partie de la récolte risque de se perdre. Si l’emballage est trop fragile, les tomates peuvent être écrasées. Si la chaîne du froid est interrompue, leur qualité peut diminuer plus rapidement. Les professionnels vérifient donc l’état des produits, les températures et les délais. Ils doivent aussi conserver des informations sur l’origine des lots afin de pouvoir retracer leur parcours en cas de problème.

Au marché ou dans le magasin, le commerçant reçoit enfin les caisses. Il contrôle les tomates, les dispose sur l’étal et ajuste les quantités proposées selon la demande. Le prix payé par le consommateur ne correspond pas seulement au travail agricole. Il couvre aussi le tri, l’emballage, le transport, le stockage et parfois la transformation. Chacun de ces services ajoute un coût, mais permet également à l’aliment de parcourir une plus grande distance dans de bonnes conditions.

Le voyage se termine lorsque la tomate est choisie et achetée. Pourtant, derrière ce geste simple se trouve une chaîne coordonnée. Du producteur au détaillant, chaque acteur contribue à faire circuler l’aliment, à limiter les pertes et à préserver sa qualité. Observer ce parcours permet de comprendre pourquoi l’approvisionnement d’un marché dépend à la fois de l’agriculture, du transport, de la conservation et du travail des intermédiaires.
$passage$;
begin
  update public.content_review_versions
  set payload=jsonb_set(payload,'{generated,body}',to_jsonb(btrim(v_body)),false),
      updated_at=now()
  where id='58caa9b7-858c-48ab-a06c-b5a54055af51'
    and btrim(coalesce(payload#>>'{generated,body}',''))='...';

  update public.ai_generated_candidates
  set payload=jsonb_set(payload,'{generated,body}',to_jsonb(btrim(v_body)),false),
      updated_at=now()
  where id='08607a39-42f9-4402-9221-be9efa5c327c'
    and btrim(coalesce(payload#>>'{generated,body}',''))='...';

  if exists(
    select 1 from public.content_review_versions
    where id='58caa9b7-858c-48ab-a06c-b5a54055af51'
      and char_length(btrim(coalesce(payload#>>'{generated,body}',''))) < 100
  ) then
    raise exception 'passage_snapshot_repair_failed';
  end if;

  insert into public.audit_logs(action,target_type,target_id,metadata)
  select 'content_review_snapshot.repaired','content_review_version',id,
    jsonb_build_object(
      'candidateId',candidate_id,
      'reason','legacy_placeholder_body',
      'assignmentsPreserved',true,
      'restoredCharacterCount',char_length(payload#>>'{generated,body}')
    )
  from public.content_review_versions
  where id='58caa9b7-858c-48ab-a06c-b5a54055af51'
    and not exists(
      select 1 from public.audit_logs
      where action='content_review_snapshot.repaired'
        and target_id='58caa9b7-858c-48ab-a06c-b5a54055af51'
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
  return new;
end
$$;

drop trigger if exists content_review_version_payload_valid on public.content_review_versions;
create trigger content_review_version_payload_valid
before insert or update of payload on public.content_review_versions
for each row execute function public.validate_content_review_version_payload();

comment on function public.validate_content_review_version_payload() is
  'Prevents incomplete passage snapshots from entering the human-review workflow.';

commit;
