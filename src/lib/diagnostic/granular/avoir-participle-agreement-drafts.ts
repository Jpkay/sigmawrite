/** Supplied base forms isolate agreement from participle recall. Original
 * contexts; review is pending. No pronominal verbs or infinitive exceptions. */
export type AvoirAgreementCase='preceding'|'following'|'absent';
type Row=readonly [verb:string,base:string,sentence:string,answer:string,explanation:string];
export const AVOIR_AGREEMENT_CONTEXTS:Record<AvoirAgreementCase,readonly Row[]>={
 preceding:[
  ['dessiner','dessiné','La planche que Sami a ___ raconte une aventure.','dessinée','Sami a dessiné quoi ? La planche. Ce COD féminin singulier est placé avant le participe : dessinée.'],
  ['choisir','choisi','La veste que Noé a ___ est bleue.','choisie','Le COD « la veste » est féminin singulier et précède le participe : choisie. Le sujet Noé ne commande pas cet accord.'],
  ['écrire','écrit','La lettre que Yanis a ___ est sur la table.','écrite','Yanis a écrit quoi ? La lettre. Le COD féminin singulier est placé avant : écrite.'],
  ['ranger','rangé','Les carnets que Lina a ___ sont dans le tiroir.','rangés','Le COD « les carnets » est masculin pluriel et placé avant : rangés.'],
  ['finir','fini','Les exercices que Maya a ___ étaient courts.','finis','Maya a fini quoi ? Les exercices. Ce COD masculin pluriel est placé avant : finis.'],
  ['lire','lu','Les romans que Salma a ___ viennent de la bibliothèque.','lus','Le COD « les romans » est masculin pluriel et précède le participe : lus.'],
  ['préparer','préparé','Les affiches que Bilal a ___ annoncent le concert.','préparées','Le COD « les affiches » est féminin pluriel et placé avant : préparées.'],
  ['remplir','rempli','Les gourdes que Léo a ___ sont dans le sac.','remplies','Léo a rempli quoi ? Les gourdes. Le COD féminin pluriel est placé avant : remplies.'],
  ['ouvrir','ouvert','Les fenêtres que Malo a ___ donnent sur la cour.','ouvertes','Le COD « les fenêtres » est féminin pluriel et précède le participe : ouvertes.'],
  ['garder','gardé','Le billet que les filles ont ___ est encore valable.','gardé','Le COD « le billet » est masculin singulier et placé avant : gardé. On n’accorde pas avec le sujet « les filles ».'],
  ['choisir','choisi','Le film que les joueuses ont ___ commence à vingt heures.','choisi','Le COD « le film » est masculin singulier et placé avant : choisi.'],
  ['écrire','écrit','Le message que les musiciennes ont ___ est très court.','écrit','Le COD « le message » est masculin singulier et placé avant : écrit. Le sujet féminin pluriel ne change pas cet accord.'],
 ],
 following:[
  ['dessiner','dessiné','Les artistes ont ___ une planche de manga.','dessiné','Le COD « une planche de manga » vient après le participe. Avec avoir, on garde ici dessiné.'],
  ['choisir','choisi','Les filles ont ___ une veste bleue.','choisi','Le COD « une veste bleue » est placé après : pas d’accord, choisi.'],
  ['écrire','écrit','Les garçons ont ___ une lettre.','écrit','Le COD « une lettre » est après le participe : écrit reste sans marque d’accord.'],
  ['ranger','rangé','La capitaine a ___ les carnets.','rangé','Le groupe « les carnets » est le COD, mais il vient après le participe : rangé.'],
  ['finir','fini','La collégienne a ___ les exercices.','fini','Le COD « les exercices » vient après : fini. Le sujet féminin n’entraîne pas d’accord avec avoir.'],
  ['lire','lu','Les lectrices ont ___ plusieurs romans.','lu','Le COD « plusieurs romans » est après le participe : lu.'],
  ['préparer','préparé','Les élèves ont ___ des affiches.','préparé','Le COD « des affiches » vient après le participe : préparé.'],
  ['remplir','rempli','Les joueuses ont ___ les gourdes.','rempli','Le COD « les gourdes » vient après : rempli, sans e ni s.'],
  ['ouvrir','ouvert','La voisine a ___ les fenêtres.','ouvert','Le groupe « les fenêtres » est le COD placé après le participe : ouvert.'],
  ['garder','gardé','Les filles ont ___ le billet.','gardé','Le COD « le billet » vient après : gardé.'],
  ['choisir','choisi','Les musiciennes ont ___ ce film.','choisi','Le COD « ce film » vient après : choisi.'],
  ['écrire','écrit','Les danseuses ont ___ ce message.','écrit','Le COD « ce message » vient après : écrit.'],
 ],
 absent:[
  ['dormir','dormi','Les voyageuses ont ___ pendant le trajet.','dormi','« Pendant le trajet » indique quand elles ont dormi. Il n’y a pas de COD : dormi.'],
  ['sourire','souri','Les enfants ont ___ à leur voisine.','souri','On sourit à quelqu’un. « À leur voisine » n’est pas un COD : souri reste sans accord.'],
  ['marcher','marché','Les sportives ont ___ jusqu’au village.','marché','« Jusqu’au village » indique le lieu atteint. Il n’y a pas de COD : marché.'],
  ['rire','ri','Les actrices ont ___ pendant la pause.','ri','« Pendant la pause » indique un moment. Il n’y a pas de COD : ri.'],
  ['parler','parlé','Les sœurs ont ___ de leur voyage.','parlé','Elles ont parlé de quelque chose. « De leur voyage » n’est pas un COD : parlé.'],
  ['réfléchir','réfléchi','Les dessinatrices ont ___ à leur projet.','réfléchi','On réfléchit à quelque chose. Aucun COD ne commande d’accord : réfléchi.'],
  ['téléphoner','téléphoné','Les joueuses ont ___ à leur entraîneuse.','téléphoné','« À leur entraîneuse » est introduit par à, ce n’est pas un COD : téléphoné.'],
  ['hésiter','hésité','Les amies ont ___ avant de répondre.','hésité','« Avant de répondre » précise le moment. Il n’y a pas de COD : hésité.'],
  ['travailler','travaillé','Les élèves ont ___ dans la bibliothèque.','travaillé','« Dans la bibliothèque » indique un lieu. Sans COD, travaillé ne s’accorde pas.'],
  ['jouer','joué','Les filles ont ___ avec leurs cousins.','joué','« Avec leurs cousins » indique avec qui elles jouent, pas un COD : joué.'],
  ['discuter','discuté','Les voisines ont ___ du spectacle.','discuté','« Du spectacle » signifie de ce spectacle. Ce complément n’est pas un COD : discuté.'],
  ['voyager','voyagé','Les musiciennes ont ___ en train.','voyagé','« En train » indique le moyen de transport. Il n’y a pas de COD : voyagé.'],
 ],
};
export const AVOIR_PARTICIPLE_AGREEMENT_DRAFTS=Object.entries(AVOIR_AGREEMENT_CONTEXTS).flatMap(([construction,rows])=>rows.map(([verb,base,sentence,answer,explanation],index)=>({id:`${construction}-${index+1}`,construction:construction as AvoirAgreementCase,verb,base,sentence,answer,explanation,alternatives:[base,base+'e',base+'s',base+'es'],prompt:`Complète la phrase avec le participe passé de « ${verb} ».\nForme au masculin singulier : ${base}.\n\n${sentence}`})));
