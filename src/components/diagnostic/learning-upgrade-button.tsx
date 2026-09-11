import {redirect} from "next/navigation";
import {upgradeGranularLearning} from "@/lib/actions/granular-learning-upgrade";
import {buttonVariants} from "@/components/ui/button";

/** Native form submission also works before client-side hydration completes. */
export function LearningUpgradeButton(){
 return <form className="mb-6 rounded-lg border bg-card p-5" action={async()=>{
  "use server";
  await upgradeGranularLearning();
  redirect("/student/lessons");
 }}>
  <p className="mb-3">De nouvelles activités sont disponibles pour ton parcours. Tes réponses et tes progrès seront conservés.</p>
  <button type="submit" className={buttonVariants()}>Ajouter les nouvelles activités</button>
 </form>;
}
