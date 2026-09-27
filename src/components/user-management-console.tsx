"use client";

import { useEffect, useState } from "react";
import { schoolGradeLabel } from "@/lib/school-grade";
import { Check, Copy, UserPlus } from "lucide-react";
import { AccountRow } from "@/components/account-row";
import { assignStudentAccess, attachEmailToAccount, changeUserRole, createManagedUser, linkGuardian, resetManagedUserPassword, rotateSchoolTeacherCode, setTeacherClass, setTeacherStudent, setUserDeactivated } from "@/lib/actions/users";
import type { UserManagementData } from "@/lib/db/users";
import type { ManagedAccountRole } from "@/lib/user-provisioning";
import { isMissingServerActionError } from "@/lib/server-action-recovery";
import { Button } from "@/components/ui/button";

type VisibleCredentials = {
  label: string;
  username: string;
  temporaryPassword: string;
  email: string | null;
  emailDelivered: boolean;
};

const inputClass = "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const draftKey = "plume-admin-users-retry-draft-v1";

function CredentialsNotice({ credentials }: { credentials: VisibleCredentials }) {
  const [copied, setCopied] = useState(false);
  const text = `${credentials.username}\n${credentials.temporaryPassword}`;
  return (
    <div role="status" className="border-y border-primary/30 bg-accent/40 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Identifiants temporaires · {credentials.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {credentials.emailDelivered ? `Une copie a été envoyée à ${credentials.email}.` : "Copiez-les maintenant et transmettez-les par un canal sécurisé."} Le mot de passe devra être remplacé à la première connexion.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); }}>
          {copied ? <Check /> : <Copy />} {copied ? "Copié" : "Copier"}
        </Button>
      </div>
      <div className="mt-3 grid gap-1 font-mono text-sm sm:grid-cols-2">
        <p><span className="font-sans text-xs text-muted-foreground">Utilisateur</span><br />{credentials.username}</p>
        <p><span className="font-sans text-xs text-muted-foreground">Mot de passe temporaire</span><br />{credentials.temporaryPassword}</p>
      </div>
    </div>
  );
}

