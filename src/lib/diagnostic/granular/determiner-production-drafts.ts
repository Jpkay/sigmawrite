/** Controlled correction: only the marked determiner changes, preserving its
 * family and the possessor. The malformed group is intentional task material. */
const cases:Array<[string,string,string,string,string]>=[
 ["defined-plural","Le chaises sont empilées.","Le","Les","Le nom chaises est pluriel; l’article défini devient les."],
 ["defined-feminine","Le rivière traverse le village.","Le","La","Rivière est féminin singulier : la rivière."],
 ["defined-masculine","La camion bloque la route.","La","Le","Camion est masculin singulier : le camion."],
 ["defined-elision","La horloge avance de cinq minutes.","La","L’","Horloge commence par un h muet : l’article s’élide, l’horloge."],
 ["indefinite-feminine","Un bouteille roule sous le banc.","Un","Une","Bouteille est féminin singulier; on écrit une bouteille."],
 ["indefinite-masculine","Une fauteuil occupe le coin.","Une","Un","Fauteuil est masculin singulier : un fauteuil."],
 ["indefinite-plural","Une lanternes éclairent le sentier.","Une","Des","Le nom lanternes est pluriel : des lanternes."],
 ["indefinite-singular","Des dessin décore la couverture.","Des","Un","Dessin est masculin singulier : un dessin."],
 ["demonstrative-feminine","Ce colline domine la vallée.","Ce","Cette","Colline est féminin singulier : cette colline."],
 ["demonstrative-masculine","Cette rocher ressemble à un lion.","Cette","Ce","Rocher est masculin singulier et commence par une consonne : ce rocher."],
 ["demonstrative-plural","Cet outils servent à réparer le vélo.","Cet","Ces","Outils est pluriel : ces outils, même si le mot commence par une voyelle."],
 ["demonstrative-vowel","Ce immeuble compte six étages.","Ce","Cet","Immeuble est masculin singulier et commence par une voyelle : cet immeuble."],
 ["possessive-ma","Mon gourde est vide.","Mon","Ma","Gourde est féminin singulier et commence par une consonne : ma gourde."],
 ["possessive-mon","Ma manteau sèche près du radiateur.","Ma","Mon","Manteau est masculin singulier : mon manteau."],
 ["possessive-mes","Ma chaussettes sont dans le tiroir.","Ma","Mes","Chaussettes est pluriel : mes chaussettes."],
 ["possessive-vowel","Ma amie prépare le goûter.","Ma","Mon","Devant amie, qui commence par une voyelle, on emploie mon malgré le féminin du nom."],
 ["possessive-ta","Ton règle mesure trente centimètres.","Ton","Ta","Règle est féminin singulier et commence par une consonne : ta règle."],
 ["possessive-tes","Ta crayons sont bien taillés.","Ta","Tes","Crayons est pluriel : tes crayons."],
 ["possessive-sa","Son lampe fonctionne à piles.","Son","Sa","Lampe est féminin singulier et commence par une consonne : sa lampe."],
 ["possessive-ses","Son bottes sont encore mouillées.","Son","Ses","Bottes est pluriel : ses bottes."],
 ["notre-plural","Notre projets avancent.","Notre","Nos","Projets est pluriel : nos projets."],
 ["votre-singular","Vos colis est arrivé.","Vos","Votre","Colis est ici singulier, comme le montre est arrivé : votre colis. Le s final du nom ne suffit pas à décider."],
 ["leur-plural","Leur maisons sont voisines.","Leur","Leurs","Maisons est pluriel : leurs maisons."],
 ["leurs-singular","Leurs piscine est fermée.","Leurs","Leur","Piscine est singulier : leur piscine, même si elle appartient à plusieurs personnes."],
];
export const DETERMINER_PRODUCTION_DRAFTS=cases.map(([key,sentence,marked,answer,reason])=>({key,sentence,marked,answer,reason,nodeKey:"construction_accord_determinant_nom" as const}));
