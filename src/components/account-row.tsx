"use client";

import { useState } from "react";
import { KeyRound, Mail, Power, School, UserCog, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserManagementData } from "@/lib/db/users";

type Account = UserManagementData["accounts"][number];
type Actions = {
  setTeacherClass: (input: { teacherProfileId: string; classId: string; assigned: boolean }) => Promise<unknown>;
  setTeacherStudent: (input: { teacherProfileId: string; studentId: string; assigned: boolean }) => Promise<unknown>;
  changeUserRole: (input: { profileId: string; role: string; schoolId?: string | null }) => Promise<unknown>;
  setUserDeactivated: (input: { profileId: string; deactivated: boolean }) => Promise<unknown>;
  attachEmailToAccount: (input: { profileId: string; email: string }) => Promise<unknown>;
  linkGuardian: (input: { studentId: string; email: string }) => Promise<{ created: boolean; emailDelivered: boolean }>;
};

const ROLE_LABELS: Record<string, string> = { student: "Élève", teacher: "Enseignant", supervisor: "Superviseur", parent: "Parent", school_admin: "Admin d’établissement" };
const inputClass = "h-9 rounded-md border border-input bg-background px-2 text-sm";

/** One managed account with its actions (audit 2026-09-06). Every action is a server call that re-checks scope. */
export function AccountRow({ account, data, busy, onBusy, onError, onResetPassword, actions }: {
  account: Account; data: UserManagementData; busy: boolean;
  onBusy: (value: boolean) => void; onError: (message: string) => void; onCredentials: (value: null) => void; onResetPassword: () => void; actions: Actions;
}) {
  const [open, setOpen] = useState<"classes" | "students" | "email" | "role" | "guardian" | null>(null);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState(account.role as string);
  const [newSchool, setNewSchool] = useState(account.schoolId ?? "");
  const [classIds, setClassIds] = useState<string[]>(account.classIds);
  const [directStudentIds, setDirectStudentIds] = useState<string[]>(account.directStudentIds);
  const [status, setStatus] = useState("");
  const [deactivated, setDeactivated] = useState(account.deactivated);
  const platformAdmin = data.viewerRole === "platform_admin";

  async function run(label: string, work: () => Promise<unknown>) {
    onBusy(true); onError(""); setStatus("");
    try { await work(); setStatus(label); } catch (caught) { onError(caught instanceof Error ? caught.message : "Action impossible."); } finally { onBusy(false); }
  }

  return (
    <div className={`py-4 ${deactivated ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{account.displayName}</p>
            <Badge variant="secondary">{ROLE_LABELS[account.role] ?? account.role}</Badge>
            {account.mustChangePassword && <Badge variant="outline">Mot de passe à renouveler</Badge>}
            {account.feedbackPilotActive && <Badge>Pilote de feedback</Badge>}
            {!account.emailRecoveryEnabled && <Badge variant="outline">Sans e-mail de récupération</Badge>}
            {deactivated && <Badge variant="outline">Désactivé</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {account.username}
            {account.role === "teacher" && ` · ${classIds.length} classe(s) · ${directStudentIds.length} élève(s) en direct`}
            {account.role === "student" && ` · ${account.classIds.length} classe(s) · ${account.guardianCount} parent(s)`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onResetPassword}><KeyRound className="size-4" />Mot de passe</Button>
          {!account.emailRecoveryEnabled && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setOpen(open === "email" ? null : "email")}><Mail className="size-4" />E-mail</Button>}
          {account.role === "teacher" && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setOpen(open === "classes" ? null : "classes")}><School className="size-4" />Classes</Button>}
          {account.role === "teacher" && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setOpen(open === "students" ? null : "students")}><Users className="size-4" />Élèves directs</Button>}
          {account.role === "student" && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setOpen(open === "guardian" ? null : "guardian")}><Users className="size-4" />Parent</Button>}
          {platformAdmin && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setOpen(open === "role" ? null : "role")}><UserCog className="size-4" />Rôle</Button>}
          <Button type="button" size="sm" variant={deactivated ? "default" : "ghost"} disabled={busy} onClick={() => run(deactivated ? "Compte réactivé." : "Compte désactivé : connexion bloquée, données conservées.", async () => { await actions.setUserDeactivated({ profileId: account.profileId, deactivated: !deactivated }); setDeactivated(!deactivated); })}><Power className="size-4" />{deactivated ? "Réactiver" : "Désactiver"}</Button>
        </div>
      </div>
      {status && <p role="status" className="mt-2 text-sm text-success">{status}</p>}

      {open === "email" && (
        <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); void run("Adresse ajoutée : récupération et lien magique disponibles.", async () => { await actions.attachEmailToAccount({ profileId: account.profileId, email }); setOpen(null); }); }}>
          <label className="text-sm">Adresse e-mail<br /><input type="email" required className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <Button type="submit" size="sm" disabled={busy}>Ajouter</Button>
        </form>
      )}

      {open === "classes" && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-muted-foreground">Retirer une classe supprime uniquement ce droit de classe. Les autres classes et liens directs restent actifs.</p>
          <div className="flex flex-wrap gap-2">
          {data.classes.map((cls) => {
            const assigned = classIds.includes(cls.id);
            const affected = data.students.filter((student) => student.classIds.includes(cls.id));
            const retained = affected.filter((student) => directStudentIds.includes(student.id) || student.classIds.some((id) => id !== cls.id && classIds.includes(id)));
            const removedMessage = `${cls.name} retirée. ${retained.length} élève(s) conservent un autre droit connu ; ${affected.length - retained.length} perdent ce droit de classe.`;
            return <button key={cls.id} type="button" disabled={busy} onClick={() => run(assigned ? removedMessage : `Affecté à ${cls.name}.`, async () => { await actions.setTeacherClass({ teacherProfileId: account.profileId, classId: cls.id, assigned: !assigned }); setClassIds((current) => assigned ? current.filter((id) => id !== cls.id) : [...current, cls.id]); })} className={`rounded-full border px-3 py-1 text-sm ${assigned ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`} aria-pressed={assigned}>{cls.name}</button>;
          })}
          {data.classes.length === 0 && <p className="text-sm text-muted-foreground">Aucune classe.</p>}
          </div>
        </div>
      )}

      {open === "students" && account.role === "teacher" && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-muted-foreground">Un lien direct est indépendant des classes. Le retirer laisse en place tout accès obtenu par une classe enseignée.</p>
          <div className="flex flex-wrap gap-2">
            {data.students.filter((student) => !account.schoolId || student.schoolId === account.schoolId).map((student) => {
              const assigned = directStudentIds.includes(student.id);
              const classGrantNames = data.classes.filter((selectedClass) => classIds.includes(selectedClass.id) && student.classIds.includes(selectedClass.id)).map((selectedClass) => selectedClass.name);
              const removedMessage = classGrantNames.length
                ? `Lien direct retiré pour ${student.name}. Accès conservé via ${classGrantNames.join(", ")}.`
                : `Lien direct retiré pour ${student.name}. Aucun autre droit connu ne subsiste.`;
              return <button key={student.id} type="button" disabled={busy} onClick={() => run(assigned ? removedMessage : `${student.name} est maintenant affecté(e) directement.`, async () => { await actions.setTeacherStudent({ teacherProfileId: account.profileId, studentId: student.id, assigned: !assigned }); setDirectStudentIds((current) => assigned ? current.filter((id) => id !== student.id) : [...current, student.id]); })} className={`rounded-full border px-3 py-1 text-sm ${assigned ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`} aria-pressed={assigned}>{student.name}</button>;
            })}
            {data.students.filter((student) => !account.schoolId || student.schoolId === account.schoolId).length === 0 && <p className="text-sm text-muted-foreground">Aucun élève de cette école.</p>}
          </div>
        </div>
      )}

      {open === "guardian" && account.studentId && (
        <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); void run("Parent lié.", async () => { const result = await actions.linkGuardian({ studentId: account.studentId as string, email }); setStatus(result.created ? (result.emailDelivered ? "Compte parent créé ; identifiants envoyés par e-mail." : "Compte parent créé ; l’e-mail n’a pas pu partir, réinitialisez le mot de passe pour obtenir les identifiants.") : "Parent existant lié à l’élève."); setOpen(null); }); }}>
          <label className="text-sm">E-mail du parent<br /><input type="email" required className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <Button type="submit" size="sm" disabled={busy}>Lier</Button>
        </form>
      )}

      {open === "role" && platformAdmin && (
        <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); void run(`Rôle changé : ${ROLE_LABELS[newRole] ?? newRole}.`, async () => { await actions.changeUserRole({ profileId: account.profileId, role: newRole, schoolId: newRole === "school_admin" || newRole === "teacher" ? newSchool || null : null }); setOpen(null); }); }}>
          <label className="text-sm">Nouveau rôle<br /><select className={inputClass} value={newRole} onChange={(event) => setNewRole(event.target.value)}>{Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {(newRole === "school_admin" || newRole === "teacher") && <label className="text-sm">École<br /><select className={inputClass} value={newSchool} onChange={(event) => setNewSchool(event.target.value)}><option value="">Aucune</option>{data.schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>}
          <Button type="submit" size="sm" disabled={busy || newRole === account.role}>Changer</Button>
        </form>
      )}
    </div>
  );
}
