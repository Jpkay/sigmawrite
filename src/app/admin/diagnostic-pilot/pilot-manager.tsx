"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { enrollDiagnosticPilotStudent, revokeDiagnosticPilotEnrollment, setDiagnosticPilotEnabled } from "@/lib/actions/diagnostic-pilot";

type Student = { id: string; name: string; grade: number };
type Enrollment = { id: string; studentId: string; studentName: string; grade: number; active: boolean; expiresAt: string; note: string | null };

export function DiagnosticPilotManager({ enabled, students, enrollments }: { enabled: boolean; students: Student[]; enrollments: Enrollment[] }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [days, setDays] = useState(7);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  async function act(key: string, work: () => Promise<unknown>) {
    setBusy(key); setMessage("");
    try { await work(); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Action impossible."); }
    finally { setBusy(""); }
  }
  const active = enrollments.filter((enrollment) => enrollment.active);
  return <div className="space-y-7"><Card><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><div className="flex items-center gap-2"><h2 className="font-semibold">Interrupteur global</h2><Badge variant={enabled ? "success" : "secondary"}>{enabled ? "Actif" : "Désactivé"}</Badge></div><p className="mt-1 max-w-2xl text-sm text-muted-foreground">La désactivation bloque immédiatement le démarrage et la prochaine question de tous les essais.</p></div><Button variant={enabled ? "destructive" : "default"} disabled={Boolean(busy)} onClick={() => void act("toggle", () => setDiagnosticPilotEnabled({ enabled: !enabled }))}>{enabled ? "Arrêter tous les essais" : "Autoriser les essais"}</Button></CardContent></Card><Card><CardContent className="pt-6"><h2 className="font-semibold">Inscrire un compte de test</h2><p className="mt-1 text-sm text-muted-foreground">Un compte ayant déjà terminé un diagnostic publié est refusé automatiquement.</p><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem_1fr_auto]"><select aria-label="Élève de test" value={studentId} onChange={(event) => setStudentId(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">{students.map((student) => <option key={student.id} value={student.id}>{student.name} · classe {student.grade}</option>)}</select><input aria-label="Durée en jours" type="number" min={1} max={30} value={days} onChange={(event) => setDays(Number(event.target.value))} className="h-10 rounded-md border border-input bg-background px-3 text-sm" /><input aria-label="Note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="But de l’essai" className="h-10 rounded-md border border-input bg-background px-3 text-sm" /><Button disabled={Boolean(busy) || !studentId} onClick={() => void act("enroll", () => enrollDiagnosticPilotStudent({ studentId, durationDays: days, note }))}>Inscrire</Button></div></CardContent></Card>{message && <p role="status" className="text-sm text-destructive">{message}</p>}<section><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Accès actifs</h2><span className="text-sm text-muted-foreground">{active.length}</span></div>{active.length ? <div className="space-y-2">{active.map((enrollment) => <Card key={enrollment.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><p className="font-medium">{enrollment.studentName} · classe {enrollment.grade}</p><p className="mt-1 text-xs text-muted-foreground">Expire le {new Date(enrollment.expiresAt).toLocaleString("fr-FR")}{enrollment.note ? ` · ${enrollment.note}` : ""}</p></div><Button variant="outline" disabled={Boolean(busy)} onClick={() => void act(enrollment.id, () => revokeDiagnosticPilotEnrollment({ enrollmentId: enrollment.id }))}>Révoquer</Button></CardContent></Card>)}</div> : <p className="text-sm text-muted-foreground">Aucun compte de test inscrit.</p>}</section></div>;
}
