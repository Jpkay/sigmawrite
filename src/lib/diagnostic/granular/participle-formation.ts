import type {TargetTeachingContent} from './teaching-content';
type Kind='er'|'ir'|'irregular';
type Row=readonly [string,string,string];
const rows:Record<Kind,readonly Row[]>={
 er:[['dessiner','dessiné','Il a ___ un château.'],['ranger','rangé','Tu as ___ les outils.'],['visiter','visité','Nous avons ___ cette ferme.'],['observer','observé','Elle a ___ les étoiles.'],['préparer','préparé','Vous avez ___ le matériel.'],['écouter','écouté','Ils ont ___ un podcast.'],['réparer','réparé','On a ___ le portail.'],['chercher','cherché','Tu as ___ ton écharpe.'],['fermer','fermé','Elle a ___ le volet.'],['porter','porté','Nous avons ___ le panier.'],['inventer','inventé','Vous avez ___ une histoire.'],['montrer','montré','Il a ___ son carnet.']],
 ir:[['finir','fini','Il a ___ son croquis.'],['choisir','choisi','Tu as ___ une affiche.'],['réussir','réussi','Elle a ___ son saut.'],['grandir','grandi','Cet arbre a ___ cette année.'],['remplir','rempli','Nous avons ___ le formulaire.'],['réfléchir','réfléchi','Vous avez ___ à la solution.'],['rougir','rougi','Il a ___ de plaisir.'],['grossir','grossi','Le chat a ___ cet hiver.'],['ralentir','ralenti','La voiture a ___ au carrefour.'],['vieillir','vieilli','Ce tissu a ___ au soleil.'],['nourrir','nourri','Tu as ___ les lapins.'],['obéir','obéi','Ils ont ___ à la consigne.']],
 irregular:[['être','été','Il a ___ très patient.'],['avoir','eu','Tu as ___ une surprise.'],['faire','fait','Nous avons ___ une maquette.'],['voir','vu','Elle a ___ un écureuil.'],['prendre','pris','Vous avez ___ le métro.'],['écrire','écrit','Il a ___ un poème.'],['lire','lu','Tu as ___ cette bande dessinée.'],['mettre','mis','Elle a ___ son manteau.'],['boire','bu','Nous avons ___ du jus.'],['pouvoir','pu','Vous avez ___ entrer.'],['dire','dit','Ils ont ___ la vérité.'],['venir','venu','Le voisin est ___ nous aider.']],
};
const guided:Record<Kind,readonly Row[]>={
 er:[['chanter','chanté','Tu as ___ dans la chorale.'],['laver','lavé','Nous avons ___ les verres.'],['trouver','trouvé','Elle a ___ un coquillage.'],['jouer','joué','Vous avez ___ dehors.']],
 ir:[['punir','puni','Le surveillant a ___ le responsable.'],['bâtir','bâti','Nous avons ___ un abri.'],['unir','uni','Cette aventure a ___ le groupe.'],['avertir','averti','Vous avez ___ les voisins.']],
 irregular:[['conduire','conduit','Tu as ___ le tracteur.'],['connaître','connu','Elle a ___ cet artiste.'],['offrir','offert','Nous avons ___ un bouquet.'],['ouvrir','ouvert','Vous avez ___ les fenêtres.']],
};
const models:Record<Kind,{title:string;question:string;steps:TargetTeachingContent['steps'];rule:string;boundary:string}>={
 er:{title:'Former le participe passé des verbes en -er',question:'Pourquoi « nous avons regardé » finit-il par é ?',steps:[
  {exampleFr:'regarder → regardé\nnous avons regardé la mer',explanationFr:'Après avons, on utilise ici regardé. Cette forme du verbe s’appelle le participe passé. Pour un verbe en -er, on remplace la fin -er par -é.'},
  {exampleFr:'danser → dansé\nj’ai dansé',explanationFr:'Garde le début du verbe et remplace les deux lettres er par é. L’accent fait partie de l’orthographe du participe.'},
  {exampleFr:'vous regardez\nvous avez regardé',explanationFr:'Regardez est une forme conjuguée au présent. Dans avez regardé, avez porte la personne ; on écrit ensuite le participe regardé, pas regardez.'},
 ],rule:'Pour former le participe passé de base d’un verbe en -er, remplace -er par -é.',boundary:'Cette leçon travaille la formation du participe, pas ses accords dans toutes les phrases. Les contextes fournis ne demandent pas d’ajouter une marque de féminin ou de pluriel.'},
 ir:{title:'Former le participe passé des verbes comme finir',question:'Comment passe-t-on de « finir » à « j’ai fini » ?',steps:[
  {exampleFr:'finir → fini\nj’ai fini',explanationFr:'Fini est le participe passé de finir. Dans cette famille, on remplace la fin -ir par -i.'},
  {exampleFr:'applaudir : nous applaudissons → nous avons applaudi',explanationFr:'La forme nous applaudissons aide à reconnaître cette famille de verbes en -ir. Pour le participe, on garde applaud- puis on ajoute i.'},
  {exampleFr:'il finit\nil a fini',explanationFr:'Finit est ici une forme conjuguée. Après l’auxiliaire a, on utilise le participe fini, sans t.'},
 ],rule:'Pour les verbes de la famille de finir, remplace -ir par -i pour former le participe passé.',boundary:'Tous les verbes en -ir ne suivent pas cette famille : ouvrir donne ouvert, par exemple. Les accords du participe sont une autre compétence.'},
 irregular:{title:'Retrouver des participes passés irréguliers fréquents',question:'Pourquoi « prendre » donne-t-il « pris » plutôt que « prendé » ?',steps:[
  {exampleFr:'prendre → pris\nIl a pris son billet.',explanationFr:'Pris est le participe passé de prendre. On ne peut pas le fabriquer avec la règle des verbes en -er. Il faut connaître cette forme particulière, dite irrégulière.'},
  {exampleFr:'apprendre → appris\ncomprendre → compris',explanationFr:'Des verbes d’une même famille peuvent partager une formation : les formes de la famille de prendre se terminent ici par pris. Cela aide à les retenir.'},
  {exampleFr:'savoir → su\nrecevoir → reçu',explanationFr:'Une seule terminaison ne suffit pas pour tous les verbes irréguliers. Retiens le verbe avec son participe et une phrase courte.'},
 ],rule:'Associe chaque verbe à son participe passé. Utilise les familles quand elles aident, sans inventer une règle unique pour tous.',boundary:'Ces exercices portent sur un ensemble de verbes fréquents. Ils ne prouvent pas la connaissance de tous les participes irréguliers, ni la maîtrise de leurs accords ou de tous les temps composés.'},
};
export const PARTICIPLE_FORMATION_DRAFTS=(Object.keys(rows) as Kind[]).flatMap(kind=>rows[kind].map(([verb,answer,sentence],index)=>({key:`${kind}-${index+1}`,kind,verb,answer,sentence,reason:models[kind].rule})));
export const PARTICIPLE_FORMATION_TEACHING:readonly TargetTeachingContent[]=(Object.keys(models) as Kind[]).map(kind=>{
 const model=models[kind];const lesson:TargetTeachingContent={id:`french-v3-teaching:participle-formation:${kind}`,nodeKey:'former_participe_passe',facetKey:`former_participe_passe::construction:${kind}`,mode:'production',status:'draft_requires_review',titleFr:model.title,learnerQuestionFr:model.question,steps:model.steps,takeawayFr:model.rule,boundaryFr:model.boundary,
 practice:guided[kind].map(([verb,answer,sentence],index)=>({id:`participle-formation-${kind}-guided-${index+1}`,promptFr:`${sentence}\n\nComplète avec le participe passé de « ${verb} ». Écris seulement le mot manquant.`,answerFr:answer,hintFr:model.rule,explanationFr:`${verb} → ${answer}. ${sentence.replace('___',answer)}`}))};
 return {...lesson,materialExposure:{sentences:[...lesson.steps.flatMap(s=>s.exampleFr.split(/\n| → /)),...guided[kind].flatMap(([verb,answer,sentence])=>[verb,answer,sentence,sentence.replace('___',answer)])]}};
});
