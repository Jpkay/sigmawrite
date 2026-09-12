/** Original controlled agreement items. The masculine singular participle is
 * supplied, so these assess agreement rather than recalling the participle. */
export type EtreAgreementCase='feminine'|'plural'|'both';
export const ETRE_AGREEMENT_CONTEXTS:Record<EtreAgreementCase,Array<[string,string,string,string]>>={
 feminine:[
  ['aller','allé','La joueuse est ___ au gymnase.','allée'],
  ['aller','allé','La lectrice est ___ à la bibliothèque.','allée'],
  ['aller','allé','La musicienne est ___ au studio.','allée'],
  ['venir','venu','La dessinatrice est ___ présenter sa bande dessinée.','venue'],
  ['venir','venu','La voisine est ___ chercher son colis.','venue'],
  ['venir','venu','La capitaine est ___ saluer son équipe.','venue'],
  ['partir','parti','La voyageuse est ___ avant le lever du soleil.','partie'],
  ['partir','parti','La danseuse est ___ après la répétition.','partie'],
  ['partir','parti','La journaliste est ___ rejoindre son collègue.','partie'],
  ['sortir','sorti','La collégienne est ___ de la salle de dessin.','sortie'],
  ['sortir','sorti','La gardienne est ___ vérifier le portail.','sortie'],
  ['sortir','sorti','La nageuse est ___ du bassin.','sortie'],
 ],
 plural:[
  ['aller','allé','Les joueurs sont ___ au stade.','allés'],
  ['aller','allé','Les lecteurs sont ___ au salon du livre.','allés'],
  ['aller','allé','Les musiciens sont ___ à la répétition.','allés'],
  ['venir','venu','Les dessinateurs sont ___ installer leurs affiches.','venus'],
  ['venir','venu','Les voisins sont ___ aider au déménagement.','venus'],
  ['venir','venu','Les capitaines sont ___ écouter les consignes. Ce sont tous des hommes.','venus'],
  ['partir','parti','Les voyageurs sont ___ avec leurs sacs.','partis'],
  ['partir','parti','Les danseurs sont ___ après le spectacle.','partis'],
  ['partir','parti','Les journalistes sont ___ préparer leur reportage. Ce sont tous des hommes.','partis'],
  ['sortir','sorti','Les collégiens sont ___ dans la cour.','sortis'],
  ['sortir','sorti','Les gardiens sont ___ inspecter le terrain.','sortis'],
  ['sortir','sorti','Les nageurs sont ___ des vestiaires.','sortis'],
 ],
 both:[
  ['aller','allé','Les joueuses sont ___ au tournoi.','allées'],
  ['aller','allé','Les lectrices sont ___ rencontrer une autrice.','allées'],
  ['aller','allé','Les musiciennes sont ___ au concert.','allées'],
  ['venir','venu','Les dessinatrices sont ___ exposer leurs planches.','venues'],
  ['venir','venu','Les voisines sont ___ arroser les plantes.','venues'],
  ['venir','venu','Les capitaines sont ___ avec leurs coéquipières. Ce sont toutes des femmes.','venues'],
  ['partir','parti','Les voyageuses sont ___ en train.','parties'],
  ['partir','parti','Les danseuses sont ___ essayer leurs costumes.','parties'],
  ['partir','parti','Les journalistes sont ___ interviewer une sportive. Ce sont toutes des femmes.','parties'],
  ['sortir','sorti','Les collégiennes sont ___ visiter le musée.','sorties'],
  ['sortir','sorti','Les gardiennes sont ___ fermer les grilles.','sorties'],
  ['sortir','sorti','Les nageuses sont ___ rejoindre leur entraîneuse.','sorties'],
 ],
};
export const ETRE_PARTICIPLE_AGREEMENT_DRAFTS=Object.entries(ETRE_AGREEMENT_CONTEXTS).flatMap(([construction,rows])=>rows.map(([verb,base,sentence,answer],index)=>({
 id:`${construction}:${index+1}`,construction:construction as EtreAgreementCase,verb,base,sentence,answer,
 prompt:`Complète la phrase en accordant le participe passé. Sa forme au masculin singulier est « ${base} ».\n\n${sentence}`,
 alternatives:[base,base+'e',base+'s',base+'es'],
})));
