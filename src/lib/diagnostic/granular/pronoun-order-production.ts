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
  }
] as const;

export const DOUBLE_PRONOUN_ORDER_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:double-pronoun-order:declarative",
    "nodeKey": "ordonner_doubles_pronoms",
    "facetKey": "ordonner_doubles_pronoms::construction:declarative",
    "mode": "production",
    "status": "draft_requires_review",
    "titleFr": "Placer le, la ou les avec lui ou leur",
    "learnerQuestionFr": "Dans quel ordre placer le pronom de la chose et celui de son destinataire ?",
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
      }
    ],
    "takeawayFr": "Dans ces combinaisons, place le, la ou les avant lui ou leur, devant le verbe.",
    "boundaryFr": "Ces exercices ciblent les combinaisons le, la ou les avec lui ou leur. Ils ne prouvent pas la maîtrise de toutes les combinaisons, notamment avec me, te, nous, vous, y ou en.",
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
        "Ils les leur envoient."
      ]
    }
  },
  {
    "id": "french-v3-teaching:double-pronoun-order:negative",
    "nodeKey": "ordonner_doubles_pronoms",
    "facetKey": "ordonner_doubles_pronoms::construction:negative",
    "mode": "production",
    "status": "draft_requires_review",
    "titleFr": "Garder deux pronoms dans une phrase négative",
    "learnerQuestionFr": "Dans quel ordre placer le pronom de la chose et celui de son destinataire ?",
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
      }
    ],
    "takeawayFr": "Dans ces combinaisons, place le, la ou les avant lui ou leur, devant le verbe.",
    "boundaryFr": "Ces exercices ciblent les combinaisons le, la ou les avec lui ou leur. Ils ne prouvent pas la maîtrise de toutes les combinaisons, notamment avec me, te, nous, vous, y ou en.",
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
        "Ils ne les leur envoient pas."
      ]
    }
  },
  {
    "id": "french-v3-teaching:double-pronoun-order:imperative",
    "nodeKey": "ordonner_doubles_pronoms",
    "facetKey": "ordonner_doubles_pronoms::construction:imperative",
    "mode": "production",
    "status": "draft_requires_review",
    "titleFr": "Relier deux pronoms à un ordre affirmatif",
    "learnerQuestionFr": "Dans quel ordre placer le pronom de la chose et celui de son destinataire ?",
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
      }
    ],
    "takeawayFr": "À l’impératif affirmatif, écris le verbe, puis le, la ou les, puis lui ou leur, avec des traits d’union.",
    "boundaryFr": "Ces exercices ciblent les combinaisons le, la ou les avec lui ou leur. Ils ne prouvent pas la maîtrise de toutes les combinaisons, notamment avec me, te, nous, vous, y ou en.",
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
        "Envoyez-les-leur !"
      ]
    }
  }
];
