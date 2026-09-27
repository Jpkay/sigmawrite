import type {TargetTeachingContent} from './teaching-content';

type Row=readonly [string,string,string,string];
const auxiliary:readonly Row[]=[
 ['J’ai rangé les feutres.','J’ai trois feutres dans ma trousse.','J’ai besoin de feutres pour mon dessin.','J’ai envie de dessiner un personnage.'],
 ['Tu as retrouvé ton bonnet.','Tu as un bonnet rouge.','Tu as froid aux oreilles.','Tu as de la chance avec ce temps.'],
 ['Il a construit une cabane.','Il a une cabane.','Il a peur du vent.','Il a huit ans.'],
 ['Nous avons compris la consigne.','Nous avons une consigne pour chaque atelier.','Nous avons des questions sur ce travail.','Nous avons du temps avant la récréation.'],
 ['Vous avez choisi un film.','Vous avez deux billets.','Vous avez faim après cette longue promenade.','Vous avez une place libre.'],
 ['Elles ont préparé le repas.','Elles ont une grande cuisine.','Elles ont de bonnes idées.','Elles ont soif.'],
 ['Je suis arrivé à midi.','Je suis dans le hall.','Je suis très impatient.','Je suis le délégué.'],
 ['Tu es revenu de Liège hier.','Tu es à Liège avec toute ta famille.','Tu es mon voisin.','Tu es calme.'],
 ['Elle est partie à six heures.','Elle est chez sa tante depuis le début des vacances.','Elle est infirmière dans le grand hôpital près du parc.','Elle est joyeuse à l’idée de cette prochaine sortie.'],
 ['Nous sommes entrés par le portail.','Nous sommes devant le portail.','Nous sommes nombreux dans la cour de cette école.','Nous sommes les voisins.'],
 ['Vous êtes venus en train ce matin.','Vous êtes dans le train.','Vous êtes en avance.','Vous êtes très aimables avec les nouveaux élèves de la classe.'],
 ['Ils sont allés au marché ce matin.','Ils sont au marché couvert près de la gare.','Ils sont curieux de tout ce qui les entoure.','Ils sont les clients de cette nouvelle petite librairie.'],
];
const passeCompose:readonly Row[]=[
 ['J’ai photographié la falaise.','Je photographiais la falaise.','J’avais photographié la falaise.','Je photographierai la falaise.'],
 ['Tu as rempli la gourde.','Tu remplissais la gourde.','Tu avais rempli la gourde.','Tu vas remplir la gourde.'],
 ['La chatte est sortie sur le balcon.','La chatte sortait sur le balcon.','La chatte était sortie sur le balcon.','La chatte sort sur le balcon.'],
 ['Nous avons écrit une devinette.','Nous écrivions une devinette.','Nous avions écrit une devinette.','Nous écrirons une devinette.'],
 ['Vous avez vu une éclipse.','Vous voyiez une éclipse.','Vous aviez vu une éclipse.','Vous verrez une éclipse.'],
 ['Les voyageurs sont arrivés au refuge.','Les voyageurs arrivaient au refuge.','Les voyageurs étaient arrivés au refuge.','Les voyageurs arriveront au refuge.'],
 ['Je n’ai pas reçu le colis.','Je ne recevais pas le colis.','Je n’avais pas reçu le colis.','Je ne reçois pas le colis.'],
 ['Tu as déjà entendu cette mélodie.','Tu entendais déjà cette mélodie.','Tu avais déjà entendu cette mélodie.','Tu entends déjà cette mélodie.'],
 ['La gardienne a été patiente.','La gardienne était patiente.','La gardienne avait été patiente.','La gardienne est patiente.'],
 ['Nous avons eu une panne.','Nous avions une panne.','Nous avions eu une panne.','Nous aurons une panne.'],
 ['Vous vous êtes levés avant l’aube.','Vous vous leviez avant l’aube.','Vous vous étiez levés avant l’aube.','Vous vous lèverez avant l’aube.'],
 ['Les musiciennes ont fait un essai.','Les musiciennes faisaient un essai.','Les musiciennes avaient fait un essai.','Les musiciennes feront un essai.'],
];
const plusQueParfait:readonly Row[]=[
 ['J’avais réservé une table.','J’ai réservé une table.','Je réservais une table.','J’aurai réservé une table.'],
 ['Tu avais perdu ton écharpe.','Tu as perdu ton écharpe.','Tu perdais ton écharpe.','Tu aurais perdu ton écharpe.'],
 ['La cycliste était descendue de son vélo.','La cycliste est descendue de son vélo.','La cycliste descendait de son vélo.','La cycliste sera descendue de son vélo.'],
 ['Nous avions lu la notice.','Nous avons lu la notice.','Nous lisions la notice.','Nous aurons lu la notice.'],
 ['Vous aviez pris des notes.','Vous avez pris des notes.','Vous preniez des notes.','Vous auriez pris des notes.'],
 ['Les enfants étaient rentrés du stade.','Les enfants sont rentrés du stade.','Les enfants rentraient du stade.','Les enfants seront rentrés du stade.'],
 ['Je n’avais pas ouvert l’enveloppe.','Je n’ai pas ouvert l’enveloppe.','Je n’ouvrais pas l’enveloppe.','Je n’aurais pas ouvert l’enveloppe.'],
 ['Tu avais déjà réparé la sonnette.','Tu as déjà réparé la sonnette.','Tu réparais déjà la sonnette.','Tu auras déjà réparé la sonnette.'],
 ['Le trajet avait été agréable.','Le trajet a été agréable.','Le trajet était agréable.','Le trajet aura été agréable.'],
 ['Nous avions eu un empêchement.','Nous avons eu un empêchement.','Nous avions un empêchement.','Nous aurions eu un empêchement.'],
 ['Vous vous étiez couchés tôt.','Vous vous êtes couchés tôt.','Vous vous couchiez tôt.','Vous vous seriez couchés tôt.'],
 ['Les apprenties avaient fait un croquis.','Les apprenties ont fait un croquis.','Les apprenties faisaient un croquis.','Les apprenties auront fait un croquis.'],
];
const groups=[
 {key:'auxiliary',nodeKey:'reconnaitre_auxiliaire' as const,rows:auxiliary,prompt:'Dans quelle phrase avoir ou être aide-t-il à former un temps composé, comme auxiliaire ?',reason:'L’auxiliaire accompagne un participe passé pour former le temps composé. Dans les autres réponses, avoir ou être ne joue pas ce rôle.'},
 {key:'passe-compose',nodeKey:'reconnaitre_passe_compose' as const,rows:passeCompose,prompt:'Quelle phrase contient un verbe au passé composé ?',reason:'Le passé composé associe avoir ou être au présent à un participe passé. Observe la forme complète, même avec une négation ou un adverbe.'},
 {key:'plus-que-parfait',nodeKey:'reconnaitre_plus_que_parfait' as const,rows:plusQueParfait,prompt:'Quelle phrase contient un verbe au plus-que-parfait ?',reason:'Le plus-que-parfait associe avoir ou être à l’imparfait à un participe passé. Un auxiliaire à un autre temps ne donne pas le plus-que-parfait.'},
];
export const COMPOUND_RECOGNITION_DRAFTS=groups.flatMap(g=>g.rows.map(([answer,...others],index)=>({key:`${g.key}-form-${index+1}`,nodeKey:g.nodeKey,prompt:g.prompt,answer,distractors:others as [string,string,string],assessedTexts:[answer,...others],reason:g.reason})));

