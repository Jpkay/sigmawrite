import type {TargetTeachingContent} from "./teaching-content";

/** Sentence transformations, not independent writing or publication approval. */
export const PRONOUN_ORDER_DRAFTS = [
  {
    "key": "finite-1",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Mila range la couverture.",
    "prompt": "Réécris la phrase en remplaçant « la couverture » par « la ». Garde tous les autres mots et le même type de phrase.\n\nMila range la couverture.",
    "answer": "Mila la range.",
    "wrong": "Mila range la."
  },
  {
    "key": "finite-2",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Tu portes les paniers.",
    "prompt": "Réécris la phrase en remplaçant « les paniers » par « les ». Garde tous les autres mots et le même type de phrase.\n\nTu portes les paniers.",
    "answer": "Tu les portes.",
    "wrong": "Tu portes les."
  },
  {
    "key": "finite-3",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Nous cherchons le passage.",
    "prompt": "Réécris la phrase en remplaçant « le passage » par « le ». Garde tous les autres mots et le même type de phrase.\n\nNous cherchons le passage.",
    "answer": "Nous le cherchons.",
    "wrong": "Nous cherchons le."
  },
  {
    "key": "finite-4",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Les voisins réparent la clôture.",
    "prompt": "Réécris la phrase en remplaçant « la clôture » par « la ». Garde tous les autres mots et le même type de phrase.\n\nLes voisins réparent la clôture.",
    "answer": "Les voisins la réparent.",
    "wrong": "Les voisins réparent la."
  },
  {
    "key": "finite-5",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Je prépare les badges.",
    "prompt": "Réécris la phrase en remplaçant « les badges » par « les ». Garde tous les autres mots et le même type de phrase.\n\nJe prépare les badges.",
    "answer": "Je les prépare.",
    "wrong": "Je prépare les."
  },
  {
    "key": "finite-6",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Vous consultez le catalogue.",
    "prompt": "Réécris la phrase en remplaçant « le catalogue » par « le ». Garde tous les autres mots et le même type de phrase.\n\nVous consultez le catalogue.",
    "answer": "Vous le consultez.",
    "wrong": "Vous consultez le."
  },
  {
    "key": "finite-7",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Sami retrouve la boîte.",
    "prompt": "Réécris la phrase en remplaçant « la boîte » par « la ». Garde tous les autres mots et le même type de phrase.\n\nSami retrouve la boîte.",
    "answer": "Sami la retrouve.",
    "wrong": "Sami retrouve la."
  },
  {
    "key": "finite-8",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Les artistes présentent les portraits.",
    "prompt": "Réécris la phrase en remplaçant « les portraits » par « les ». Garde tous les autres mots et le même type de phrase.\n\nLes artistes présentent les portraits.",
    "answer": "Les artistes les présentent.",
    "wrong": "Les artistes présentent les."
  },
  {
    "key": "finite-9",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Elle plie le tissu.",
    "prompt": "Réécris la phrase en remplaçant « le tissu » par « le ». Garde tous les autres mots et le même type de phrase.\n\nElle plie le tissu.",
    "answer": "Elle le plie.",
    "wrong": "Elle plie le."
  },
  {
    "key": "finite-10",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Nous gardons les billets.",
    "prompt": "Réécris la phrase en remplaçant « les billets » par « les ». Garde tous les autres mots et le même type de phrase.\n\nNous gardons les billets.",
    "answer": "Nous les gardons.",
    "wrong": "Nous gardons les."
  },
  {
    "key": "finite-11",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Tu caches la surprise.",
    "prompt": "Réécris la phrase en remplaçant « la surprise » par « la ». Garde tous les autres mots et le même type de phrase.\n\nTu caches la surprise.",
    "answer": "Tu la caches.",
    "wrong": "Tu caches la."
  },
  {
    "key": "finite-12",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Le gardien ferme le portail.",
    "prompt": "Réécris la phrase en remplaçant « le portail » par « le ». Garde tous les autres mots et le même type de phrase.\n\nLe gardien ferme le portail.",
    "answer": "Le gardien le ferme.",
    "wrong": "Le gardien ferme le."
  },
  {
    "key": "infinitive-1",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Je vais peindre la barrière.",
    "prompt": "Réécris la phrase en remplaçant « la barrière » par « la ». Garde tous les autres mots et le même type de phrase.\n\nJe vais peindre la barrière.",
    "answer": "Je vais la peindre.",
    "wrong": "Je vais peindre la."
  },
  {
    "key": "infinitive-2",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Nous voulons lire les témoignages.",
    "prompt": "Réécris la phrase en remplaçant « les témoignages » par « les ». Garde tous les autres mots et le même type de phrase.\n\nNous voulons lire les témoignages.",
    "answer": "Nous voulons les lire.",
    "wrong": "Nous voulons lire les."
  },
  {
    "key": "infinitive-3",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Tu peux prendre le tabouret.",
    "prompt": "Réécris la phrase en remplaçant « le tabouret » par « le ». Garde tous les autres mots et le même type de phrase.\n\nTu peux prendre le tabouret.",
    "answer": "Tu peux le prendre.",
    "wrong": "Tu peux prendre le."
  },
  {
    "key": "infinitive-4",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Elle essaie de déplacer la commode.",
    "prompt": "Réécris la phrase en remplaçant « la commode » par « la ». Garde tous les autres mots et le même type de phrase.\n\nElle essaie de déplacer la commode.",
    "answer": "Elle essaie de la déplacer.",
    "wrong": "Elle essaie de déplacer la."
  },
  {
    "key": "infinitive-5",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Vous allez montrer les dessins.",
    "prompt": "Réécris la phrase en remplaçant « les dessins » par « les ». Garde tous les autres mots et le même type de phrase.\n\nVous allez montrer les dessins.",
    "answer": "Vous allez les montrer.",
    "wrong": "Vous allez montrer les."
  },
  {
    "key": "infinitive-6",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Ils souhaitent retrouver le sentier.",
    "prompt": "Réécris la phrase en remplaçant « le sentier » par « le ». Garde tous les autres mots et le même type de phrase.\n\nIls souhaitent retrouver le sentier.",
    "answer": "Ils souhaitent le retrouver.",
    "wrong": "Ils souhaitent retrouver le."
  },
  {
    "key": "infinitive-7",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Nous pouvons porter la malle.",
    "prompt": "Réécris la phrase en remplaçant « la malle » par « la ». Garde tous les autres mots et le même type de phrase.\n\nNous pouvons porter la malle.",
    "answer": "Nous pouvons la porter.",
    "wrong": "Nous pouvons porter la."
  },
  {
    "key": "infinitive-8",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Je veux nettoyer les pinceaux.",
    "prompt": "Réécris la phrase en remplaçant « les pinceaux » par « les ». Garde tous les autres mots et le même type de phrase.\n\nJe veux nettoyer les pinceaux.",
    "answer": "Je veux les nettoyer.",
    "wrong": "Je veux nettoyer les."
  },
  {
    "key": "infinitive-9",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Tu essaies de réparer le jouet.",
    "prompt": "Réécris la phrase en remplaçant « le jouet » par « le ». Garde tous les autres mots et le même type de phrase.\n\nTu essaies de réparer le jouet.",
    "answer": "Tu essaies de le réparer.",
    "wrong": "Tu essaies de réparer le."
  },
  {
    "key": "infinitive-10",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Elle va ranger les ficelles.",
    "prompt": "Réécris la phrase en remplaçant « les ficelles » par « les ». Garde tous les autres mots et le même type de phrase.\n\nElle va ranger les ficelles.",
    "answer": "Elle va les ranger.",
    "wrong": "Elle va ranger les."
  },
  {
    "key": "infinitive-11",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Vous pouvez garder la carte.",
    "prompt": "Réécris la phrase en remplaçant « la carte » par « la ». Garde tous les autres mots et le même type de phrase.\n\nVous pouvez garder la carte.",
    "answer": "Vous pouvez la garder.",
    "wrong": "Vous pouvez garder la."
  },
  {
    "key": "infinitive-12",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Ils veulent visiter le château.",
    "prompt": "Réécris la phrase en remplaçant « le château » par « le ». Garde tous les autres mots et le même type de phrase.\n\nIls veulent visiter le château.",
    "answer": "Ils veulent le visiter.",
    "wrong": "Ils veulent visiter le."
  },
  {
    "key": "negative-1",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Je ne trouve pas le ticket.",
    "prompt": "Réécris la phrase en remplaçant « le ticket » par « le ». Garde tous les autres mots et le même type de phrase.\n\nJe ne trouve pas le ticket.",
    "answer": "Je ne le trouve pas.",
    "wrong": "Je ne trouve pas le."
  },
  {
    "key": "negative-2",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Nous ne vendons pas la table.",
    "prompt": "Réécris la phrase en remplaçant « la table » par « la ». Garde tous les autres mots et le même type de phrase.\n\nNous ne vendons pas la table.",
    "answer": "Nous ne la vendons pas.",
    "wrong": "Nous ne vendons pas la."
  },
  {
    "key": "negative-3",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Tu ne connais pas les participantes.",
    "prompt": "Réécris la phrase en remplaçant « les participantes » par « les ». Garde tous les autres mots et le même type de phrase.\n\nTu ne connais pas les participantes.",
    "answer": "Tu ne les connais pas.",
    "wrong": "Tu ne connais pas les."
  },
  {
    "key": "negative-4",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Elle ne prête pas le vélo.",
    "prompt": "Réécris la phrase en remplaçant « le vélo » par « le ». Garde tous les autres mots et le même type de phrase.\n\nElle ne prête pas le vélo.",
    "answer": "Elle ne le prête pas.",
    "wrong": "Elle ne prête pas le."
  },
  {
    "key": "negative-5",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Vous ne fermez pas les volets.",
    "prompt": "Réécris la phrase en remplaçant « les volets » par « les ». Garde tous les autres mots et le même type de phrase.\n\nVous ne fermez pas les volets.",
    "answer": "Vous ne les fermez pas.",
    "wrong": "Vous ne fermez pas les."
  },
  {
    "key": "negative-6",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Ils ne rangent pas la cabane.",
    "prompt": "Réécris la phrase en remplaçant « la cabane » par « la ». Garde tous les autres mots et le même type de phrase.\n\nIls ne rangent pas la cabane.",
    "answer": "Ils ne la rangent pas.",
    "wrong": "Ils ne rangent pas la."
  },
  {
    "key": "negative-7",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Mina ne lit pas le journal.",
    "prompt": "Réécris la phrase en remplaçant « le journal » par « le ». Garde tous les autres mots et le même type de phrase.\n\nMina ne lit pas le journal.",
    "answer": "Mina ne le lit pas.",
    "wrong": "Mina ne lit pas le."
  },
  {
    "key": "negative-8",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Nous ne perdons pas les outils.",
    "prompt": "Réécris la phrase en remplaçant « les outils » par « les ». Garde tous les autres mots et le même type de phrase.\n\nNous ne perdons pas les outils.",
    "answer": "Nous ne les perdons pas.",
    "wrong": "Nous ne perdons pas les."
  },
  {
    "key": "negative-9",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Tu ne remplaces pas la serrure.",
    "prompt": "Réécris la phrase en remplaçant « la serrure » par « la ». Garde tous les autres mots et le même type de phrase.\n\nTu ne remplaces pas la serrure.",
    "answer": "Tu ne la remplaces pas.",
    "wrong": "Tu ne remplaces pas la."
  },
  {
    "key": "negative-10",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Les enfants ne touchent pas le vase.",
    "prompt": "Réécris la phrase en remplaçant « le vase » par « le ». Garde tous les autres mots et le même type de phrase.\n\nLes enfants ne touchent pas le vase.",
    "answer": "Les enfants ne le touchent pas.",
    "wrong": "Les enfants ne touchent pas le."
  },
  {
    "key": "negative-11",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Je ne mélange pas les couleurs.",
    "prompt": "Réécris la phrase en remplaçant « les couleurs » par « les ». Garde tous les autres mots et le même type de phrase.\n\nJe ne mélange pas les couleurs.",
    "answer": "Je ne les mélange pas.",
    "wrong": "Je ne mélange pas les."
  },
  {
    "key": "negative-12",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Vous ne déplacez pas la statue.",
    "prompt": "Réécris la phrase en remplaçant « la statue » par « la ». Garde tous les autres mots et le même type de phrase.\n\nVous ne déplacez pas la statue.",
    "answer": "Vous ne la déplacez pas.",
    "wrong": "Vous ne déplacez pas la."
  },
  {
    "key": "imperative-1",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Plie la serviette !",
    "prompt": "Réécris la phrase en remplaçant « la serviette » par « la ». Garde tous les autres mots et le même type de phrase.\n\nPlie la serviette !",
    "answer": "Plie-la !",
    "wrong": "La plie !"
  },
  {
    "key": "imperative-2",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Fermez les coffres !",
    "prompt": "Réécris la phrase en remplaçant « les coffres » par « les ». Garde tous les autres mots et le même type de phrase.\n\nFermez les coffres !",
    "answer": "Fermez-les !",
    "wrong": "Les fermez !"
  },
  {
    "key": "imperative-3",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Porte le seau !",
    "prompt": "Réécris la phrase en remplaçant « le seau » par « le ». Garde tous les autres mots et le même type de phrase.\n\nPorte le seau !",
    "answer": "Porte-le !",
    "wrong": "Le porte !"
  },
  {
    "key": "imperative-4",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Gardons la lettre !",
    "prompt": "Réécris la phrase en remplaçant « la lettre » par « la ». Garde tous les autres mots et le même type de phrase.\n\nGardons la lettre !",
    "answer": "Gardons-la !",
    "wrong": "La gardons !"
  },
  {
    "key": "imperative-5",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Montrez les esquisses !",
    "prompt": "Réécris la phrase en remplaçant « les esquisses » par « les ». Garde tous les autres mots et le même type de phrase.\n\nMontrez les esquisses !",
    "answer": "Montrez-les !",
    "wrong": "Les montrez !"
  },
  {
    "key": "imperative-6",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Cherche le cahier !",
    "prompt": "Réécris la phrase en remplaçant « le cahier » par « le ». Garde tous les autres mots et le même type de phrase.\n\nCherche le cahier !",
    "answer": "Cherche-le !",
    "wrong": "Le cherche !"
  },
  {
    "key": "imperative-7",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Rangez la caisse !",
    "prompt": "Réécris la phrase en remplaçant « la caisse » par « la ». Garde tous les autres mots et le même type de phrase.\n\nRangez la caisse !",
    "answer": "Rangez-la !",
    "wrong": "La rangez !"
  },
  {
    "key": "imperative-8",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Prenons les coussins !",
    "prompt": "Réécris la phrase en remplaçant « les coussins » par « les ». Garde tous les autres mots et le même type de phrase.\n\nPrenons les coussins !",
    "answer": "Prenons-les !",
    "wrong": "Les prenons !"
  },
  {
    "key": "imperative-9",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Prépare le ruban !",
    "prompt": "Réécris la phrase en remplaçant « le ruban » par « le ». Garde tous les autres mots et le même type de phrase.\n\nPrépare le ruban !",
    "answer": "Prépare-le !",
    "wrong": "Le prépare !"
  },
  {
    "key": "imperative-10",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Nettoyez les chaussures !",
    "prompt": "Réécris la phrase en remplaçant « les chaussures » par « les ». Garde tous les autres mots et le même type de phrase.\n\nNettoyez les chaussures !",
    "answer": "Nettoyez-les !",
    "wrong": "Les nettoyez !"
  },
  {
    "key": "imperative-11",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Déplace la chaise !",
    "prompt": "Réécris la phrase en remplaçant « la chaise » par « la ». Garde tous les autres mots et le même type de phrase.\n\nDéplace la chaise !",
    "answer": "Déplace-la !",
    "wrong": "La déplace !"
  },
  {
    "key": "imperative-12",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Lis le poème !",
    "prompt": "Réécris la phrase en remplaçant « le poème » par « le ». Garde tous les autres mots et le même type de phrase.\n\nLis le poème !",
    "answer": "Lis-le !",
    "wrong": "Le lis !"
  },
  {
    "key": "double-declarative-1",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Je donne le plan à Nora.",
    "prompt": "Réécris la phrase en remplaçant « le plan » par « le » et « à Nora » par « lui ». Garde les autres mots et le même type de phrase.\n\nJe donne le plan à Nora.",
    "answer": "Je le lui donne.",
    "wrong": "Je lui le donne."
  },
  {
    "key": "double-declarative-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Nous montrons les cartes aux visiteurs.",
    "prompt": "Réécris la phrase en remplaçant « les cartes » par « les » et « aux visiteurs » par « leur ». Garde les autres mots et le même type de phrase.\n\nNous montrons les cartes aux visiteurs.",
    "answer": "Nous les leur montrons.",
    "wrong": "Nous leur les montrons."
  },
  {
    "key": "double-declarative-3",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Tu prêtes la règle à ton voisin.",
    "prompt": "Réécris la phrase en remplaçant « la règle » par « la » et « à ton voisin » par « lui ». Garde les autres mots et le même type de phrase.\n\nTu prêtes la règle à ton voisin.",
    "answer": "Tu la lui prêtes.",
    "wrong": "Tu lui la prêtes."
  },
  {
    "key": "double-declarative-4",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Vous envoyez le message aux responsables.",
    "prompt": "Réécris la phrase en remplaçant « le message » par « le » et « aux responsables » par « leur ». Garde les autres mots et le même type de phrase.\n\nVous envoyez le message aux responsables.",
    "answer": "Vous le leur envoyez.",
    "wrong": "Vous leur le envoyez."
  },
  {
    "key": "double-declarative-5",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Elle remet les badges à son collègue.",
    "prompt": "Réécris la phrase en remplaçant « les badges » par « les » et « à son collègue » par « lui ». Garde les autres mots et le même type de phrase.\n\nElle remet les badges à son collègue.",
    "answer": "Elle les lui remet.",
    "wrong": "Elle lui les remet."
  },
  {
    "key": "double-declarative-6",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Ils présentent la maquette aux invités.",
    "prompt": "Réécris la phrase en remplaçant « la maquette » par « la » et « aux invités » par « leur ». Garde les autres mots et le même type de phrase.\n\nIls présentent la maquette aux invités.",
    "answer": "Ils la leur présentent.",
    "wrong": "Ils leur la présentent."
  },
  {
    "key": "double-declarative-7",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Je rends les clés à Léa.",
    "prompt": "Réécris la phrase en remplaçant « les clés » par « les » et « à Léa » par « lui ». Garde les autres mots et le même type de phrase.\n\nJe rends les clés à Léa.",
    "answer": "Je les lui rends.",
    "wrong": "Je lui les rends."
  },
  {
    "key": "double-declarative-8",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Nous apportons le panier aux amis.",
    "prompt": "Réécris la phrase en remplaçant « le panier » par « le » et « aux amis » par « leur ». Garde les autres mots et le même type de phrase.\n\nNous apportons le panier aux amis.",
    "answer": "Nous le leur apportons.",
    "wrong": "Nous leur le apportons."
  },
  {
    "key": "double-declarative-9",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Tu montres la photo à ton frère.",
    "prompt": "Réécris la phrase en remplaçant « la photo » par « la » et « à ton frère » par « lui ». Garde les autres mots et le même type de phrase.\n\nTu montres la photo à ton frère.",
    "answer": "Tu la lui montres.",
    "wrong": "Tu lui la montres."
  },
  {
    "key": "double-declarative-10",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Vous confiez les affiches aux bénévoles.",
    "prompt": "Réécris la phrase en remplaçant « les affiches » par « les » et « aux bénévoles » par « leur ». Garde les autres mots et le même type de phrase.\n\nVous confiez les affiches aux bénévoles.",
    "answer": "Vous les leur confiez.",
    "wrong": "Vous leur les confiez."
  },
  {
    "key": "double-declarative-11",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Elle propose le jeu à son cousin.",
    "prompt": "Réécris la phrase en remplaçant « le jeu » par « le » et « à son cousin » par « lui ». Garde les autres mots et le même type de phrase.\n\nElle propose le jeu à son cousin.",
    "answer": "Elle le lui propose.",
    "wrong": "Elle lui le propose."
  },
  {
    "key": "double-declarative-12",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Ils donnent la notice aux clients.",
    "prompt": "Réécris la phrase en remplaçant « la notice » par « la » et « aux clients » par « leur ». Garde les autres mots et le même type de phrase.\n\nIls donnent la notice aux clients.",
    "answer": "Ils la leur donnent.",
    "wrong": "Ils leur la donnent."
  },
  {
    "key": "double-negative-1",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Je ne donne pas le plan à Nora.",
    "prompt": "Réécris la phrase en remplaçant « le plan » par « le » et « à Nora » par « lui ». Garde les autres mots et le même type de phrase.\n\nJe ne donne pas le plan à Nora.",
    "answer": "Je ne le lui donne pas.",
    "wrong": "Je ne lui le donne pas."
  },
  {
    "key": "double-negative-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Nous ne montrons pas les cartes aux visiteurs.",
    "prompt": "Réécris la phrase en remplaçant « les cartes » par « les » et « aux visiteurs » par « leur ». Garde les autres mots et le même type de phrase.\n\nNous ne montrons pas les cartes aux visiteurs.",
    "answer": "Nous ne les leur montrons pas.",
    "wrong": "Nous ne leur les montrons pas."
  },
  {
    "key": "double-negative-3",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Tu ne prêtes pas la règle à ton voisin.",
    "prompt": "Réécris la phrase en remplaçant « la règle » par « la » et « à ton voisin » par « lui ». Garde les autres mots et le même type de phrase.\n\nTu ne prêtes pas la règle à ton voisin.",
    "answer": "Tu ne la lui prêtes pas.",
    "wrong": "Tu ne lui la prêtes pas."
  },
  {
    "key": "double-negative-4",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Vous ne envoyez pas le message aux responsables.",
    "prompt": "Réécris la phrase en remplaçant « le message » par « le » et « aux responsables » par « leur ». Garde les autres mots et le même type de phrase.\n\nVous ne envoyez pas le message aux responsables.",
    "answer": "Vous ne le leur envoyez pas.",
    "wrong": "Vous ne leur le envoyez pas."
  },
  {
    "key": "double-negative-5",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Elle ne remet pas les badges à son collègue.",
    "prompt": "Réécris la phrase en remplaçant « les badges » par « les » et « à son collègue » par « lui ». Garde les autres mots et le même type de phrase.\n\nElle ne remet pas les badges à son collègue.",
    "answer": "Elle ne les lui remet pas.",
    "wrong": "Elle ne lui les remet pas."
  },
  {
    "key": "double-negative-6",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Ils ne présentent pas la maquette aux invités.",
    "prompt": "Réécris la phrase en remplaçant « la maquette » par « la » et « aux invités » par « leur ». Garde les autres mots et le même type de phrase.\n\nIls ne présentent pas la maquette aux invités.",
    "answer": "Ils ne la leur présentent pas.",
    "wrong": "Ils ne leur la présentent pas."
  },
  {
    "key": "double-negative-7",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Je ne rends pas les clés à Léa.",
    "prompt": "Réécris la phrase en remplaçant « les clés » par « les » et « à Léa » par « lui ». Garde les autres mots et le même type de phrase.\n\nJe ne rends pas les clés à Léa.",
    "answer": "Je ne les lui rends pas.",
    "wrong": "Je ne lui les rends pas."
  },
  {
    "key": "double-negative-8",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Nous ne apportons pas le panier aux amis.",
    "prompt": "Réécris la phrase en remplaçant « le panier » par « le » et « aux amis » par « leur ». Garde les autres mots et le même type de phrase.\n\nNous ne apportons pas le panier aux amis.",
    "answer": "Nous ne le leur apportons pas.",
    "wrong": "Nous ne leur le apportons pas."
  },
  {
    "key": "double-negative-9",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Tu ne montres pas la photo à ton frère.",
    "prompt": "Réécris la phrase en remplaçant « la photo » par « la » et « à ton frère » par « lui ». Garde les autres mots et le même type de phrase.\n\nTu ne montres pas la photo à ton frère.",
    "answer": "Tu ne la lui montres pas.",
    "wrong": "Tu ne lui la montres pas."
  },
  {
    "key": "double-negative-10",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Vous ne confiez pas les affiches aux bénévoles.",
    "prompt": "Réécris la phrase en remplaçant « les affiches » par « les » et « aux bénévoles » par « leur ». Garde les autres mots et le même type de phrase.\n\nVous ne confiez pas les affiches aux bénévoles.",
    "answer": "Vous ne les leur confiez pas.",
    "wrong": "Vous ne leur les confiez pas."
  },
  {
    "key": "double-negative-11",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Elle ne propose pas le jeu à son cousin.",
    "prompt": "Réécris la phrase en remplaçant « le jeu » par « le » et « à son cousin » par « lui ». Garde les autres mots et le même type de phrase.\n\nElle ne propose pas le jeu à son cousin.",
    "answer": "Elle ne le lui propose pas.",
    "wrong": "Elle ne lui le propose pas."
  },
  {
    "key": "double-negative-12",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Ils ne donnent pas la notice aux clients.",
    "prompt": "Réécris la phrase en remplaçant « la notice » par « la » et « aux clients » par « leur ». Garde les autres mots et le même type de phrase.\n\nIls ne donnent pas la notice aux clients.",
    "answer": "Ils ne la leur donnent pas.",
    "wrong": "Ils ne leur la donnent pas."
  },
  {
    "key": "double-imperative-1",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Donne le plan à Nora !",
    "prompt": "Réécris la phrase en remplaçant « le plan » par « le » et « à Nora » par « lui ». Garde les autres mots et le même type de phrase.\n\nDonne le plan à Nora !",
    "answer": "Donne-le-lui !",
    "wrong": "Donne-lui-le !"
  },
  {
    "key": "double-imperative-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Montrons les cartes aux visiteurs !",
    "prompt": "Réécris la phrase en remplaçant « les cartes » par « les » et « aux visiteurs » par « leur ». Garde les autres mots et le même type de phrase.\n\nMontrons les cartes aux visiteurs !",
    "answer": "Montrons-les-leur !",
    "wrong": "Montrons-leur-les !"
  },
  {
    "key": "double-imperative-3",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Prête la règle à ton voisin !",
    "prompt": "Réécris la phrase en remplaçant « la règle » par « la » et « à ton voisin » par « lui ». Garde les autres mots et le même type de phrase.\n\nPrête la règle à ton voisin !",
    "answer": "Prête-la-lui !",
    "wrong": "Prête-lui-la !"
  },
  {
    "key": "double-imperative-4",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Envoyez le message aux responsables !",
    "prompt": "Réécris la phrase en remplaçant « le message » par « le » et « aux responsables » par « leur ». Garde les autres mots et le même type de phrase.\n\nEnvoyez le message aux responsables !",
    "answer": "Envoyez-le-leur !",
    "wrong": "Envoyez-leur-le !"
  },
  {
    "key": "double-imperative-5",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Remets les badges à son collègue !",
    "prompt": "Réécris la phrase en remplaçant « les badges » par « les » et « à son collègue » par « lui ». Garde les autres mots et le même type de phrase.\n\nRemets les badges à son collègue !",
    "answer": "Remets-les-lui !",
    "wrong": "Remets-lui-les !"
  },
  {
    "key": "double-imperative-6",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Présentez la maquette aux invités !",
    "prompt": "Réécris la phrase en remplaçant « la maquette » par « la » et « aux invités » par « leur ». Garde les autres mots et le même type de phrase.\n\nPrésentez la maquette aux invités !",
    "answer": "Présentez-la-leur !",
    "wrong": "Présentez-leur-la !"
  },
  {
    "key": "double-imperative-7",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Rends les clés à Léa !",
    "prompt": "Réécris la phrase en remplaçant « les clés » par « les » et « à Léa » par « lui ». Garde les autres mots et le même type de phrase.\n\nRends les clés à Léa !",
    "answer": "Rends-les-lui !",
    "wrong": "Rends-lui-les !"
  },
  {
    "key": "double-imperative-8",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Apportons le panier aux amis !",
    "prompt": "Réécris la phrase en remplaçant « le panier » par « le » et « aux amis » par « leur ». Garde les autres mots et le même type de phrase.\n\nApportons le panier aux amis !",
    "answer": "Apportons-le-leur !",
    "wrong": "Apportons-leur-le !"
  },
  {
    "key": "double-imperative-9",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Montre la photo à ton frère !",
    "prompt": "Réécris la phrase en remplaçant « la photo » par « la » et « à ton frère » par « lui ». Garde les autres mots et le même type de phrase.\n\nMontre la photo à ton frère !",
    "answer": "Montre-la-lui !",
    "wrong": "Montre-lui-la !"
  },
  {
    "key": "double-imperative-10",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Confiez les affiches aux bénévoles !",
    "prompt": "Réécris la phrase en remplaçant « les affiches » par « les » et « aux bénévoles » par « leur ». Garde les autres mots et le même type de phrase.\n\nConfiez les affiches aux bénévoles !",
    "answer": "Confiez-les-leur !",
    "wrong": "Confiez-leur-les !"
  },
  {
    "key": "double-imperative-11",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Propose le jeu à son cousin !",
    "prompt": "Réécris la phrase en remplaçant « le jeu » par « le » et « à son cousin » par « lui ». Garde les autres mots et le même type de phrase.\n\nPropose le jeu à son cousin !",
    "answer": "Propose-le-lui !",
    "wrong": "Propose-lui-le !"
  },
  {
    "key": "double-imperative-12",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Donnez la notice aux clients !",
    "prompt": "Réécris la phrase en remplaçant « la notice » par « la » et « aux clients » par « leur ». Garde les autres mots et le même type de phrase.\n\nDonnez la notice aux clients !",
    "answer": "Donnez-la-leur !",
    "wrong": "Donnez-leur-la !"
  },
  {
    "key": "double-declarative-personal-me",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Elle me prête le dictionnaire.",
    "prompt": "Réécris la phrase en remplaçant « le dictionnaire » par « le ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle me prête le dictionnaire.",
    "answer": "Elle me le prête.",
    "wrong": "Elle le me prête."
  },
  {
    "key": "double-negative-personal-me",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Elle ne me prête pas le dictionnaire.",
    "prompt": "Réécris la phrase en remplaçant « le dictionnaire » par « le ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle ne me prête pas le dictionnaire.",
    "answer": "Elle ne me le prête pas.",
    "wrong": "Elle ne le me prête pas."
  },
  {
    "key": "double-imperative-personal-me",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Prête-moi le dictionnaire !",
    "prompt": "Réécris la phrase en remplaçant « le dictionnaire » par « le ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nPrête-moi le dictionnaire !",
    "answer": "Prête-le-moi !",
    "wrong": "Prête-moi-le !"
  },
  {
    "key": "double-declarative-personal-me-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Il me montre la médaille.",
    "prompt": "Réécris la phrase en remplaçant « la médaille » par « la ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl me montre la médaille.",
    "answer": "Il me la montre.",
    "wrong": "Il la me montre."
  },
  {
    "key": "double-negative-personal-me-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Il ne me montre pas la médaille.",
    "prompt": "Réécris la phrase en remplaçant « la médaille » par « la ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl ne me montre pas la médaille.",
    "answer": "Il ne me la montre pas.",
    "wrong": "Il ne la me montre pas."
  },
  {
    "key": "double-imperative-personal-me-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Montre-moi la médaille !",
    "prompt": "Réécris la phrase en remplaçant « la médaille » par « la ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nMontre-moi la médaille !",
    "answer": "Montre-la-moi !",
    "wrong": "Montre-moi-la !"
  },
  {
    "key": "double-declarative-personal-te",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Elle te remet le formulaire.",
    "prompt": "Réécris la phrase en remplaçant « le formulaire » par « le ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle te remet le formulaire.",
    "answer": "Elle te le remet.",
    "wrong": "Elle le te remet."
  },
  {
    "key": "double-negative-personal-te",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Elle ne te remet pas le formulaire.",
    "prompt": "Réécris la phrase en remplaçant « le formulaire » par « le ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle ne te remet pas le formulaire.",
    "answer": "Elle ne te le remet pas.",
    "wrong": "Elle ne le te remet pas."
  },
  {
    "key": "double-imperative-personal-te",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Garde-toi le formulaire !",
    "prompt": "Réécris la phrase en remplaçant « le formulaire » par « le ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nGarde-toi le formulaire !",
    "answer": "Garde-le-toi !",
    "wrong": "Garde-toi-le !"
  },
  {
    "key": "double-declarative-personal-te-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Il te présente les échantillons.",
    "prompt": "Réécris la phrase en remplaçant « les échantillons » par « les ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl te présente les échantillons.",
    "answer": "Il te les présente.",
    "wrong": "Il les te présente."
  },
  {
    "key": "double-negative-personal-te-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Il ne te présente pas les échantillons.",
    "prompt": "Réécris la phrase en remplaçant « les échantillons » par « les ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl ne te présente pas les échantillons.",
    "answer": "Il ne te les présente pas.",
    "wrong": "Il ne les te présente pas."
  },
  {
    "key": "double-imperative-personal-te-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Garde-toi les échantillons !",
    "prompt": "Réécris la phrase en remplaçant « les échantillons » par « les ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nGarde-toi les échantillons !",
    "answer": "Garde-les-toi !",
    "wrong": "Garde-toi-les !"
  },
  {
    "key": "double-declarative-personal-nous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Elle nous réserve la cabine.",
    "prompt": "Réécris la phrase en remplaçant « la cabine » par « la ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle nous réserve la cabine.",
    "answer": "Elle nous la réserve.",
    "wrong": "Elle la nous réserve."
  },
  {
    "key": "double-negative-personal-nous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Elle ne nous réserve pas la cabine.",
    "prompt": "Réécris la phrase en remplaçant « la cabine » par « la ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle ne nous réserve pas la cabine.",
    "answer": "Elle ne nous la réserve pas.",
    "wrong": "Elle ne la nous réserve pas."
  },
  {
    "key": "double-imperative-personal-nous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Réserve-nous la cabine !",
    "prompt": "Réécris la phrase en remplaçant « la cabine » par « la ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nRéserve-nous la cabine !",
    "answer": "Réserve-la-nous !",
    "wrong": "Réserve-nous-la !"
  },
  {
    "key": "double-declarative-personal-nous-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Il nous apporte les vestes.",
    "prompt": "Réécris la phrase en remplaçant « les vestes » par « les ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl nous apporte les vestes.",
    "answer": "Il nous les apporte.",
    "wrong": "Il les nous apporte."
  },
  {
    "key": "double-negative-personal-nous-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Il ne nous apporte pas les vestes.",
    "prompt": "Réécris la phrase en remplaçant « les vestes » par « les ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl ne nous apporte pas les vestes.",
    "answer": "Il ne nous les apporte pas.",
    "wrong": "Il ne les nous apporte pas."
  },
  {
    "key": "double-imperative-personal-nous-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Apporte-nous les vestes !",
    "prompt": "Réécris la phrase en remplaçant « les vestes » par « les ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nApporte-nous les vestes !",
    "answer": "Apporte-les-nous !",
    "wrong": "Apporte-nous-les !"
  },
  {
    "key": "double-declarative-personal-vous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Elle vous confie le paquet.",
    "prompt": "Réécris la phrase en remplaçant « le paquet » par « le ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle vous confie le paquet.",
    "answer": "Elle vous le confie.",
    "wrong": "Elle le vous confie."
  },
  {
    "key": "double-negative-personal-vous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Elle ne vous confie pas le paquet.",
    "prompt": "Réécris la phrase en remplaçant « le paquet » par « le ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle ne vous confie pas le paquet.",
    "answer": "Elle ne vous le confie pas.",
    "wrong": "Elle ne le vous confie pas."
  },
  {
    "key": "double-imperative-personal-vous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Gardez-vous le paquet !",
    "prompt": "Réécris la phrase en remplaçant « le paquet » par « le ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nGardez-vous le paquet !",
    "answer": "Gardez-le-vous !",
    "wrong": "Gardez-vous-le !"
  },
  {
    "key": "double-declarative-personal-vous-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Il vous rend les lunettes.",
    "prompt": "Réécris la phrase en remplaçant « les lunettes » par « les ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl vous rend les lunettes.",
    "answer": "Il vous les rend.",
    "wrong": "Il les vous rend."
  },
  {
    "key": "double-negative-personal-vous-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Il ne vous rend pas les lunettes.",
    "prompt": "Réécris la phrase en remplaçant « les lunettes » par « les ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl ne vous rend pas les lunettes.",
    "answer": "Il ne vous les rend pas.",
    "wrong": "Il ne les vous rend pas."
  },
  {
    "key": "double-imperative-personal-vous-2",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Prêtez-vous les lunettes !",
    "prompt": "Réécris la phrase en remplaçant « les lunettes » par « les ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nPrêtez-vous les lunettes !",
    "answer": "Prêtez-les-vous !",
    "wrong": "Prêtez-vous-les !"
  },
  {
    "key": "double-declarative-en-me",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Elle me donne du riz.",
    "prompt": "Réécris la phrase en remplaçant « du riz » par « en ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle me donne du riz.",
    "answer": "Elle m’en donne.",
    "wrong": "Elle en me donne."
  },
  {
    "key": "double-negative-en-me",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Elle ne me donne pas de riz.",
    "prompt": "Réécris la phrase en remplaçant « de riz » par « en ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle ne me donne pas de riz.",
    "answer": "Elle ne m’en donne pas.",
    "wrong": "Elle ne en me donne pas."
  },
  {
    "key": "double-imperative-en-me",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Donne-moi du riz !",
    "prompt": "Réécris la phrase en remplaçant « du riz » par « en ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nDonne-moi du riz !",
    "answer": "Donne-m’en !",
    "wrong": "Donne-moi-en !"
  },
  {
    "key": "double-declarative-en-te",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Il te propose des biscuits.",
    "prompt": "Réécris la phrase en remplaçant « des biscuits » par « en ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl te propose des biscuits.",
    "answer": "Il t’en propose.",
    "wrong": "Il en te propose."
  },
  {
    "key": "double-negative-en-te",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Il ne te propose pas de biscuits.",
    "prompt": "Réécris la phrase en remplaçant « de biscuits » par « en ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl ne te propose pas de biscuits.",
    "answer": "Il ne t’en propose pas.",
    "wrong": "Il ne en te propose pas."
  },
  {
    "key": "double-imperative-en-te",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Prends-toi des biscuits !",
    "prompt": "Réécris la phrase en remplaçant « des biscuits » par « en ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nPrends-toi des biscuits !",
    "answer": "Prends-t’en !",
    "wrong": "Prends-toi-en !"
  },
  {
    "key": "double-declarative-en-nous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Elle nous sert de la tisane.",
    "prompt": "Réécris la phrase en remplaçant « de la tisane » par « en ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle nous sert de la tisane.",
    "answer": "Elle nous en sert.",
    "wrong": "Elle en nous sert."
  },
  {
    "key": "double-negative-en-nous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Elle ne nous sert pas de tisane.",
    "prompt": "Réécris la phrase en remplaçant « de tisane » par « en ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle ne nous sert pas de tisane.",
    "answer": "Elle ne nous en sert pas.",
    "wrong": "Elle ne en nous sert pas."
  },
  {
    "key": "double-imperative-en-nous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Verse-nous de la tisane !",
    "prompt": "Réécris la phrase en remplaçant « de la tisane » par « en ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nVerse-nous de la tisane !",
    "answer": "Verse-nous-en !",
    "wrong": "Verse-en-nous !"
  },
  {
    "key": "double-declarative-en-leur",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Il leur prête des ciseaux.",
    "prompt": "Réécris la phrase en remplaçant « des ciseaux » par « en ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl leur prête des ciseaux.",
    "answer": "Il leur en prête.",
    "wrong": "Il en leur prête."
  },
  {
    "key": "double-negative-en-leur",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Il ne leur prête pas de ciseaux.",
    "prompt": "Réécris la phrase en remplaçant « de ciseaux » par « en ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl ne leur prête pas de ciseaux.",
    "answer": "Il ne leur en prête pas.",
    "wrong": "Il ne en leur prête pas."
  },
  {
    "key": "double-imperative-en-leur",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Prête-leur des ciseaux !",
    "prompt": "Réécris la phrase en remplaçant « des ciseaux » par « en ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nPrête-leur des ciseaux !",
    "answer": "Prête-leur-en !",
    "wrong": "Prête-en-leur !"
  },
  {
    "key": "double-declarative-y-me",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Elle me conduit au gymnase.",
    "prompt": "Réécris la phrase en remplaçant « au gymnase » par « y ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle me conduit au gymnase.",
    "answer": "Elle m’y conduit.",
    "wrong": "Elle y me conduit."
  },
  {
    "key": "double-negative-y-me",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Elle ne me conduit pas au gymnase.",
    "prompt": "Réécris la phrase en remplaçant « au gymnase » par « y ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle ne me conduit pas au gymnase.",
    "answer": "Elle ne m’y conduit pas.",
    "wrong": "Elle ne y me conduit pas."
  },
  {
    "key": "double-imperative-y-me",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Conduis-moi au gymnase !",
    "prompt": "Réécris la phrase en remplaçant « au gymnase » par « y ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nConduis-moi au gymnase !",
    "answer": "Conduis-m’y !",
    "wrong": "Conduis-moi-y !"
  },
  {
    "key": "double-declarative-y-te",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Il te rejoint au belvédère.",
    "prompt": "Réécris la phrase en remplaçant « au belvédère » par « y ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl te rejoint au belvédère.",
    "answer": "Il t’y rejoint.",
    "wrong": "Il y te rejoint."
  },
  {
    "key": "double-negative-y-te",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Il ne te rejoint pas au belvédère.",
    "prompt": "Réécris la phrase en remplaçant « au belvédère » par « y ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl ne te rejoint pas au belvédère.",
    "answer": "Il ne t’y rejoint pas.",
    "wrong": "Il ne y te rejoint pas."
  },
  {
    "key": "double-imperative-y-te",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Installe-toi au belvédère !",
    "prompt": "Réécris la phrase en remplaçant « au belvédère » par « y ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nInstalle-toi au belvédère !",
    "answer": "Installe-t’y !",
    "wrong": "Installe-toi-y !"
  },
  {
    "key": "double-declarative-y-nous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Elle nous accompagne au jardin botanique.",
    "prompt": "Réécris la phrase en remplaçant « au jardin botanique » par « y ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle nous accompagne au jardin botanique.",
    "answer": "Elle nous y accompagne.",
    "wrong": "Elle y nous accompagne."
  },
  {
    "key": "double-negative-y-nous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Elle ne nous accompagne pas au jardin botanique.",
    "prompt": "Réécris la phrase en remplaçant « au jardin botanique » par « y ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nElle ne nous accompagne pas au jardin botanique.",
    "answer": "Elle ne nous y accompagne pas.",
    "wrong": "Elle ne y nous accompagne pas."
  },
  {
    "key": "double-imperative-y-nous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Accompagne-nous au jardin botanique !",
    "prompt": "Réécris la phrase en remplaçant « au jardin botanique » par « y ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nAccompagne-nous au jardin botanique !",
    "answer": "Accompagne-nous-y !",
    "wrong": "Accompagne-y-nous !"
  },
  {
    "key": "double-declarative-y-vous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "declarative",
    "source": "Il vous attend au kiosque.",
    "prompt": "Réécris la phrase en remplaçant « au kiosque » par « y ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl vous attend au kiosque.",
    "answer": "Il vous y attend.",
    "wrong": "Il y vous attend."
  },
  {
    "key": "double-negative-y-vous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "negative",
    "source": "Il ne vous attend pas au kiosque.",
    "prompt": "Réécris la phrase en remplaçant « au kiosque » par « y ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nIl ne vous attend pas au kiosque.",
    "answer": "Il ne vous y attend pas.",
    "wrong": "Il ne y vous attend pas."
  },
  {
    "key": "double-imperative-y-vous",
    "nodeKey": "ordonner_doubles_pronoms",
    "construction": "imperative",
    "source": "Installez-vous au kiosque !",
    "prompt": "Réécris la phrase en remplaçant « au kiosque » par « y ». Conserve l’autre pronom et les autres mots. Garde le même type de phrase.\n\nInstallez-vous au kiosque !",
    "answer": "Installez-vous-y !",
    "wrong": "Installez-y-vous !"
  },
  {
    "key": "finite-reserve-1",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Nora dessine la fontaine.",
    "prompt": "Réécris la phrase en remplaçant « la fontaine » par « la ». Garde tous les autres mots et le même type de phrase.\n\nNora dessine la fontaine.",
    "answer": "Nora la dessine.",
    "wrong": "Nora dessine la."
  },
  {
    "key": "finite-reserve-2",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Nous lavons les nappes.",
    "prompt": "Réécris la phrase en remplaçant « les nappes » par « les ». Garde tous les autres mots et le même type de phrase.\n\nNous lavons les nappes.",
    "answer": "Nous les lavons.",
    "wrong": "Nous lavons les."
  },
  {
    "key": "finite-reserve-3",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Tu ramasses le bouchon.",
    "prompt": "Réécris la phrase en remplaçant « le bouchon » par « le ». Garde tous les autres mots et le même type de phrase.\n\nTu ramasses le bouchon.",
    "answer": "Tu le ramasses.",
    "wrong": "Tu ramasses le."
  },
  {
    "key": "finite-reserve-4",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Elle compare les offres.",
    "prompt": "Réécris la phrase en remplaçant « les offres » par « les ». Garde tous les autres mots et le même type de phrase.\n\nElle compare les offres.",
    "answer": "Elle les compare.",
    "wrong": "Elle compare les."
  },
  {
    "key": "finite-reserve-5",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Vous réservez la salle.",
    "prompt": "Réécris la phrase en remplaçant « la salle » par « la ». Garde tous les autres mots et le même type de phrase.\n\nVous réservez la salle.",
    "answer": "Vous la réservez.",
    "wrong": "Vous réservez la."
  },
  {
    "key": "finite-reserve-6",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Les campeurs montent le tipi.",
    "prompt": "Réécris la phrase en remplaçant « le tipi » par « le ». Garde tous les autres mots et le même type de phrase.\n\nLes campeurs montent le tipi.",
    "answer": "Les campeurs le montent.",
    "wrong": "Les campeurs montent le."
  },
  {
    "key": "finite-reserve-7",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Je classe les timbres.",
    "prompt": "Réécris la phrase en remplaçant « les timbres » par « les ». Garde tous les autres mots et le même type de phrase.\n\nJe classe les timbres.",
    "answer": "Je les classe.",
    "wrong": "Je classe les."
  },
  {
    "key": "finite-reserve-8",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Le libraire conseille le guide.",
    "prompt": "Réécris la phrase en remplaçant « le guide » par « le ». Garde tous les autres mots et le même type de phrase.\n\nLe libraire conseille le guide.",
    "answer": "Le libraire le conseille.",
    "wrong": "Le libraire conseille le."
  },
  {
    "key": "finite-reserve-9",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Ils traversent la rivière.",
    "prompt": "Réécris la phrase en remplaçant « la rivière » par « la ». Garde tous les autres mots et le même type de phrase.\n\nIls traversent la rivière.",
    "answer": "Ils la traversent.",
    "wrong": "Ils traversent la."
  },
  {
    "key": "finite-reserve-10",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Nous goûtons la confiture.",
    "prompt": "Réécris la phrase en remplaçant « la confiture » par « la ». Garde tous les autres mots et le même type de phrase.\n\nNous goûtons la confiture.",
    "answer": "Nous la goûtons.",
    "wrong": "Nous goûtons la."
  },
  {
    "key": "finite-reserve-11",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Tu comptes les pièces.",
    "prompt": "Réécris la phrase en remplaçant « les pièces » par « les ». Garde tous les autres mots et le même type de phrase.\n\nTu comptes les pièces.",
    "answer": "Tu les comptes.",
    "wrong": "Tu comptes les."
  },
  {
    "key": "finite-reserve-12",
    "nodeKey": "placer_pronom_complement",
    "construction": "finite",
    "source": "Elle décrit le paysage.",
    "prompt": "Réécris la phrase en remplaçant « le paysage » par « le ». Garde tous les autres mots et le même type de phrase.\n\nElle décrit le paysage.",
    "answer": "Elle le décrit.",
    "wrong": "Elle décrit le."
  },
  {
    "key": "infinitive-reserve-1",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Je peux saisir le code.",
    "prompt": "Réécris la phrase en remplaçant « le code » par « le ». Garde tous les autres mots et le même type de phrase.\n\nJe peux saisir le code.",
    "answer": "Je peux le saisir.",
    "wrong": "Je peux saisir le."
  },
  {
    "key": "infinitive-reserve-2",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Nous allons composer la mélodie.",
    "prompt": "Réécris la phrase en remplaçant « la mélodie » par « la ». Garde tous les autres mots et le même type de phrase.\n\nNous allons composer la mélodie.",
    "answer": "Nous allons la composer.",
    "wrong": "Nous allons composer la."
  },
  {
    "key": "infinitive-reserve-3",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Tu veux coudre les boutons.",
    "prompt": "Réécris la phrase en remplaçant « les boutons » par « les ». Garde tous les autres mots et le même type de phrase.\n\nTu veux coudre les boutons.",
    "answer": "Tu veux les coudre.",
    "wrong": "Tu veux coudre les."
  },
  {
    "key": "infinitive-reserve-4",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Elle essaie de suivre le cortège.",
    "prompt": "Réécris la phrase en remplaçant « le cortège » par « le ». Garde tous les autres mots et le même type de phrase.\n\nElle essaie de suivre le cortège.",
    "answer": "Elle essaie de le suivre.",
    "wrong": "Elle essaie de suivre le."
  },
  {
    "key": "infinitive-reserve-5",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Vous souhaitez relire la convention.",
    "prompt": "Réécris la phrase en remplaçant « la convention » par « la ». Garde tous les autres mots et le même type de phrase.\n\nVous souhaitez relire la convention.",
    "answer": "Vous souhaitez la relire.",
    "wrong": "Vous souhaitez relire la."
  },
  {
    "key": "infinitive-reserve-6",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Ils peuvent trier les graines.",
    "prompt": "Réécris la phrase en remplaçant « les graines » par « les ». Garde tous les autres mots et le même type de phrase.\n\nIls peuvent trier les graines.",
    "answer": "Ils peuvent les trier.",
    "wrong": "Ils peuvent trier les."
  },
  {
    "key": "infinitive-reserve-7",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Nous voulons tester le robot.",
    "prompt": "Réécris la phrase en remplaçant « le robot » par « le ». Garde tous les autres mots et le même type de phrase.\n\nNous voulons tester le robot.",
    "answer": "Nous voulons le tester.",
    "wrong": "Nous voulons tester le."
  },
  {
    "key": "infinitive-reserve-8",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Je vais transporter la valise.",
    "prompt": "Réécris la phrase en remplaçant « la valise » par « la ». Garde tous les autres mots et le même type de phrase.\n\nJe vais transporter la valise.",
    "answer": "Je vais la transporter.",
    "wrong": "Je vais transporter la."
  },
  {
    "key": "infinitive-reserve-9",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Tu peux mesurer les planches.",
    "prompt": "Réécris la phrase en remplaçant « les planches » par « les ». Garde tous les autres mots et le même type de phrase.\n\nTu peux mesurer les planches.",
    "answer": "Tu peux les mesurer.",
    "wrong": "Tu peux mesurer les."
  },
  {
    "key": "infinitive-reserve-10",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Elle veut rejoindre le cortège de danseurs.",
    "prompt": "Réécris la phrase en remplaçant « le cortège de danseurs » par « le ». Garde tous les autres mots et le même type de phrase.\n\nElle veut rejoindre le cortège de danseurs.",
    "answer": "Elle veut le rejoindre.",
    "wrong": "Elle veut rejoindre le."
  },
  {
    "key": "infinitive-reserve-11",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Vous essayez de dessiner la péniche.",
    "prompt": "Réécris la phrase en remplaçant « la péniche » par « la ». Garde tous les autres mots et le même type de phrase.\n\nVous essayez de dessiner la péniche.",
    "answer": "Vous essayez de la dessiner.",
    "wrong": "Vous essayez de dessiner la."
  },
  {
    "key": "infinitive-reserve-12",
    "nodeKey": "placer_pronom_complement",
    "construction": "infinitive",
    "source": "Ils vont fixer les étagères.",
    "prompt": "Réécris la phrase en remplaçant « les étagères » par « les ». Garde tous les autres mots et le même type de phrase.\n\nIls vont fixer les étagères.",
    "answer": "Ils vont les fixer.",
    "wrong": "Ils vont fixer les."
  },
  {
    "key": "negative-reserve-1",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Je ne vends pas les bougies.",
    "prompt": "Réécris la phrase en remplaçant « les bougies » par « les ». Garde tous les autres mots et le même type de phrase.\n\nJe ne vends pas les bougies.",
    "answer": "Je ne les vends pas.",
    "wrong": "Je ne vends pas les."
  },
  {
    "key": "negative-reserve-2",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Nous ne changeons pas le menu.",
    "prompt": "Réécris la phrase en remplaçant « le menu » par « le ». Garde tous les autres mots et le même type de phrase.\n\nNous ne changeons pas le menu.",
    "answer": "Nous ne le changeons pas.",
    "wrong": "Nous ne changeons pas le."
  },
  {
    "key": "negative-reserve-3",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Tu ne prends pas la luge.",
    "prompt": "Réécris la phrase en remplaçant « la luge » par « la ». Garde tous les autres mots et le même type de phrase.\n\nTu ne prends pas la luge.",
    "answer": "Tu ne la prends pas.",
    "wrong": "Tu ne prends pas la."
  },
  {
    "key": "negative-reserve-4",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Elle ne regarde pas les nuages.",
    "prompt": "Réécris la phrase en remplaçant « les nuages » par « les ». Garde tous les autres mots et le même type de phrase.\n\nElle ne regarde pas les nuages.",
    "answer": "Elle ne les regarde pas.",
    "wrong": "Elle ne regarde pas les."
  },
  {
    "key": "negative-reserve-5",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Vous ne dépliez pas le parasol.",
    "prompt": "Réécris la phrase en remplaçant « le parasol » par « le ». Garde tous les autres mots et le même type de phrase.\n\nVous ne dépliez pas le parasol.",
    "answer": "Vous ne le dépliez pas.",
    "wrong": "Vous ne dépliez pas le."
  },
  {
    "key": "negative-reserve-6",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Ils ne consultent pas la brochure.",
    "prompt": "Réécris la phrase en remplaçant « la brochure » par « la ». Garde tous les autres mots et le même type de phrase.\n\nIls ne consultent pas la brochure.",
    "answer": "Ils ne la consultent pas.",
    "wrong": "Ils ne consultent pas la."
  },
  {
    "key": "negative-reserve-7",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Nina ne jette pas les cartons.",
    "prompt": "Réécris la phrase en remplaçant « les cartons » par « les ». Garde tous les autres mots et le même type de phrase.\n\nNina ne jette pas les cartons.",
    "answer": "Nina ne les jette pas.",
    "wrong": "Nina ne jette pas les."
  },
  {
    "key": "negative-reserve-8",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Nous ne visitons pas le moulin.",
    "prompt": "Réécris la phrase en remplaçant « le moulin » par « le ». Garde tous les autres mots et le même type de phrase.\n\nNous ne visitons pas le moulin.",
    "answer": "Nous ne le visitons pas.",
    "wrong": "Nous ne visitons pas le."
  },
  {
    "key": "negative-reserve-9",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Tu ne manges pas la poire.",
    "prompt": "Réécris la phrase en remplaçant « la poire » par « la ». Garde tous les autres mots et le même type de phrase.\n\nTu ne manges pas la poire.",
    "answer": "Tu ne la manges pas.",
    "wrong": "Tu ne manges pas la."
  },
  {
    "key": "negative-reserve-10",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Les élèves ne copient pas les définitions.",
    "prompt": "Réécris la phrase en remplaçant « les définitions » par « les ». Garde tous les autres mots et le même type de phrase.\n\nLes élèves ne copient pas les définitions.",
    "answer": "Les élèves ne les copient pas.",
    "wrong": "Les élèves ne copient pas les."
  },
  {
    "key": "negative-reserve-11",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Je ne déplace pas le tapis.",
    "prompt": "Réécris la phrase en remplaçant « le tapis » par « le ». Garde tous les autres mots et le même type de phrase.\n\nJe ne déplace pas le tapis.",
    "answer": "Je ne le déplace pas.",
    "wrong": "Je ne déplace pas le."
  },
  {
    "key": "negative-reserve-12",
    "nodeKey": "placer_pronom_complement",
    "construction": "negative",
    "source": "Vous ne lavez pas la gourde.",
    "prompt": "Réécris la phrase en remplaçant « la gourde » par « la ». Garde tous les autres mots et le même type de phrase.\n\nVous ne lavez pas la gourde.",
    "answer": "Vous ne la lavez pas.",
    "wrong": "Vous ne lavez pas la."
  },
  {
    "key": "imperative-reserve-1",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Ramasse les branches !",
    "prompt": "Réécris la phrase en remplaçant « les branches » par « les ». Garde tous les autres mots et le même type de phrase.\n\nRamasse les branches !",
    "answer": "Ramasse-les !",
    "wrong": "Les ramasse !"
  },
  {
    "key": "imperative-reserve-2",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Lisez la consigne !",
    "prompt": "Réécris la phrase en remplaçant « la consigne » par « la ». Garde tous les autres mots et le même type de phrase.\n\nLisez la consigne !",
    "answer": "Lisez-la !",
    "wrong": "La lisez !"
  },
  {
    "key": "imperative-reserve-3",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Choisis le costume !",
    "prompt": "Réécris la phrase en remplaçant « le costume » par « le ». Garde tous les autres mots et le même type de phrase.\n\nChoisis le costume !",
    "answer": "Choisis-le !",
    "wrong": "Le choisis !"
  },
  {
    "key": "imperative-reserve-4",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Portons les caisses !",
    "prompt": "Réécris la phrase en remplaçant « les caisses » par « les ». Garde tous les autres mots et le même type de phrase.\n\nPortons les caisses !",
    "answer": "Portons-les !",
    "wrong": "Les portons !"
  },
  {
    "key": "imperative-reserve-5",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Vérifiez la mesure !",
    "prompt": "Réécris la phrase en remplaçant « la mesure » par « la ». Garde tous les autres mots et le même type de phrase.\n\nVérifiez la mesure !",
    "answer": "Vérifiez-la !",
    "wrong": "La vérifiez !"
  },
  {
    "key": "imperative-reserve-6",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Tourne le bouton !",
    "prompt": "Réécris la phrase en remplaçant « le bouton » par « le ». Garde tous les autres mots et le même type de phrase.\n\nTourne le bouton !",
    "answer": "Tourne-le !",
    "wrong": "Le tourne !"
  },
  {
    "key": "imperative-reserve-7",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Ouvrez les rideaux !",
    "prompt": "Réécris la phrase en remplaçant « les rideaux » par « les ». Garde tous les autres mots et le même type de phrase.\n\nOuvrez les rideaux !",
    "answer": "Ouvrez-les !",
    "wrong": "Les ouvrez !"
  },
  {
    "key": "imperative-reserve-8",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Gardons le reçu !",
    "prompt": "Réécris la phrase en remplaçant « le reçu » par « le ». Garde tous les autres mots et le même type de phrase.\n\nGardons le reçu !",
    "answer": "Gardons-le !",
    "wrong": "Le gardons !"
  },
  {
    "key": "imperative-reserve-9",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Plante la tulipe !",
    "prompt": "Réécris la phrase en remplaçant « la tulipe » par « la ». Garde tous les autres mots et le même type de phrase.\n\nPlante la tulipe !",
    "answer": "Plante-la !",
    "wrong": "La plante !"
  },
  {
    "key": "imperative-reserve-10",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Classez les dossiers !",
    "prompt": "Réécris la phrase en remplaçant « les dossiers » par « les ». Garde tous les autres mots et le même type de phrase.\n\nClassez les dossiers !",
    "answer": "Classez-les !",
    "wrong": "Les classez !"
  },
  {
    "key": "imperative-reserve-11",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Décris le décor !",
    "prompt": "Réécris la phrase en remplaçant « le décor » par « le ». Garde tous les autres mots et le même type de phrase.\n\nDécris le décor !",
    "answer": "Décris-le !",
    "wrong": "Le décris !"
  },
  {
    "key": "imperative-reserve-12",
    "nodeKey": "placer_pronom_complement",
    "construction": "imperative",
    "source": "Referme la trappe !",
    "prompt": "Réécris la phrase en remplaçant « la trappe » par « la ». Garde tous les autres mots et le même type de phrase.\n\nReferme la trappe !",
    "answer": "Referme-la !",
    "wrong": "La referme !"
  }
] as const;

