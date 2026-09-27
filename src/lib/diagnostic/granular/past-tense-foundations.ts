import type {TargetTeachingContent} from './teaching-content';
const labels=['Passé simple','Imparfait','Passé composé','Présent'] as const;
type TenseExample=[string,string,typeof labels[number]];
const tenseExamples:TenseExample[]=[
 ['Lina entra dans la grotte.','entra','Passé simple'],['Les enfants découvrirent un passage.','découvrirent','Passé simple'],['Je trouvai une pièce sous le tapis.','trouvai','Passé simple'],['Tu traversas le village avant la nuit.','traversas','Passé simple'],['Nous finîmes notre récit à cet instant.','finîmes','Passé simple'],['Vous prîtes alors la route du nord.','prîtes','Passé simple'],['Le voyageur fut surpris par ce bruit.','fut','Passé simple'],['Ils eurent enfin une réponse.','eurent','Passé simple'],['Elle vint nous chercher au matin.','vint','Passé simple'],['Je vis une lumière au loin.','vis','Passé simple'],['Nous marchâmes jusqu’au refuge.','marchâmes','Passé simple'],['Vous lançâtes la corde vers la barque.','lançâtes','Passé simple'],
 ['La rivière coulait derrière le moulin.','coulait','Imparfait'],['Nous attendions près de la fontaine.','attendions','Imparfait'],['Tu observais les oiseaux en silence.','observais','Imparfait'],['Les habitants semblaient inquiets.','semblaient','Imparfait'],
 ['Elle a ouvert la vieille boîte.','a ouvert','Passé composé'],['Nous sommes arrivés après le coucher du soleil.','sommes arrivés','Passé composé'],['Tu as choisi le bon chemin.','as choisi','Passé composé'],['Les invités ont apporté une carte.','ont apporté','Passé composé'],
 ['Les enfants jouent dans la cour.','jouent','Présent'],['Nous finissons notre affiche.','finissons','Présent'],['Vous prenez le bus chaque matin.','prenez','Présent'],['Je vois ton nom sur la liste.','vois','Présent'],
];
const tensePrompt=(sentence:string,form:string)=>`${sentence}\n\nÀ quel temps est le verbe « ${form} » ?`;
type EventExample=[string,string,string,string];
const eventExamples:EventExample[]=[
 ['Le vent soufflait.','Lina a fermé la fenêtre.','La cour était vide.','Elle espérait du soleil.'],
 ['Il faisait froid.','Nous avons marché pendant deux heures.','La route était déserte.','Les sommets semblaient proches.'],
 ['La salle était calme.','Les invités ont applaudi à la fin du discours.','Les rideaux étaient rouges.','Une lampe éclairait la scène.'],
 ['J’avais faim.','J’ai mangé une pomme avant le départ.','Le ciel était gris.','Le train semblait en retard.'],
 ['Tu portais un grand sac.','Tu as posé ce sac sur le banc.','Le jardin était silencieux.','Une odeur de fleurs flottait dans l’air.'],
 ['Le coffre paraissait ancien.','Le gardien a tourné la clé.','Le couloir était sombre.','Nous attendions près du mur.'],
 ['Le soleil brillait.','Vous avez traversé le pont en cinq minutes.','La rivière coulait lentement.','Un arbre dominait la rive.'],
 ['Les feuilles étaient mouillées.','Un écureuil a bondi sur la branche.','Le sentier était étroit.','La forêt sentait la mousse.'],
 ['Nous étions dans le grenier.','Nous avons cherché la lettre tout l’après-midi.','La pièce était poussiéreuse.','Une horloge fonctionnait encore.'],
 ['La gare était pleine.','Le train est parti à neuf heures.','Les voyageurs semblaient pressés.','Un agent surveillait le quai.'],
 ['Le spectacle semblait terminé.','La chanteuse est revenue pour un dernier morceau.','Le public attendait.','Les lumières étaient encore allumées.'],
 ['Le livre était très épais.','Lina a lu ce livre en une semaine.','La couverture était bleue.','Les pages sentaient le papier neuf.'],
];
const eventPrompt=(parts:EventExample)=>`${parts.join(' ')}\n\nQuelle phrase présente un événement accompli, ou une durée délimitée dans le passé, plutôt qu’un état ou une action en cours ?`;
export const PAST_TENSE_FOUNDATION_DRAFTS=[
 ...tenseExamples.map(([sentence,form,answer],i)=>({key:`recognition-${i+1}`,nodeKey:'reconnaitre_passe_simple',prompt:tensePrompt(sentence,form),answer,distractors:labels.filter(l=>l!==answer),assessedTexts:[sentence],reason:`Le verbe « ${form} » est au ${answer.toLocaleLowerCase('fr')} dans cette phrase.`})),
 ...eventExamples.map((parts,i)=>({key:`bounded-event-${i+1}`,nodeKey:'interpreter_passe_compose',prompt:eventPrompt(parts),answer:parts[1],distractors:[parts[0],parts[2],parts[3]],assessedTexts:[parts.join(' ')],reason:'Le passé composé présente ici un événement accompli ou une durée délimitée. Les autres phrases décrivent le cadre ou une situation en cours.'})),
];
const tenseGuided:TenseExample[]=[['Le garçon poussa la porte.','poussa','Passé simple'],['Il poussait souvent cette porte.','poussait','Imparfait'],['Il a poussé la porte.','a poussé','Passé composé'],['Nous aperçûmes une tour.','aperçûmes','Passé simple'],['Les filles sortirent de la cabane.','sortirent','Passé simple'],['Nous sortons de la cabane.','sortons','Présent']];
const eventGuided:EventExample[]=[
 ['La ville était endormie.','Une cloche a sonné à minuit.','Le ciel était noir.','Une brume cachait les toits.'],
 ['Il pleuvait.','Nous avons attendu une heure sous cet abri.','Le vent soufflait fort.','Le chemin était boueux.'],
 ['Lina avait soif.','Elle a bu un verre d’eau.','La cuisine était fraîche.','Une radio fonctionnait dans le salon.'],
 ['Le parc était fermé.','Les visiteurs sont repartis vers le village.','La nuit approchait.','Le gardien paraissait fatigué.'],
 ['Tu étais inquiet.','Tu as retrouvé ta clé dans ta poche.','Le bus semblait plein.','Les passants marchaient vite.'],
 ['Le puzzle était difficile.','Vous avez terminé ce puzzle en deux jours.','Ses couleurs étaient très proches.','La table occupait tout le salon.'],
];
const recognitionSteps=[
 {exampleFr:'Le chat dormait. Soudain, il bondit sur la table.',explanationFr:'Dans un récit écrit, bondit raconte ici une action du personnage. Cette forme est au passé simple. Dormait, à l’imparfait, présente la situation en cours.'},
 {exampleFr:'il parla · nous parlâmes · ils parlèrent\nil prit · nous prîmes · ils prirent\nelle fut · elles furent',explanationFr:'Le passé simple a des formes en un seul mot. Certaines terminaisons aident à le reconnaître, comme -âmes, -èrent ou -irent. Des verbes fréquents ont des formes particulières, comme fut et prit.'},
 {exampleFr:'elle entra · elle entrait · elle est entrée · elle entre',explanationFr:'Compare le verbe entier : entra est un passé simple, entrait un imparfait, est entrée un passé composé et entre un présent. Le passé composé comprend ici un auxiliaire et un participe passé.'},
 {exampleFr:'Aujourd’hui, je finis mon dessin.\nCe jour-là, je finis mon dessin, puis je quittai la pièce.',explanationFr:'Finis peut avoir la même orthographe au présent et au passé simple. Lis le contexte et les autres verbes. Si une forme isolée ne permet pas de trancher, ne devine pas son temps.'},
];
const eventSteps=[
 {exampleFr:'Il pleuvait. Lina a ouvert son parapluie.',explanationFr:'Il pleuvait décrit la situation. A ouvert raconte ce qui s’est produit. Dans ce contexte, le passé composé présente l’événement comme accompli.'},
 {exampleFr:'Nous avons travaillé pendant trois heures, puis nous sommes rentrés.',explanationFr:'Un événement au passé composé n’est pas forcément bref. Pendant trois heures donne ici une durée délimitée. Le récit considère cette période de travail comme terminée.'},
 {exampleFr:'Le jardin était calme. Un chat a sauté par-dessus le mur.',explanationFr:'Pour trouver l’événement accompli, demande-toi ce qui s’est produit dans le cadre décrit. A sauté présente ici cet événement ; était calme décrit le cadre.'},
];
export const PAST_TENSE_FOUNDATION_TEACHING:readonly TargetTeachingContent[]=[
 {id:'french-v3-teaching:past-foundation:passe-simple-recognition',nodeKey:'reconnaitre_passe_simple',mode:'recognition',status:'draft_requires_review',titleFr:'Reconnaître le passé simple dans un récit',learnerQuestionFr:'Comment reconnaître le temps des verbes dans une histoire ?',steps:recognitionSteps,
 practice:tenseGuided.map(([sentence,form,answer],i)=>({id:`past-recognition-guided-${i}`,promptFr:tensePrompt(sentence,form),choices:[...labels],answerFr:answer,hintFr:'Observe le verbe entier, sa terminaison et le contexte.',explanationFr:`Dans cette phrase, « ${form} » est au ${answer.toLocaleLowerCase('fr')}.`})),takeawayFr:'Observe la forme entière et lis le contexte pour distinguer le passé simple des autres temps.',boundaryFr:'Reconnaître un temps ne prouve pas encore que tu sais conjuguer tous les verbes à ce temps. Certaines formes ont plusieurs analyses possibles sans contexte.',materialExposure:{sentences:[...recognitionSteps.map(s=>s.exampleFr),...tenseGuided.map(r=>r[0])]}},
 {id:'french-v3-teaching:past-foundation:passe-compose-value',nodeKey:'interpreter_passe_compose',mode:'recognition',status:'draft_requires_review',titleFr:'Repérer un événement accompli dans un récit',learnerQuestionFr:'Qu’est-ce qui s’est produit dans la situation racontée ?',steps:eventSteps,
 practice:eventGuided.map((parts,i)=>({id:`past-event-guided-${i}`,promptFr:eventPrompt(parts),choices:[...parts],answerFr:parts[1],hintFr:'Distingue le cadre de ce qui s’est produit ou de la période de temps délimitée.',explanationFr:`« ${parts[1]} » présente ici l’événement accompli ou sa durée délimitée. Les autres phrases donnent le cadre.`})),takeawayFr:'Dans ces récits, le passé composé présente un événement accompli ou une période délimitée. Cet événement peut durer longtemps.',boundaryFr:'Le contexte compte : le passé composé n’indique pas toujours une action courte. Cette leçon porte sur son interprétation dans ces récits, pas sur tous ses emplois ni sur la formation du participe passé.',materialExposure:{sentences:[...eventSteps.map(s=>s.exampleFr),...eventGuided.map(r=>r.join(' '))]}},
];
