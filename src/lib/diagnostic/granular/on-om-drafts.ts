export type OnOmDraft={key:string;mode:"recognition"|"production";word:string;sentence:string;letter:"n"|"m"};
const recognition:readonly [string,string,"n"|"m"][]=[
 ["pont","Le po___t permet de traverser la rivière.","n"],
 ["compote","La co___pote de pommes refroidit dans le bol.","m"],
 ["rond","Le ballon est bien ro___d.","n"],
 ["trompette","Le musicien joue de la tro___pette.","m"],
 ["monde","Il y a beaucoup de mo___de au marché.","n"],
 ["nombre","Écris le no___bre de joueurs sur la feuille.","m"],
 ["fontaine","L’eau de la fo___taine est fraîche.","n"],
 ["colombe","Une colo___be blanche se pose sur le toit.","m"],
 ["chanson","Cette cha___son passe souvent à la radio.","n"],
 ["concombre","Coupe le conco___bre en rondelles.","m"],
 ["confiture","Je mets de la co___fiture sur ma tartine.","n"],
 ["sombre","La pièce est so___bre sans la lampe.","m"],
 ["montagne","La mo___tagne est couverte de neige.","n"],
 ["rompre","Une branche sèche peut se ro___pre.","m"],
];
const production:readonly [string,string,"n"|"m"][]=[
 ["montre","Ma mo___tre indique neuf heures.","n"],
 ["combat","Le co___bat se termine à la fin du troisième round.","m"],
 ["réponse","Je cherche la répo___se à cette question.","n"],
 ["complet","Le bus est co___plet : toutes les places sont occupées.","m"],
 ["ballon","Le ballo___ roule sur la pelouse.","n"],
 ["comble","Le jardinier co___ble le trou avec de la terre.","m"],
 ["talon","Le talo___ de sa chaussure est abîmé.","n"],
 ["plomb","Ce vieux tuyau est en plo___b.","m"],
 ["savon","Lave tes mains avec du savo___.","n"],
 ["ombre","L’arbre nous offre de l’o___bre.","m"],
 ["salon","La famille se retrouve dans le salo___.","n"],
 ["tomber","Attention à ne pas to___ber sur le sol mouillé.","m"],
 ["mouton","Le mouto___ broute dans le pré.","n"],
 ["pompe","Cette po___pe sert à gonfler les pneus.","m"],
];
export const ON_OM_DRAFTS:readonly OnOmDraft[]=([['recognition',recognition],['production',production]] as const).flatMap(([mode,rows])=>rows.map(([word,sentence,letter])=>({key:`${mode}-${word}`,mode,word,sentence,letter})));
