/** Full-sentence controlled transformations. No human-reference y/en, imperative
 * order or compound-tense agreement claims. All answer keys require review. */
type Row=[sentence:string,target:string,answer:string];
const groups:Record<string,Row[]>={
 y_place:[
 ["Nous allons au gymnase.","au gymnase","Nous y allons."],
 ["Lina reste dans le jardin.","dans le jardin","Lina y reste."],
 ["Vous travaillez à la bibliothèque.","à la bibliothèque","Vous y travaillez."],
 ["Les élèves entrent dans la salle.","dans la salle","Les élèves y entrent."],
 ["Tu retournes au collège.","au collège","Tu y retournes."],
 ["Le chat dort sur le fauteuil.","sur le fauteuil","Le chat y dort."],
 ["Sami habite à Lyon.","à Lyon","Sami y habite."],
 ["Nous déjeunons chez notre tante.","chez notre tante","Nous y déjeunons."],
 ["Les enfants jouent dans la cour.","dans la cour","Les enfants y jouent."],
 ["Elle patiente devant le cinéma.","devant le cinéma","Elle y patiente."],
 ["Vous nagez dans cette piscine.","dans cette piscine","Vous y nagez."],
 ["Tu poses le sac sur la table.","sur la table","Tu y poses le sac."],
 ["La famille séjourne en Belgique.","en Belgique","La famille y séjourne."],
 ["Nous passons sous le pont.","sous le pont","Nous y passons."],
 ],
 y_thing:[
 ["Tu penses à ce problème.","à ce problème","Tu y penses."],
 ["Nous participons au tournoi.","au tournoi","Nous y participons."],
 ["Lina réfléchit à cette proposition.","à cette proposition","Lina y réfléchit."],
 ["Vous renoncez à cette idée.","à cette idée","Vous y renoncez."],
 ["Sami tient à son projet.","à son projet","Sami y tient."],
 ["Les voisins contribuent à cette collecte.","à cette collecte","Les voisins y contribuent."],
 ["Elle croit à cette explication.","à cette explication","Elle y croit."],
 ["Nous assistons au spectacle.","au spectacle","Nous y assistons."],
 ["Tu songes à cette possibilité.","à cette possibilité","Tu y songes."],
 ["Vous veillez à la sécurité.","à la sécurité","Vous y veillez."],
 ["Nour s’intéresse à la robotique.","à la robotique","Nour s’y intéresse."],
 ["Les élèves s’habituent au nouvel horaire.","au nouvel horaire","Les élèves s’y habituent."],
 ["Le comité s’oppose à cette décision.","à cette décision","Le comité s’y oppose."],
 ["Nous répondons à cette question.","à cette question","Nous y répondons."],
 ],
 en_origin:[
 ["Tu reviens du marché.","du marché","Tu en reviens."],
 ["Nous sortons du théâtre.","du théâtre","Nous en sortons."],
 ["Lina rentre de la piscine.","de la piscine","Lina en rentre."],
 ["Vous arrivez de Marseille.","de Marseille","Vous en arrivez."],
 ["Les touristes repartent de Bruxelles.","de Bruxelles","Les touristes en repartent."],
 ["Le chat descend du toit.","du toit","Le chat en descend."],
 ["Sami s’éloigne de la rivière.","de la rivière","Sami s’en éloigne."],
 ["Les voyageurs reviennent du Canada.","du Canada","Les voyageurs en reviennent."],
 ["Elle sort de la gare.","de la gare","Elle en sort."],
 ["Nous rentrons du stade.","du stade","Nous en rentrons."],
 ["Le bus vient du dépôt.","du dépôt","Le bus en vient."],
 ["Vous repartez de l’hôtel.","de l’hôtel","Vous en repartez."],
 ["Tu descends du grenier.","du grenier","Tu en descends."],
 ["Les oiseaux s’éloignent de la plage.","de la plage","Les oiseaux s’en éloignent."],
 ],
 en_quantity:[
 ["Nous achetons trois cahiers.","trois cahiers","Nous en achetons trois."],
 ["Lina possède deux vélos.","deux vélos","Lina en possède deux."],
 ["Tu prends une pomme.","une pomme","Tu en prends une."],
 ["Vous préparez quatre affiches.","quatre affiches","Vous en préparez quatre."],
 ["Sami mange du riz.","du riz","Sami en mange."],
 ["Les enfants boivent de l’eau.","de l’eau","Les enfants en boivent."],
 ["Elle ajoute de la farine.","de la farine","Elle en ajoute."],
 ["Nous cueillons des cerises.","des cerises","Nous en cueillons."],
 ["Tu gardes cinq photos.","cinq photos","Tu en gardes cinq."],
 ["Nour vend un billet.","un billet","Nour en vend un."],
 ["Vous plantez six arbres.","six arbres","Vous en plantez six."],
 ["Ils collectionnent beaucoup de timbres.","beaucoup de timbres","Ils en collectionnent beaucoup."],
 ["Nous utilisons peu de papier.","peu de papier","Nous en utilisons peu."],
 ["Elle apporte assez de chaises.","assez de chaises","Elle en apporte assez."],
 ],
 en_thing:[
 ["Tu parles de ce film.","de ce film","Tu en parles."],
 ["Nous discutons du règlement.","du règlement","Nous en discutons."],
 ["Lina rêve de ce voyage.","de ce voyage","Lina en rêve."],
 ["Vous profitez du beau temps.","du beau temps","Vous en profitez."],
 ["Sami a besoin de son ordinateur.","de son ordinateur","Sami en a besoin."],
 ["Elle se souvient de cette histoire.","de cette histoire","Elle s’en souvient."],
 ["Les élèves se servent de cette application.","de cette application","Les élèves s’en servent."],
 ["Nous doutons de cette information.","de cette information","Nous en doutons."],
 ["Tu t’occupes du matériel.","du matériel","Tu t’en occupes."],
 ["Vous vous méfiez de cette publicité.","de cette publicité","Vous vous en méfiez."],
 ["Nour se plaint du bruit.","du bruit","Nour s’en plaint."],
 ["Les joueurs parlent de leur victoire.","de leur victoire","Les joueurs en parlent."],
 ["Le village dépend de cette source.","de cette source","Le village en dépend."],
 ["Nous bénéficions de cette réduction.","de cette réduction","Nous en bénéficions."],
 ],
};
// Additional independent sentences provide reserve capacity without changing
// existing question identities or broadening the target constructions.
groups.y_place.push(
 ["Les campeurs s’installent près du ruisseau.","près du ruisseau","Les campeurs s’y installent."],
 ["Vous rangez les costumes dans cette armoire.","dans cette armoire","Vous y rangez les costumes."],
 ["La navette s’arrête devant la mairie.","devant la mairie","La navette s’y arrête."],
 ["Nous grimpons sur la colline.","sur la colline","Nous y grimpons."],
);
groups.y_thing.push(
 ["La mairie réfléchit à cet aménagement.","à cet aménagement","La mairie y réfléchit."],
 ["Les chercheurs contribuent à cette étude.","à cette étude","Les chercheurs y contribuent."],
 ["Vous croyez à cette promesse.","à cette promesse","Vous y croyez."],
 ["Tu participes à ce débat.","à ce débat","Tu y participes."],
);
groups.en_origin.push(
 ["La photographe revient de Dakar.","de Dakar","La photographe en revient."],
 ["Nous sortons du laboratoire.","du laboratoire","Nous en sortons."],
 ["Le guide descend du belvédère.","du belvédère","Le guide en descend."],
 ["Tu t’éloignes de la falaise.","de la falaise","Tu t’en éloignes."],
);
groups.en_quantity.push(
 ["Les bénévoles distribuent huit couvertures.","huit couvertures","Les bénévoles en distribuent huit."],
 ["Tu achètes un carnet.","un carnet","Tu en achètes un."],
 ["Nous récoltons beaucoup de fraises.","beaucoup de fraises","Nous en récoltons beaucoup."],
 ["La pâtissière ajoute du sucre.","du sucre","La pâtissière en ajoute."],
);
groups.en_thing.push(
 ["Vous discutez de ce résultat.","de ce résultat","Vous en discutez."],
 ["Elle se souvient de cette rencontre.","de cette rencontre","Elle s’en souvient."],
 ["Les sportifs profitent de cette pause.","de cette pause","Les sportifs en profitent."],
 ["Nous nous occupons du rangement.","du rangement","Nous nous en occupons."],
);
export const Y_EN_DRAFTS=Object.entries(groups).flatMap(([construction,rows])=>rows.map(([sentence,target,answer],index)=>({
 key:`${construction}-${index+1}`,construction,nodeKey:"produire_pronoms_y_en",sentence,target,answer,
 reason:construction==="y_place"?"Y reprend le lieu où l’on est ou vers lequel on va; il ne s’agit pas d’une provenance.":construction==="y_thing"?"Y reprend le complément non humain construit avec à.":construction==="en_origin"?"En reprend un lieu de provenance construit avec de.":construction==="en_quantity"?"En reprend le nom associé à une quantité ou à un partitif. La quantité explicite reste exprimée.":"En reprend ici un complément non humain construit avec de, distinct d’une provenance ou d’une quantité.",
})));
