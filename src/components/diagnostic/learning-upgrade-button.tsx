import {LESSONS_COPY as copy} from "@/lib/diagnostic/granular/lessons-copy";
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
  <p className="mb-3">{copy.upgradeHelp}</p>
  <button type="submit" className={buttonVariants()}>{copy.upgrade}</button>
 </form>;
}