function practice(prefix:string,rows:readonly Row[],hintFr:string,explanationFr:string){return rows.map(([answerFr,...others],index)=>({id:`${prefix}-guided-${index+1}`,promptFr:prefix==='auxiliary'?'Dans quelle phrase le verbe avoir ou être sert-il d’auxiliaire ?':`Quelle phrase est au ${prefix==='passe-compose'?'passé composé':'plus-que-parfait'} ?`,choices:[answerFr,...others],answerFr,hintFr,explanationFr}));}
const lessons:readonly TargetTeachingContent[]=[
 {id:'french-v3-teaching:auxiliary:recognition',nodeKey:'reconnaitre_auxiliaire',mode:'recognition',status:'draft_requires_review',titleFr:'Repérer le verbe qui aide à conjuguer',learnerQuestionFr:'Dans « elle a dansé », à quoi sert le petit mot « a » ?',
 steps:[
  {exampleFr:'Elle danse. → Elle a dansé.',explanationFr:'Dans a dansé, deux mots forment ensemble le verbe au passé composé. A est le verbe avoir : il aide ici à conjuguer danser. Ce verbe qui aide s’appelle un auxiliaire.'},
  {exampleFr:'Elle a dansé.\nElle est tombée hier.',explanationFr:'Avoir et être peuvent jouer ce rôle. Dansé et tombée sont les formes qui les accompagnent, appelées participes passés. Repère les deux morceaux ensemble.'},
  {exampleFr:'Elle a un vélo.\nElle est sportive.',explanationFr:'Ici, avoir exprime ce qu’elle possède et être relie elle à sportive. Ils ne servent pas à former un temps composé. Voir avoir ou être ne suffit donc pas à reconnaître un auxiliaire.'},
  {exampleFr:'Elle n’a pas dansé.\nElle avait dansé.',explanationFr:'La négation peut séparer l’auxiliaire du participe. L’auxiliaire peut aussi changer de temps : a et avait aident tous les deux à conjuguer danser.'},
 ],takeawayFr:'Observe le rôle du mot : avoir ou être aide-t-il à conjuguer un autre verbe avec un participe passé ?',boundaryFr:'Cette leçon porte sur les temps composés. Être sert aussi à construire la voix passive, étudiée séparément. Reconnaître un auxiliaire ne suffit pas à choisir le bon ni à accorder le participe.',
 practice:practice('auxiliary',[
 ['J’ai découpé le carton.','J’ai du carton.','J’ai une règle.','J’ai besoin de colle.'],
 ['Tu es revenu à neuf heures.','Tu es chez toi.','Tu es rapide.','Tu es mon ami.'],
 ['Elle avait dessiné une étoile.','Elle avait un crayon.','Elle avait faim.','Elle avait une idée.'],
 ['Nous sommes partis lundi.','Nous sommes lundi.','Nous sommes dehors.','Nous sommes élèves.'],
 ['Vous n’avez pas oublié la clé.','Vous n’avez pas de clé.','Vous n’avez pas peur.','Vous n’avez pas le temps.'],
 ['Ils étaient venus à pied.','Ils étaient heureux.','Ils étaient dans la rue.','Ils étaient trois.'],
 ],'Cherche la forme d’avoir ou d’être qui accompagne le participe d’un autre verbe.','Dans la réponse, avoir ou être aide à former le temps composé. Les autres phrases utilisent avoir ou être sans cette construction.')},
 {id:'french-v3-teaching:passe-compose:recognition',nodeKey:'reconnaitre_passe_compose',mode:'recognition',status:'draft_requires_review',titleFr:'Reconnaître le passé composé',learnerQuestionFr:'Que remarques-tu dans « nous avons chanté » ?',
 steps:[
  {exampleFr:'Nous chantons. → Nous avons chanté.',explanationFr:'Avons chanté présente ici l’action comme accomplie. Le verbe a deux morceaux : avons, l’auxiliaire avoir au présent, et chanté, le participe passé de chanter. Cet ensemble est au passé composé.'},
  {exampleFr:'Il est venu hier.\nElle est venue hier.',explanationFr:'Le passé composé peut aussi utiliser être au présent. Dans est venu et est venue, le temps reste le même malgré la différence d’écriture du participe.'},
  {exampleFr:'Nous avons chanté.\nNous avions chanté.',explanationFr:'Le temps de l’auxiliaire fait la différence : avons est au présent, donc avons chanté est au passé composé. Avions est à l’imparfait : avions chanté est au plus-que-parfait.'},
  {exampleFr:'Elle n’a pas dansé.\nElle a souvent dansé.',explanationFr:'Pas ou souvent peut séparer les deux morceaux. Repère toujours a et dansé ensemble : la négation ou l’adverbe ne change pas le temps.'},
 ],takeawayFr:'Passé composé : avoir ou être au présent + participe passé.',boundaryFr:'Le sens de passé ne suffit pas : plusieurs temps parlent du passé. Cette reconnaissance ne prouve pas que tu sais choisir l’auxiliaire ou écrire les accords.',
 practice:practice('passe-compose',[
 ['J’ai fermé le coffre.','Je fermais le coffre.','J’avais fermé le coffre.','Je fermerai le coffre.'],
 ['Tu es parti à l’entraînement.','Tu partais à l’entraînement.','Tu étais parti à l’entraînement.','Tu partiras à l’entraînement.'],
 ['Elle a été attentive.','Elle était attentive.','Elle avait été attentive.','Elle est attentive.'],
 ['Nous n’avons pas oublié le rendez-vous.','Nous n’oubliions pas le rendez-vous.','Nous n’avions pas oublié le rendez-vous.','Nous n’oublions pas le rendez-vous.'],
 ['Vous avez déjà mangé la tarte.','Vous mangiez déjà la tarte.','Vous aviez déjà mangé la tarte.','Vous mangerez la tarte.'],
 ['Elles se sont réveillées tôt.','Elles se réveillaient tôt.','Elles s’étaient réveillées tôt.','Elles se réveilleront tôt.'],
 ],'Repère l’auxiliaire au présent et le participe passé.','La réponse combine avoir ou être au présent avec un participe passé. Le plus-que-parfait emploierait un auxiliaire à l’imparfait.')},
 {id:'french-v3-teaching:plus-que-parfait:recognition',nodeKey:'reconnaitre_plus_que_parfait',mode:'recognition',status:'draft_requires_review',titleFr:'Reconnaître le plus-que-parfait',learnerQuestionFr:'Dans « quand tu es arrivé, j’avais terminé », qu’est-ce qui était déjà fait ?',
 steps:[
  {exampleFr:'Quand tu es arrivé, j’avais terminé mon dessin.',explanationFr:'Le dessin était terminé avant ton arrivée. Avais terminé situe ici une action avant une autre action passée. Cette forme s’appelle le plus-que-parfait.'},
  {exampleFr:'j’avais terminé\nnous avions terminé',explanationFr:'Repère avoir à l’imparfait, avais ou avions, puis terminé, le participe passé. Les deux morceaux ensemble forment le plus-que-parfait.'},
  {exampleFr:'elle était venue\nils étaient venus',explanationFr:'Être peut aussi servir d’auxiliaire. Était et étaient sont à l’imparfait ; venue et venus sont des participes passés.'},
  {exampleFr:'j’ai terminé\nj’avais terminé\nje terminais',explanationFr:'Ai terminé est au passé composé. Avais terminé est au plus-que-parfait. Terminais est à l’imparfait : il n’y a pas d’auxiliaire suivi d’un participe dans cette forme.'},
 ],takeawayFr:'Plus-que-parfait : avoir ou être à l’imparfait + participe passé.',boundaryFr:'Repère la forme, même sans récit complet ni mot déjà. Ses différents emplois, le choix de l’auxiliaire et les accords se travaillent séparément.',
 practice:practice('plus-que-parfait',[
 ['J’avais nettoyé les pinceaux.','J’ai nettoyé les pinceaux.','Je nettoyais les pinceaux.','J’aurai nettoyé les pinceaux.'],
 ['Tu étais allé à la piscine.','Tu es allé à la piscine.','Tu allais à la piscine.','Tu serais allé à la piscine.'],
 ['Elle avait été malade.','Elle a été malade.','Elle était malade.','Elle aura été malade.'],
 ['Nous n’avions pas compris la blague.','Nous n’avons pas compris la blague.','Nous ne comprenions pas la blague.','Nous n’aurions pas compris la blague.'],
 ['Vous aviez déjà vendu le meuble.','Vous avez déjà vendu le meuble.','Vous vendiez déjà le meuble.','Vous aurez déjà vendu le meuble.'],
 ['Elles s’étaient installées au premier rang.','Elles se sont installées au premier rang.','Elles s’installaient au premier rang.','Elles se seraient installées au premier rang.'],
 ],'Cherche avoir ou être à l’imparfait, puis un participe passé.','La réponse contient un auxiliaire à l’imparfait suivi du participe. L’imparfait seul, le passé composé et les autres temps composés ont des formes différentes.')},
];
export const COMPOUND_RECOGNITION_TEACHING=lessons.map(lesson=>({...lesson,materialExposure:{sentences:[...lesson.steps.map(s=>s.exampleFr),...lesson.practice.flatMap(p=>[p.promptFr,...p.choices!])]}}));
