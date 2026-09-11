/** Keep the subject natural when a supplied form changes its initial sound. */
export function conjugationSentenceGap(sentence:string,answer:string) {
 return /^[aeiouàâéèêëîïôöùûüœ]/i.test(answer)
  ?sentence.replace(/\b([Jj])e ___/g,"$1’___")
  :sentence;
}
