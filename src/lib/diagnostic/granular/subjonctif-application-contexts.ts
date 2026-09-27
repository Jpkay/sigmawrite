import {PERSONS,type Person} from '@/lib/linguistic/conjugation';

/** Original controlled-form applications. The mode is supplied, not inferred.
 * Two different situations per grammatical person, separate from the lessons.
 * Allocation and exposure checks decide eligibility; order is not a release. */
const contexts:readonly [string,string][]=[
 ['être','sur la photo de classe|au premier rang du concert|absent pendant le contrôle|dans le prochain groupe|en retard à cause du train|déjà sur le terrain|dans une autre salle|seul à connaître ce passage|encore au gymnase|les premiers à arriver|dans la mauvaise file|en avance sur leur programme'],
 ['avoir','une autre solution en tête|un rendez-vous cet après-midi|encore faim après la marche|besoin d’un dictionnaire|des nouvelles du concours|une panne de batterie|une place dans cette équipe|le même livre que moi|un problème avec son micro|une visite demain|une réponse avant vendredi|des places côte à côte'],
 ['aller','au marché avec ma tante|chercher du pain|à la piscine mercredi|au parc après le repas|voir une exposition|vers le mauvais bâtiment|à la gare à pied|au cinéma samedi|récupérer son ballon|au centre culturel|à la patinoire dimanche|chez leur cousin ce soir'],
 ['faire','un détour par la poste|une erreur de calcul|du bruit en installant les bancs|une affiche pour le club|un gâteau pour la fête|un match contre les voisins|une découverte dans ce livre|un nouveau montage vidéo|une course près du lac|une sortie au musée|un quiz après la lecture|des recherches sur les volcans'],
 ['prendre','un taxi pour rentrer|le dernier morceau de pain|une photo du paysage|des notes pendant la visite|le train de midi|un repas à la cantine|un livre sur les insectes|ton casque rouge|la route du village|un raccourci par le parc|des mesures pour le décor|le départ en même temps'],
 ['venir','dès lundi matin|au spectacle de danse|en tramway ce soir|après notre cours de musique|pour visiter le laboratoire|avec leur nouvelle chanson|au festival du quartier|récupérer ton écharpe|pour réparer la fenêtre|avec des jeux de société|assister à la projection|en vélo depuis le village'],
 ['partir','pour Lyon cet été|de la gare centrale|pendant les vacances|avec le car de neuf heures|en voyage la semaine prochaine|avant le lever du soleil|d’ici dans dix minutes|vers la montagne|sans son parapluie|pour une balade en forêt|en dernier après le rangement|dès la fin du tournoi'],
 ['sortir','les assiettes du placard|ton chien après le repas|un livre de sa poche|du cinéma par cette porte|du bâtiment après la sonnerie|leurs instruments des housses|mon téléphone pour vérifier l’heure|la tarte du four|les déchets ce soir|les vélos de la cave|de la piscine à midi|de chez eux avant nous'],
 ['dire','quelques mots au micro|la même chose que ton frère|son avis sur ce roman|bonjour aux nouveaux élèves|le titre de votre morceau|le mot de passe au gardien|la date à voix basse|un mot pour encourager l’équipe|merci à la conductrice|notre choix avant midi|combien de places il reste|quel chemin ils ont suivi'],
 ['voir','une étoile filante|un renard près du bois|un bateau à l’horizon|le sommet depuis le village|une différence entre ces images|un arc-en-ciel après la pluie|mon cousin au stade|ton nom sur la liste|une lumière au grenier|le début du défilé|un passage entre les rochers|des traces dans la neige'],
 ['pouvoir','réserver une table|terminer avant la sonnerie|répondre à cette question|entrer par la cour|utiliser cet ordinateur|jouer dans le prochain match|finir le puzzle ce soir|venir à pied demain|prêter son appareil photo|trouver une salle libre|participer à la sortie|réparer leur maquette'],
 ['vouloir','apprendre la guitare|lire la suite du manga|garder son ancien maillot|organiser une collecte|partager votre récit|monter un groupe de musique|essayer ce nouveau jeu|inviter ta voisine|adopter un chat|préparer une surprise|choisir une autre couleur|découvrir le village'],
 ['savoir','réparer cette fermeture|quel chemin mène au lac|où se trouve la clé|comment démarrer le projecteur|qui a gagné la course|où acheter les billets|jouer ce morceau au piano|pourquoi le train s’arrête|combien coûte l’entrée|comment joindre la responsable|quel bus dessert le musée|à qui appartient ce sac'],
 ['devoir','rapporter une autorisation|ranger ton casier|remplacer un joueur absent|attendre le prochain train|montrer votre carte à l’accueil|changer leur itinéraire|acheter une nouvelle pile|refaire cette photocopie|prendre un autre rendez-vous|annuler notre pique-nique|payer un supplément|finir leur projet lundi'],
];

export const SUBJONCTIF_APPLICATION_CONTEXTS:readonly [verb:string,person:Person,sentence:string][]=contexts.flatMap(([verb,joined])=>{
 const complements=joined.split('|');
 if(complements.length!==12)throw Error(`Expected two subject cycles for ${verb}`);
 return complements.map((tail,index)=>{
  const subject=['je','tu','elle','nous','vous','ils'][index%6];
  const prefix=index<6?'Il est possible que':'Il est peu probable que';
  return [verb,PERSONS[index%6],`${prefix} ${subject} ___ ${tail}.`.replace('que elle','qu’elle').replace('que ils','qu’ils')] as [string,Person,string];
 });
});