export const DOUBLE_PRONOUN_ORDER_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:double-pronoun-order:declarative",
    "nodeKey": "ordonner_doubles_pronoms",
    "facetKey": "ordonner_doubles_pronoms::construction:declarative",
    "mode": "production",
    "status": "draft_requires_review",
    "titleFr": "Choisir l’ordre de deux pronoms devant le verbe",
    "learnerQuestionFr": "Comment placer deux pronoms sans changer le sens de ma phrase ?",
    "steps": [
      {
        "exampleFr": "Je donne la fiche à Zoé. → Je la lui donne.",
        "explanationFr": "La reprend la fiche ; lui reprend à Zoé. Dans cette combinaison, le pronom direct la se place avant lui, tous deux avant donne."
      },
      {
        "exampleFr": "Nous envoyons les résultats aux équipes. → Nous les leur envoyons.",
        "explanationFr": "Les reprend les résultats ; leur reprend aux équipes. L’ordre est les, puis leur, puis le verbe."
      },
      {
        "exampleFr": "Tu me donnes le carnet. → Tu me le donnes.",
        "explanationFr": "Attention : avec me, te, se, nous ou vous, l’ordre est différent. Ici, me précède le. La leçon et ses premiers exercices ciblent le, la ou les avec lui ou leur."
      },
      {
        "exampleFr": "Il me raconte cette aventure. → Il me la raconte.",
        "explanationFr": "Me, te, se, nous ou vous précèdent ici le, la ou les. Avec lui ou leur, l’ordre est différent : il la lui raconte."
      },
      {
        "exampleFr": "Elle me rapporte des nouvelles. → Elle m’en rapporte.",
        "explanationFr": "En suit ici me, qui devient m’ devant la voyelle. Avec nous, on garde les deux mots : elle nous en rapporte."
      },
      {
        "exampleFr": "Il nous attend dans le vestibule. → Il nous y attend.",
        "explanationFr": "Y reprend le lieu et suit nous. Avec me ou te, on écrit m’y ou t’y."
      }
    ],
    "takeawayFr": "Avant le verbe, me/te/nous/vous précèdent le/la/les ; le/la/les précèdent lui/leur. En et y suivent les autres pronoms dans les combinaisons étudiées.",
    "boundaryFr": "L’ordre dépend des pronoms, du verbe et de la forme affirmative ou négative. Les pronoms qui complètent un infinitif restent attachés à cet infinitif ; ils ne se déplacent pas automatiquement avec le verbe conjugué.",
    "practice": [
      {
        "id": "double-pronoun-order-guided:declarative:0",
        "promptFr": "Réécris la phrase en remplaçant « la liste » par « la » et « à Malik » par « lui ». Garde les autres mots et le même type de phrase.\n\nJe donne la liste à Malik.",
        "answerFr": "Je la lui donne.",
        "hintFr": "Place le, la ou les avant lui ou leur, devant le verbe.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Je la lui donne."
      },
      {
        "id": "double-pronoun-order-guided:declarative:1",
        "promptFr": "Réécris la phrase en remplaçant « le dossier » par « le » et « aux employés » par « leur ». Garde les autres mots et le même type de phrase.\n\nNous rendons le dossier aux employés.",
        "answerFr": "Nous le leur rendons.",
        "hintFr": "Place le, la ou les avant lui ou leur, devant le verbe.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Nous le leur rendons."
      },
      {
        "id": "double-pronoun-order-guided:declarative:2",
        "promptFr": "Réécris la phrase en remplaçant « les croquis » par « les » et « à ta sœur » par « lui ». Garde les autres mots et le même type de phrase.\n\nTu montres les croquis à ta sœur.",
        "answerFr": "Tu les lui montres.",
        "hintFr": "Place le, la ou les avant lui ou leur, devant le verbe.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Tu les lui montres."
      },
      {
        "id": "double-pronoun-order-guided:declarative:3",
        "promptFr": "Réécris la phrase en remplaçant « la lampe » par « la » et « aux campeurs » par « leur ». Garde les autres mots et le même type de phrase.\n\nVous prêtez la lampe aux campeurs.",
        "answerFr": "Vous la leur prêtez.",
        "hintFr": "Place le, la ou les avant lui ou leur, devant le verbe.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Vous la leur prêtez."
      },
      {
        "id": "double-pronoun-order-guided:declarative:4",
        "promptFr": "Réécris la phrase en remplaçant « le colis » par « le » et « à la gardienne » par « lui ». Garde les autres mots et le même type de phrase.\n\nElle confie le colis à la gardienne.",
        "answerFr": "Elle le lui confie.",
        "hintFr": "Place le, la ou les avant lui ou leur, devant le verbe.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Elle le lui confie."
      },
      {
        "id": "double-pronoun-order-guided:declarative:5",
        "promptFr": "Réécris la phrase en remplaçant « les invitations » par « les » et « aux familles » par « leur ». Garde les autres mots et le même type de phrase.\n\nIls envoient les invitations aux familles.",
        "answerFr": "Ils les leur envoient.",
        "hintFr": "Place le, la ou les avant lui ou leur, devant le verbe.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Ils les leur envoient."
      },
      {
        "id": "double-pronoun-order-guided:declarative:extra-0",
        "promptFr": "Réécris « Elle vous montre le vitrail. » en remplaçant « le vitrail » par « le ». Garde l’autre pronom.",
        "answerFr": "Elle vous le montre.",
        "hintFr": "Vérifie la place des deux pronoms et les élisions nécessaires.",
        "explanationFr": "Les deux pronoms restent liés à la même action : Elle vous le montre."
      },
      {
        "id": "double-pronoun-order-guided:declarative:extra-1",
        "promptFr": "Réécris « Il me rapporte des graines. » en remplaçant « des graines » par « en ». Garde l’autre pronom.",
        "answerFr": "Il m’en rapporte.",
        "hintFr": "Vérifie la place des deux pronoms et les élisions nécessaires.",
        "explanationFr": "Les deux pronoms restent liés à la même action : Il m’en rapporte."
      },
      {
        "id": "double-pronoun-order-guided:declarative:extra-2",
        "promptFr": "Réécris « Elle nous rejoint au lavoir. » en remplaçant « au lavoir » par « y ». Garde l’autre pronom.",
        "answerFr": "Elle nous y rejoint.",
        "hintFr": "Vérifie la place des deux pronoms et les élisions nécessaires.",
        "explanationFr": "Les deux pronoms restent liés à la même action : Elle nous y rejoint."
      }
    ],
    "materialExposure": {
      "sentences": [
        "Je donne la fiche à Zoé.",
        "Je la lui donne.",
        "Nous envoyons les résultats aux équipes.",
        "Nous les leur envoyons.",
        "Tu me donnes le carnet.",
        "Tu me le donnes.",
        "Je donne la liste à Malik.",
        "Je la lui donne.",
        "Nous rendons le dossier aux employés.",
        "Nous le leur rendons.",
        "Tu montres les croquis à ta sœur.",
        "Tu les lui montres.",
        "Vous prêtez la lampe aux campeurs.",
        "Vous la leur prêtez.",
        "Elle confie le colis à la gardienne.",
        "Elle le lui confie.",
        "Ils envoient les invitations aux familles.",
        "Ils les leur envoient.",
        "Il me raconte cette aventure.",
        "Il me la raconte.",
        "Elle me rapporte des nouvelles.",
        "Elle m’en rapporte.",
        "Il nous attend dans le vestibule.",
        "Il nous y attend.",
        "Elle vous montre le vitrail.",
        "Elle vous le montre.",
        "Il me rapporte des graines.",
        "Il m’en rapporte.",
        "Elle nous rejoint au lavoir.",
        "Elle nous y rejoint."
      ]
    }
  },
  {
    "id": "french-v3-teaching:double-pronoun-order:negative",
    "nodeKey": "ordonner_doubles_pronoms",
    "facetKey": "ordonner_doubles_pronoms::construction:negative",
    "mode": "production",
    "status": "draft_requires_review",
    "titleFr": "Placer deux pronoms dans une phrase négative",
    "learnerQuestionFr": "Comment placer deux pronoms sans changer le sens de ma phrase ?",
    "steps": [
      {
        "exampleFr": "Je ne prête pas le livre à Zoé. → Je ne le lui prête pas.",
        "explanationFr": "La négation ne change pas l’ordre le lui. Ne se place avant les pronoms et pas après le verbe."
      },
      {
        "exampleFr": "Nous ne remettons pas les enveloppes aux voisins. → Nous ne les leur remettons pas.",
        "explanationFr": "Les et leur restent ensemble devant remettons. On ne place pas ces pronoms après pas."
      },
      {
        "exampleFr": "Ne la lui donne pas !",
        "explanationFr": "L’ordre négatif replace les pronoms avant le verbe. Cette construction diffère de l’ordre affirmatif Donne-la-lui !"
      },
      {
        "exampleFr": "Il ne te prête pas les jumelles. → Il ne te les prête pas.",
        "explanationFr": "Ne reste devant la suite des pronoms, et pas après le verbe."
      },
      {
        "exampleFr": "Elle ne me parle pas de ce livre. → Elle ne m’en parle pas.",
        "explanationFr": "Me devient m’ devant en ; les deux pronoms restent avant parle."
      },
      {
        "exampleFr": "Il ne vous conduit pas au grenier. → Il ne vous y conduit pas.",
        "explanationFr": "Vous précède y. La négation encadre l’ensemble pronoms et verbe."
      }
    ],
    "takeawayFr": "Avant le verbe, me/te/nous/vous précèdent le/la/les ; le/la/les précèdent lui/leur. En et y suivent les autres pronoms dans les combinaisons étudiées.",
    "boundaryFr": "L’ordre dépend des pronoms, du verbe et de la forme affirmative ou négative. Les pronoms qui complètent un infinitif restent attachés à cet infinitif ; ils ne se déplacent pas automatiquement avec le verbe conjugué.",
    "practice": [
      {
        "id": "double-pronoun-order-guided:negative:0",
        "promptFr": "Réécris la phrase en remplaçant « la liste » par « la » et « à Malik » par « lui ». Garde les autres mots et le même type de phrase.\n\nJe ne donne pas la liste à Malik.",
        "answerFr": "Je ne la lui donne pas.",
        "hintFr": "Place le, la ou les avant lui ou leur, devant le verbe.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Je ne la lui donne pas."
      },
      {
        "id": "double-pronoun-order-guided:negative:1",
        "promptFr": "Réécris la phrase en remplaçant « le dossier » par « le » et « aux employés » par « leur ». Garde les autres mots et le même type de phrase.\n\nNous ne rendons pas le dossier aux employés.",
        "answerFr": "Nous ne le leur rendons pas.",
        "hintFr": "Place le, la ou les avant lui ou leur, devant le verbe.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Nous ne le leur rendons pas."
      },
      {
        "id": "double-pronoun-order-guided:negative:2",
        "promptFr": "Réécris la phrase en remplaçant « les croquis » par « les » et « à ta sœur » par « lui ». Garde les autres mots et le même type de phrase.\n\nTu ne montres pas les croquis à ta sœur.",
        "answerFr": "Tu ne les lui montres pas.",
        "hintFr": "Place le, la ou les avant lui ou leur, devant le verbe.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Tu ne les lui montres pas."
      },
      {
        "id": "double-pronoun-order-guided:negative:3",
        "promptFr": "Réécris la phrase en remplaçant « la lampe » par « la » et « aux campeurs » par « leur ». Garde les autres mots et le même type de phrase.\n\nVous ne prêtez pas la lampe aux campeurs.",
        "answerFr": "Vous ne la leur prêtez pas.",
        "hintFr": "Place le, la ou les avant lui ou leur, devant le verbe.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Vous ne la leur prêtez pas."
      },
      {
        "id": "double-pronoun-order-guided:negative:4",
        "promptFr": "Réécris la phrase en remplaçant « le colis » par « le » et « à la gardienne » par « lui ». Garde les autres mots et le même type de phrase.\n\nElle ne confie pas le colis à la gardienne.",
        "answerFr": "Elle ne le lui confie pas.",
        "hintFr": "Place le, la ou les avant lui ou leur, devant le verbe.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Elle ne le lui confie pas."
      },
      {
        "id": "double-pronoun-order-guided:negative:5",
        "promptFr": "Réécris la phrase en remplaçant « les invitations » par « les » et « aux familles » par « leur ». Garde les autres mots et le même type de phrase.\n\nIls ne envoient pas les invitations aux familles.",
        "answerFr": "Ils ne les leur envoient pas.",
        "hintFr": "Place le, la ou les avant lui ou leur, devant le verbe.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Ils ne les leur envoient pas."
      },
      {
        "id": "double-pronoun-order-guided:negative:extra-0",
        "promptFr": "Réécris « Elle ne te confie pas la recette. » en remplaçant « la recette » par « la ». Garde l’autre pronom.",
        "answerFr": "Elle ne te la confie pas.",
        "hintFr": "Vérifie la place des deux pronoms et les élisions nécessaires.",
        "explanationFr": "Les deux pronoms restent liés à la même action : Elle ne te la confie pas."
      },
      {
        "id": "double-pronoun-order-guided:negative:extra-1",
        "promptFr": "Réécris « Il ne nous apporte pas de galettes. » en remplaçant « de galettes » par « en ». Garde l’autre pronom.",
        "answerFr": "Il ne nous en apporte pas.",
        "hintFr": "Vérifie la place des deux pronoms et les élisions nécessaires.",
        "explanationFr": "Les deux pronoms restent liés à la même action : Il ne nous en apporte pas."
      },
      {
        "id": "double-pronoun-order-guided:negative:extra-2",
        "promptFr": "Réécris « Elle ne me rejoint pas au parking. » en remplaçant « au parking » par « y ». Garde l’autre pronom.",
        "answerFr": "Elle ne m’y rejoint pas.",
        "hintFr": "Vérifie la place des deux pronoms et les élisions nécessaires.",
        "explanationFr": "Les deux pronoms restent liés à la même action : Elle ne m’y rejoint pas."
      }
    ],
    "materialExposure": {
      "sentences": [
        "Je ne prête pas le livre à Zoé.",
        "Je ne le lui prête pas.",
        "Nous ne remettons pas les enveloppes aux voisins.",
        "Nous ne les leur remettons pas.",
        "Ne la lui donne pas !",
        "Je ne donne pas la liste à Malik.",
        "Je ne la lui donne pas.",
        "Nous ne rendons pas le dossier aux employés.",
        "Nous ne le leur rendons pas.",
        "Tu ne montres pas les croquis à ta sœur.",
        "Tu ne les lui montres pas.",
        "Vous ne prêtez pas la lampe aux campeurs.",
        "Vous ne la leur prêtez pas.",
        "Elle ne confie pas le colis à la gardienne.",
        "Elle ne le lui confie pas.",
        "Ils ne envoient pas les invitations aux familles.",
        "Ils ne les leur envoient pas.",
        "Il ne te prête pas les jumelles.",
        "Il ne te les prête pas.",
        "Elle ne me parle pas de ce livre.",
        "Elle ne m’en parle pas.",
        "Il ne vous conduit pas au grenier.",
        "Il ne vous y conduit pas.",
        "Elle ne te confie pas la recette.",
        "Elle ne te la confie pas.",
        "Il ne nous apporte pas de galettes.",
        "Il ne nous en apporte pas.",
        "Elle ne me rejoint pas au parking.",
        "Elle ne m’y rejoint pas."
      ]
    }
  },
  {
    "id": "french-v3-teaching:double-pronoun-order:imperative",
    "nodeKey": "ordonner_doubles_pronoms",
    "facetKey": "ordonner_doubles_pronoms::construction:imperative",
    "mode": "production",
    "status": "draft_requires_review",
    "titleFr": "Placer deux pronoms après un ordre affirmatif",
    "learnerQuestionFr": "Comment placer deux pronoms sans changer le sens de ma phrase ?",
    "steps": [
      {
        "exampleFr": "Montre la fiche à Zoé ! → Montre-la-lui !",
        "explanationFr": "Dans cet ordre affirmatif, les pronoms suivent le verbe. La vient avant lui ; des traits d’union relient les trois éléments."
      },
      {
        "exampleFr": "Confiez les sacs aux gardiens ! → Confiez-les-leur !",
        "explanationFr": "Avec les et leur, le pronom direct reste avant le pronom indirect. Le verbe garde sa forme d’impératif."
      },
      {
        "exampleFr": "Donne-le-moi ! Ne me le donne pas !",
        "explanationFr": "Moi et toi apparaissent après l’impératif affirmatif dans ces combinaisons. La négation change l’ordre. Les combinaisons avec en ou y ont aussi leurs particularités."
      },
      {
        "exampleFr": "Réservez-nous les sièges ! → Réservez-les-nous !",
        "explanationFr": "Le pronom direct les passe avant nous après cet impératif affirmatif."
      },
      {
        "exampleFr": "Apporte-moi du savon ! → Apporte-m’en !",
        "explanationFr": "Devant en, moi devient m’. On écrit un trait d’union avant m’, puis l’apostrophe, sans s entre les pronoms."
      },
      {
        "exampleFr": "Placez-vous près de la sortie. → Placez-vous-y.",
        "explanationFr": "Y reprend le lieu et suit vous. Les pronoms qui complètent cet impératif lui sont reliés par des traits d’union."
      }
    ],
    "takeawayFr": "À l’impératif affirmatif, place les pronoms après le verbe. Vérifie leur ordre et les formes moi/toi ou m’/t’ devant en et y.",
    "boundaryFr": "L’ordre dépend des pronoms, du verbe et de la forme affirmative ou négative. Les pronoms qui complètent un infinitif restent attachés à cet infinitif ; ils ne se déplacent pas automatiquement avec le verbe conjugué.",
    "practice": [
      {
        "id": "double-pronoun-order-guided:imperative:0",
        "promptFr": "Réécris la phrase en remplaçant « la liste » par « la » et « à Malik » par « lui ». Garde les autres mots et le même type de phrase.\n\nDonne la liste à Malik !",
        "answerFr": "Donne-la-lui !",
        "hintFr": "Le verbe vient d’abord, puis les deux pronoms reliés par des traits d’union.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Donne-la-lui !"
      },
      {
        "id": "double-pronoun-order-guided:imperative:1",
        "promptFr": "Réécris la phrase en remplaçant « le dossier » par « le » et « aux employés » par « leur ». Garde les autres mots et le même type de phrase.\n\nRendons le dossier aux employés !",
        "answerFr": "Rendons-le-leur !",
        "hintFr": "Le verbe vient d’abord, puis les deux pronoms reliés par des traits d’union.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Rendons-le-leur !"
      },
      {
        "id": "double-pronoun-order-guided:imperative:2",
        "promptFr": "Réécris la phrase en remplaçant « les croquis » par « les » et « à ta sœur » par « lui ». Garde les autres mots et le même type de phrase.\n\nMontre les croquis à ta sœur !",
        "answerFr": "Montre-les-lui !",
        "hintFr": "Le verbe vient d’abord, puis les deux pronoms reliés par des traits d’union.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Montre-les-lui !"
      },
      {
        "id": "double-pronoun-order-guided:imperative:3",
        "promptFr": "Réécris la phrase en remplaçant « la lampe » par « la » et « aux campeurs » par « leur ». Garde les autres mots et le même type de phrase.\n\nPrêtez la lampe aux campeurs !",
        "answerFr": "Prêtez-la-leur !",
        "hintFr": "Le verbe vient d’abord, puis les deux pronoms reliés par des traits d’union.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Prêtez-la-leur !"
      },
      {
        "id": "double-pronoun-order-guided:imperative:4",
        "promptFr": "Réécris la phrase en remplaçant « le colis » par « le » et « à la gardienne » par « lui ». Garde les autres mots et le même type de phrase.\n\nConfie le colis à la gardienne !",
        "answerFr": "Confie-le-lui !",
        "hintFr": "Le verbe vient d’abord, puis les deux pronoms reliés par des traits d’union.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Confie-le-lui !"
      },
      {
        "id": "double-pronoun-order-guided:imperative:5",
        "promptFr": "Réécris la phrase en remplaçant « les invitations » par « les » et « aux familles » par « leur ». Garde les autres mots et le même type de phrase.\n\nEnvoyez les invitations aux familles !",
        "answerFr": "Envoyez-les-leur !",
        "hintFr": "Le verbe vient d’abord, puis les deux pronoms reliés par des traits d’union.",
        "explanationFr": "La phrase conserve les deux compléments sous forme de pronoms : Envoyez-les-leur !"
      },
      {
        "id": "double-pronoun-order-guided:imperative:extra-0",
        "promptFr": "Réécris « Confiez-nous la bague ! » en remplaçant « la bague » par « la ». Garde l’autre pronom.",
        "answerFr": "Confiez-la-nous !",
        "hintFr": "Vérifie la place des deux pronoms et les élisions nécessaires.",
        "explanationFr": "Les deux pronoms restent liés à la même action : Confiez-la-nous !"
      },
      {
        "id": "double-pronoun-order-guided:imperative:extra-1",
        "promptFr": "Réécris « Prépare-moi du café ! » en remplaçant « du café » par « en ». Garde l’autre pronom.",
        "answerFr": "Prépare-m’en !",
        "hintFr": "Vérifie la place des deux pronoms et les élisions nécessaires.",
        "explanationFr": "Les deux pronoms restent liés à la même action : Prépare-m’en !"
      },
      {
        "id": "double-pronoun-order-guided:imperative:extra-2",
        "promptFr": "Réécris « Installez-vous dans la loge ! » en remplaçant « dans la loge » par « y ». Garde l’autre pronom.",
        "answerFr": "Installez-vous-y !",
        "hintFr": "Vérifie la place des deux pronoms et les élisions nécessaires.",
        "explanationFr": "Les deux pronoms restent liés à la même action : Installez-vous-y !"
      }
    ],
    "materialExposure": {
      "sentences": [
        "Montre la fiche à Zoé !",
        "Montre-la-lui !",
        "Confiez les sacs aux gardiens !",
        "Confiez-les-leur !",
        "Donne-le-moi ! Ne me le donne pas !",
        "Donne la liste à Malik !",
        "Donne-la-lui !",
        "Rendons le dossier aux employés !",
        "Rendons-le-leur !",
        "Montre les croquis à ta sœur !",
        "Montre-les-lui !",
        "Prêtez la lampe aux campeurs !",
        "Prêtez-la-leur !",
        "Confie le colis à la gardienne !",
        "Confie-le-lui !",
        "Envoyez les invitations aux familles !",
        "Envoyez-les-leur !",
        "Réservez-nous les sièges !",
        "Réservez-les-nous !",
        "Apporte-moi du savon !",
        "Apporte-m’en !",
        "Placez-vous près de la sortie.",
        "Placez-vous-y.",
        "Confiez-nous la bague !",
        "Confiez-la-nous !",
        "Prépare-moi du café !",
        "Prépare-m’en !",
        "Installez-vous dans la loge !",
        "Installez-vous-y !"
      ]
    }
  }
];
