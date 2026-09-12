import {conjugate} from '@/lib/linguistic/conjugation';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';

// Restrict algorithmic -er handling to the authored inventory: an arbitrary
// infinitive such as appeler needs spelling rules this conjugator lacks.
const supported=new Set(['écrire','mettre','attendre','rejoindre',...CONJUGATION_TEACHING_CASES.flatMap(f=>[f.model,...f.cases.map(c=>c.verb)])]);
export class UnsupportedWritingImperativeError extends Error{
 constructor(){super('Imperative verb outside verified conjugation support');this.name='UnsupportedWritingImperativeError';}
}
const normalize=(s:string)=>s.normalize('NFC').toLocaleLowerCase('fr');
/** Morphology only. The model still evaluates the sentence's meaning and
 * audience. A valid form can never overturn an incorrect contextual judgment. */
export function checkWritingImperativeForm(input:{infinitive:string;form:string;suffix:string}):{valid:boolean;forms:string[];liaison:boolean}{
 const infinitive=normalize(input.infinitive);
 if(!supported.has(infinitive)||infinitive==='pouvoir')throw new UnsupportedWritingImperativeError();
 const forms=(['2s','1p','2p'] as const).map(person=>conjugate(infinitive,'imperatif_present',person));
 const form=normalize(input.form);
 // The liaison s belongs to the verb only before directly attached en/y.
 const euphonic=/^[-‐‑](?:en|y)(?![\p{L}\p{M}])/u.test(normalize(input.suffix))&&/[ea]$/.test(forms[0])?forms[0]+'s':undefined;
 return {valid:(forms.includes(form)&&!(euphonic&&form===forms[0]))||form===euphonic,forms,liaison:Boolean(euphonic)};
}
