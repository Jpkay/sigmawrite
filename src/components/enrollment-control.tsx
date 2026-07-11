"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setClassEnrollment } from "@/lib/actions/teacher";
export function EnrollmentControl({classId,studentId}:{classId:string;studentId:string}){const router=useRouter();const [busy,setBusy]=useState(false);async function remove(){setBusy(true);try{await setClassEnrollment({classId,studentId,status:"removed"});router.refresh();}finally{setBusy(false);}}return <button disabled={busy} onClick={remove} className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">{busy?"Retrait…":"Retirer"}</button>}
