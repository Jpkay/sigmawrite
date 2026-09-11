export type LexicalSpellingDraft={key:string;nodeKey:"appliquer_m_devant_m_b_p";lemma:string;answer:string;sentence:string;case:"before_b"|"before_p"|"before_m"|"keep_n"|"exception";reason:string};
/** Authored lexical-spelling drafts, not reviewed evidence. Contrast ordinary
 * contexts, unchanged n and lexical exceptions instead of always expecting m. */
const rows:readonly [string,string,LexicalSpellingDraft["case"]][]=[
 ["chambre","La cha___bre donne sur le jardin.","before_b"],
 ["jambe","Après sa chute, Hugo a mal à la ja___be.","before_b"],
 ["ombre","À midi, nous cherchons de l’o___bre.","before_b"],
 ["timbre","Colle un ti___bre sur l’enveloppe.","before_b"],
 ["tomber","Attention, ce vase peut to___ber !","before_b"],
 ["combien","Co___bien de personnes viennent ce soir ?","before_b"],
 ["tambour","Le musicien frappe sur son ta___bour.","before_b"],
 ["bambou","Le panda mange du ba___bou.","before_b"],
 ["champ","Un cha___p de blé borde la route.","before_p"],
 ["lampe","Allume la la___pe pour lire.","before_p"],
 ["simple","Cette règle est si___ple à comprendre.","before_p"],
 ["pompe","La po___pe permet de gonfler le pneu.","before_p"],
 ["compter","Je vais co___pter les points du match.","before_p"],
 ["impossible","Sans la clé, il est i___possible d’ouvrir cette porte.","before_p"],
 ["tempête","La te___pête a cassé plusieurs branches.","before_p"],
 ["champignon","Un cha___pignon pousse au pied de l’arbre.","before_p"],
 ["emmener","Je peux e___mener ma sœur au cinéma.","before_m"],
 ["emménager","La famille va e___ménager dans sa nouvelle maison.","before_m"],
 ["emmêler","Le vent risque d’e___mêler les fils du cerf-volant.","before_m"],
 ["emmagasiner","Ce réservoir peut e___magasiner l’eau de pluie.","before_m"],
 ["danser","La musique nous donne envie de da___ser.","keep_n"],
 ["vent","Le ve___t fait bouger les rideaux.","keep_n"],
 ["enfant","Cet e___fant apprend à faire du vélo.","keep_n"],
 ["lent","Ce vieux bus est très le___t.","keep_n"],
 ["bonbon","Lina déballe un bo___bon à la menthe.","exception"],
 ["bonbonne","Le laboratoire utilise une bo___bonne de gaz.","exception"],
];
export const LEXICAL_SPELLING_DRAFTS:readonly LexicalSpellingDraft[]=rows.map(([word,sentence,kind])=>({
 key:`nasal-${word}`,nodeKey:"appliquer_m_devant_m_b_p",lemma:word,answer:word,sentence,case:kind,
 reason:kind==="exception"?`${word} est une exception lexicale : le n placé devant b est conservé.`
  :kind==="keep_n"?`Dans ${word}, la lettre qui suit le n n’est ni m, ni b, ni p : on conserve n.`
  :`Dans ${word}, la graphie nasale s’écrit avec m devant ${kind==="before_b"?"b":kind==="before_p"?"p":"m"}.`,
}));
