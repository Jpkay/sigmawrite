export type AgreementAnalysisDraft={key:string;construction:"adjacent"|"separated"|"inverted"|"coordinated";sentence:string;subject:string;form:string;correctForm:string;plural:boolean;negative:boolean};
/** Source sentences differ from the existing completion tasks. All await review. */
const groups:Record<AgreementAnalysisDraft["construction"],readonly [string,string,string,string,boolean][]>={
 adjacent:[
  ["La violoniste ___ son instrument.","La violoniste","accorde","accordent",false],
  ["Les promeneurs ___ la rivière.","Les promeneurs","longent","longe",true],
  ["Le gardien ___ la grille.","Le gardien","ferme","ferment",false],
  ["Les apprentis ___ le matériel.","Les apprentis","préparent","prépare",true],
  ["La grenouille ___ dans la mare.","La grenouille","saute","sautent",false],
  ["Les fourmis ___ des miettes.","Les fourmis","transportent","transporte",true],
  ["Le photographe ___ son objectif.","Le photographe","nettoie","nettoient",false],
  ["Les nageuses ___ le bassin.","Les nageuses","traversent","traverse",true],
 ],
 separated:[
  ["La boîte des feutres ___ sur la table.","La boîte des feutres","reste","restent",false],
  ["Les pages du cahier ___ au vent.","Les pages du cahier","tournent","tourne",true],
  ["Le chien des voisins ___ près du portail.","Le chien des voisins","attend","attendent",false],
  ["Les roues de la voiture ___ sur le gravier.","Les roues de la voiture","glissent","glisse",true],
  ["La lumière des projecteurs ___ la scène.","La lumière des projecteurs","éclaire","éclairent",false],
  ["Les branches du sapin ___ sous la neige.","Les branches du sapin","plient","plie",true],
  ["Le sac des randonneurs ___ contre le mur.","Le sac des randonneurs","repose","reposent",false],
  ["Les clés du garage ___ dans sa poche.","Les clés du garage","tintent","tinte",true],
 ],
 inverted:[
  ["Au fond de la vallée ___ un ruisseau.","un ruisseau","coule","coulent",false],
  ["Sur le quai ___ les voyageurs.","les voyageurs","patientent","patiente",true],
  ["Derrière les maisons ___ une montagne.","une montagne","se dresse","se dressent",false],
  ["Au-dessus du lac ___ des oiseaux.","des oiseaux","planent","plane",true],
  ["Dans les hautes herbes ___ un lézard.","un lézard","se cache","se cachent",false],
  ["Dans la cour ___ les cloches.","les cloches","résonnent","résonne",true],
  ["Au pied des arbres ___ une source.","une source","jaillit","jaillissent",false],
  ["Sur la branche ___ deux mésanges.","deux mésanges","se posent","se pose",true],
 ],
 coordinated:[
  ["Le maire et son adjointe ___ la salle.","Le maire et son adjointe","visitent","visite",true],
  ["La chèvre et son chevreau ___ dans le pré.","La chèvre et son chevreau","avancent","avance",true],
  ["Le vent et la pluie ___ les volets.","Le vent et la pluie","secouent","secoue",true],
  ["La lampe et la bougie ___ le bureau.","La lampe et la bougie","éclairent","éclaire",true],
  ["Le train et le tramway ___ à la station.","Le train et le tramway","arrivent","arrive",true],
  ["La chanteuse et le pianiste ___ ensemble.","La chanteuse et le pianiste","répètent","répète",true],
  ["Le père et sa fille ___ un cerf-volant.","Le père et sa fille","fabriquent","fabrique",true],
  ["La biche et le faon ___ le sentier.","La biche et le faon","traversent","traverse",true],
 ],
};
export const AGREEMENT_ANALYSIS_DRAFTS:readonly AgreementAnalysisDraft[]=Object.entries(groups).flatMap(([construction,rows])=>rows.map(([sentence,subject,correctForm,wrongForm,plural],index)=>{
 const negative=index%4===1||index%4===2;
 const form=negative?wrongForm:correctForm;
 return {key:`${construction}-${index+1}`,construction:construction as AgreementAnalysisDraft["construction"],sentence:sentence.replace("___",form),subject,form,correctForm,plural,negative};
}));
