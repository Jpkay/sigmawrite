"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {upgradeGranularLearning} from "@/lib/actions/granular-learning-upgrade";
import {Button} from "@/components/ui/button";
export function LearningUpgradeButton(){
 const [pending,startTransition]=useTransition();
 const [error,setError]=useState("");
 const router=useRouter();
 return <div className="mb-6 rounded-lg border bg-card p-5">
  <p className="mb-3">De nouvelles activités sont disponibles pour ton parcours. Tes réponses et tes progrès seront conservés.</p>
  <Button disabled={pending} onClick={()=>startTransition(async()=>{
   setError("");
   try{await upgradeGranularLearning();router.refresh();}
   catch{setError("Ton parcours n’a pas pu être actualisé. Recharge la page et réessaie.");}
  })}>{pending?"Actualisation…":"Ajouter les nouvelles activités"}</Button>
  {error&&<p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
 </div>;
}
