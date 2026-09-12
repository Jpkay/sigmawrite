/** Original sentence contexts; fixed word pairs cannot provide novel target words. */
export const HOMOPHONE_RECOGNITION_DRAFTS = [
 ...[
 ['Maya attache ___ casque avant de partir.','son'],['Les vélos ___ rangés sous le préau.','sont'],
 ['Le joueur cherche ___ maillot dans le vestiaire.','son'],['Ces histoires ___ inventées par les élèves.','sont'],
 ['Idriss invite ___ ancienne voisine.','son'],['Les deux musiciennes ___ sur la scène.','sont'],
 ['Nina termine ___ dessin au crayon.','son'],['Les fenêtres ___ ouvertes depuis ce matin.','sont'],
 ['La nageuse retrouve ___ entraîneuse au bord du bassin.','son'],['Mes cousins ___ arrivés hier soir.','sont'],
 ['Le libraire ferme ___ magasin à midi.','son'],['Ces mangues ___ encore vertes.','sont'],
 ['Léa présente ___ idée au groupe.','son'],['Les chaussures de Sami ___ trop petites.','sont'],
 ['Le photographe ajuste ___ appareil.','son'],['Les affiches ___ collées sur le panneau.','sont'],
 ].map(([sentence,answer])=>({pair:'son_sont',sentence,answer,alternatives:['son','sont']})),
 ...[
 ['Demain, ___ prépare le décor du spectacle.','on'],['Les bénévoles ___ apporté des outils.','ont'],
 ['Dans ce jeu, ___ avance de deux cases.','on'],['Les tortues ___ une carapace solide.','ont'],
 ['Au musée, ___ observe les tableaux en silence.','on'],['Mes amis ___ choisi le même roman.','ont'],
 ['Chaque vendredi, ___ échange des livres.','on'],['Ces maisons ___ de grandes fenêtres.','ont'],
 ['Après le repas, ___ débarrasse la table.','on'],['Les coureuses ___ franchi la ligne ensemble.','ont'],
 ['Avec cette carte, ___ peut entrer dans la bibliothèque.','on'],['Les élèves ___ encore une question.','ont'],
 ['En été, ___ mange parfois dehors.','on'],['Ces chiens ___ retrouvé leur maître.','ont'],
 ['Pour réussir ce dessin, ___ commence par un cercle.','on'],['Les enfants ___ peur du bruit de la machine.','ont'],
 ].map(([sentence,answer])=>({pair:'on_ont',sentence,answer,alternatives:['on','ont']})),
] as const;