export function UserManagementConsole({ data, initialRole = "student", initialSchoolId = "" }: { data: UserManagementData; initialRole?: ManagedAccountRole; initialSchoolId?: string }) {
  const [role, setRole] = useState<ManagedAccountRole>(initialRole);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState(7);
  const [schoolId, setSchoolId] = useState(initialSchoolId);
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<VisibleCredentials | null>(null);
  const [assignmentStudentId, setAssignmentStudentId] = useState(data.students[0]?.id ?? "");
  const [assignmentClassId, setAssignmentClassId] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const missingAction = isMissingServerActionError(error);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      sessionStorage.removeItem(draftKey);
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (draft.viewerRole !== data.viewerRole || draft.viewerSchoolId !== data.viewerSchoolId) return;
      // Restore after hydration: a saved role changes the form's server-rendered shape.
      const timeout = window.setTimeout(() => {
        if (["student", "teacher", "parent", "supervisor", "school_admin"].includes(draft.role)) setRole(draft.role);
        if (typeof draft.displayName === "string") setDisplayName(draft.displayName);
        if (typeof draft.username === "string") setUsername(draft.username);
        if (typeof draft.email === "string") setEmail(draft.email);
        if (typeof draft.grade === "number") setGrade(draft.grade);
        if (typeof draft.schoolId === "string") setSchoolId(draft.schoolId);
        if (typeof draft.classId === "string") setClassId(draft.classId);
        if (typeof draft.teacherId === "string") setTeacherId(draft.teacherId);
        if (typeof draft.selectedStudentId === "string") setSelectedStudentId(draft.selectedStudentId);
        if (typeof draft.assignmentStudentId === "string") setAssignmentStudentId(draft.assignmentStudentId);
        if (typeof draft.assignmentClassId === "string") setAssignmentClassId(draft.assignmentClassId);
      }, 0);
      return () => window.clearTimeout(timeout);
    } catch {
      // Storage may be disabled; the page can still be refreshed safely.
    }
  }, [data.viewerRole, data.viewerSchoolId]);

  function reloadAfterMissingAction() {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({
        viewerRole: data.viewerRole, viewerSchoolId: data.viewerSchoolId,
        role, displayName, username, email, grade, schoolId, classId,
        teacherId, selectedStudentId, assignmentStudentId, assignmentClassId,
      }));
    } catch {
      // Continue with a fresh page even when session storage is unavailable.
    }
    window.location.reload();
  }
  const teacherSchoolId = role === "teacher" ? (data.viewerSchoolId ?? schoolId) : null;
  const creationClasses = role === "teacher"
    ? teacherSchoolId ? data.classes.filter((selectedClass) => selectedClass.schoolId === teacherSchoolId) : []
    : role === "supervisor" && schoolId ? data.classes.filter((selectedClass) => selectedClass.schoolId === schoolId) : data.classes;
  const directStudents = role === "teacher"
    ? teacherSchoolId ? data.students.filter((student) => student.schoolId === teacherSchoolId) : []
    : role === "supervisor" && schoolId ? data.students.filter((student) => student.schoolId === schoolId) : data.students;
  const assignmentStudentSchoolId = data.students.find((student) => student.id === assignmentStudentId)?.schoolId ?? null;
  const assignmentClasses = assignmentStudentSchoolId
    ? data.classes.filter((selectedClass) => selectedClass.schoolId === assignmentStudentSchoolId)
    : [];

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setCredentials(null);
    try {
      const result = await createManagedUser({
        role,
        displayName,
        username,
        email,
        grade: role === "student" ? grade : null,
        schoolIds: (role === "supervisor" || role === "school_admin" || (role === "teacher" && data.viewerRole === "platform_admin")) && schoolId ? [schoolId] : [],
        classIds: classId ? [classId] : [],
        teacherIds: role === "student" && teacherId ? [teacherId] : [],
        studentIds: (role === "supervisor" || role === "teacher") && selectedStudentId ? [selectedStudentId] : [],
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCredentials({
        label: displayName,
        username: result.username,
        temporaryPassword: result.temporaryPassword,
        email: result.email,
        emailDelivered: result.emailDelivered,
      });
      setDisplayName(""); setUsername(""); setEmail("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Le compte n’a pas pu être créé.");
    } finally { setBusy(false); }
  }

  async function resetPassword(account: UserManagementData["accounts"][number]) {
    setBusy(true); setError(""); setCredentials(null);
    try {
      const result = await resetManagedUserPassword({ profileId: account.profileId });
      setCredentials({ label: account.displayName, username: result.username, temporaryPassword: result.temporaryPassword, email: result.email, emailDelivered: result.emailDelivered });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Réinitialisation impossible."); }
    finally { setBusy(false); }
  }

  async function assignExisting(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setAssignmentMessage(""); setError("");
    try {
      await assignStudentAccess({ studentId: assignmentStudentId, classId: assignmentClassId, teacherProfileId: null });
      setAssignmentMessage("Inscription à la classe enregistrée. Les affectations directes se gèrent séparément sur chaque enseignant.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Affectation impossible."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-10">
      <section className="border-t border-border pt-7">
        <div className="mb-5 flex items-center gap-3"><UserPlus className="size-5 text-primary" /><div><h2 className="text-lg font-semibold">Créer ou inviter un utilisateur</h2><p className="text-sm text-muted-foreground">L’e-mail est facultatif. Un nom d’utilisateur et un mot de passe temporaire sont toujours fournis.</p></div></div>
        <form onSubmit={createAccount} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm">Rôle<select className={inputClass} value={role} onChange={(event) => { setRole(event.target.value as ManagedAccountRole); setClassId(""); setTeacherId(""); setSelectedStudentId(""); }}><option value="student">Élève</option><option value="teacher">Enseignant</option><option value="parent">Parent</option>{data.viewerRole === "platform_admin" && <option value="supervisor">Superviseur</option>}{data.viewerRole === "platform_admin" && <option value="school_admin">Administrateur d’établissement</option>}</select></label>
          <label className="text-sm">Nom complet<input className={inputClass} required minLength={2} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
          <label className="text-sm">Nom d’utilisateur <span className="text-muted-foreground">(facultatif)</span><input className={inputClass} pattern="[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} placeholder="Généré automatiquement" /></label>
          <label className="text-sm">E-mail <span className="text-muted-foreground">{role === "parent" || role === "school_admin" ? "(requis)" : "(facultatif)"}</span><input className={inputClass} type="email" required={role === "parent" || role === "school_admin"} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {role === "student" && <label className="text-sm">Classe scolaire<input className={inputClass} type="number" min={5} max={12} required value={grade} onChange={(event) => setGrade(Number(event.target.value))} /><span className="mt-1 block text-xs text-muted-foreground">{schoolGradeLabel(grade)}</span></label>}
          {role === "school_admin" && <label className="text-sm">École administrée<select className={inputClass} required value={schoolId} onChange={(event) => { setSchoolId(event.target.value); setClassId(""); setSelectedStudentId(""); }}><option value="">Choisir une école</option>{data.schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>}
          {role === "teacher" && data.viewerRole === "platform_admin" && <label className="text-sm">École de l’enseignant<select className={inputClass} required value={schoolId} onChange={(event) => { setSchoolId(event.target.value); setClassId(""); setSelectedStudentId(""); }}><option value="">Choisir une école</option>{data.schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>}
          {role === "supervisor" && <label className="text-sm">École supervisée<select className={inputClass} value={schoolId} onChange={(event) => { setSchoolId(event.target.value); setClassId(""); setSelectedStudentId(""); }}><option value="">Aucune</option>{data.schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>}
          {role !== "parent" && role !== "school_admin" && <label className="text-sm">{role === "teacher" ? "Classe enseignée" : role === "supervisor" ? "Classe suivie (facultatif)" : "Classe"}<select className={inputClass} required={role === "student"} value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">Aucune</option>{creationClasses.map((selectedClass) => <option key={selectedClass.id} value={selectedClass.id}>{selectedClass.name}</option>)}</select></label>}
          {role === "student" && <label className="text-sm">Enseignant direct <span className="text-muted-foreground">(facultatif)</span><select className={inputClass} value={teacherId} onChange={(event) => setTeacherId(event.target.value)}><option value="">Aucun</option>{data.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>}
          {(role === "supervisor" || role === "teacher") && <label className="text-sm">{role === "teacher" ? "Élève affecté directement" : "Élève suivi"} <span className="text-muted-foreground">(facultatif)</span><select className={inputClass} value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}><option value="">Aucun</option>{directStudents.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>}
          {role === "student" && <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-3">L’affectation à la classe active immédiatement l’accès de l’élève.</p>}
          {error && (missingAction ? (
            <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive md:col-span-2 xl:col-span-3">
              <p>La page a été mise à jour depuis son ouverture. Actualisez-la puis réessayez.</p>
              <Button type="button" variant="outline" onClick={reloadAfterMissingAction}>Actualiser la page</Button>
            </div>
          ) : <p role="alert" className="text-sm text-destructive md:col-span-2 xl:col-span-3">{error}</p>)}
          <div className="md:col-span-2 xl:col-span-3"><Button disabled={busy}>{busy ? "Création…" : email ? "Créer et envoyer les identifiants" : "Créer les identifiants"}</Button></div>
        </form>
        {credentials && <div className="mt-6"><CredentialsNotice credentials={credentials} /></div>}
      </section>

      <section className="border-t border-border pt-7">
        <h2 className="text-lg font-semibold">Affecter un élève existant</h2>
        <p className="mt-1 text-sm text-muted-foreground">Cette action inscrit l’élève à une classe de sa propre école. Elle ne crée ni ne retire aucun lien direct avec un enseignant.</p>
        <form onSubmit={assignExisting} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm">Élève<select className={inputClass} required value={assignmentStudentId} onChange={(event) => { setAssignmentStudentId(event.target.value); setAssignmentClassId(""); }}>{data.students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
          <label className="text-sm">Classe<select className={inputClass} required value={assignmentClassId} onChange={(event) => setAssignmentClassId(event.target.value)}><option value="">Choisir une classe</option>{assignmentClasses.map((selectedClass) => <option key={selectedClass.id} value={selectedClass.id}>{selectedClass.name}</option>)}</select></label>
          <div className="flex items-center gap-3 md:col-span-2"><Button type="submit" variant="outline" disabled={busy || !assignmentStudentId || !assignmentClassId}>Inscrire à la classe</Button>{assignmentMessage && <p role="status" className="text-sm text-success">{assignmentMessage}</p>}</div>
        </form>
      </section>

      <section className="border-t border-border pt-7">
        <h2 className="text-lg font-semibold">Code enseignant de l’école</h2>
        <p className="mt-1 text-sm text-muted-foreground">Un enseignant qui s’inscrit lui-même doit saisir le code valide de son école. L’administration peut aussi créer son compte ici et lui transmettre des identifiants temporaires.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.schools.map((school) => <div key={school.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"><span className="font-medium">{school.name}</span><span className="font-mono">{school.teacherCode ?? "aucun code"}</span><Button type="button" size="sm" variant="outline" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { const result = await rotateSchoolTeacherCode({ schoolId: school.id }); setAssignmentMessage(`Nouveau code pour ${school.name} : ${result.code}`); } catch (caught) { setError(caught instanceof Error ? caught.message : "Rotation impossible."); } finally { setBusy(false); } }}>{school.teacherCode ? "Renouveler" : "Générer"}</Button></div>)}
        </div>
      </section>

      <section className="border-t border-border pt-7">
        <h2 className="text-lg font-semibold">Comptes gérés</h2>
        <p className="mt-1 text-sm text-muted-foreground">{data.accounts.length} compte(s){data.viewerSchoolId ? " de votre école" : ""}. Chaque action est journalisée.</p>
        <div className="mt-4 divide-y divide-border border-y border-border">
          {data.accounts.map((account) => <AccountRow key={account.profileId} account={account} data={data} busy={busy} onBusy={setBusy} onError={setError} onCredentials={(value) => setCredentials(value)} onResetPassword={() => resetPassword(account)} actions={{ setTeacherClass, setTeacherStudent, changeUserRole, setUserDeactivated, attachEmailToAccount, linkGuardian }} />)}
          {!data.accounts.length && <p className="py-5 text-sm text-muted-foreground">Aucun compte géré.</p>}
        </div>
      </section>
    </div>
  );
}
