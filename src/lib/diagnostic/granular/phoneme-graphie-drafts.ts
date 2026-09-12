export type PhonemeGraphieGroup='ch'|'ou'|'gn'|'f';
export type PhonemeGraphieDraft={key:string;mode:'recognition'|'production';word:string;masked:string;group:PhonemeGraphieGroup};
const recognition:readonly [string,string,PhonemeGraphieGroup][]=[
 ['chat','___at','ch'],['chou','___ou','ch'],['chemin','___emin','ch'],['mouche','mou___e','ch'],
 ['loup','l___p','ou'],['roue','r___e','ou'],['poule','p___le','ou'],['mouton','m___ton','ou'],
 ['ligne','li___e','gn'],['vigne','vi___e','gn'],['signe','si___e','gn'],['peigne','pei___e','gn'],
 ['fumée','___umée','f'],['fée','___ée','f'],['fourmi','___ourmi','f'],['filet','___ilet','f'],
];
const production:readonly [string,string,PhonemeGraphieGroup][]=[
 ['riche','ri___e','ch'],['ruche','ru___e','ch'],['poche','po___e','ch'],['branche','bran___e','ch'],
 ['route','r___te','ou'],['genou','gen___','ou'],['hibou','hib___','ou'],['bougie','b___gie','ou'],
 ['montagne','monta___e','gn'],['champignon','champi___on','gn'],['baignoire','bai___oire','gn'],['poignée','poi___ée','gn'],
 ['farine','___arine','f'],['forêt','___orêt','f'],['ferme','___erme','f'],['flaque','___laque','f'],
];
export const PHONEME_GRAPHIE_DRAFTS:readonly PhonemeGraphieDraft[]=([['recognition',recognition],['production',production]] as const).flatMap(([mode,rows])=>rows.map(([word,masked,group])=>({key:`${mode}-${word}`,mode,word,masked,group})));
export const PHONEME_GRAPHIE_TEACHING_WORDS:readonly [string,PhonemeGraphieGroup][]=[['cheval','ch'],['niche','ch'],['souris','ou'],['ourson','ou'],['campagne','gn'],['châtaigne','gn'],['fusée','f'],['flûte','f']];
