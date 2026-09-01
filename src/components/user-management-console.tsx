"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, UserPlus } from "lucide-react";
import { assignStudentAccess, createManagedUser, resetManagedUserPassword } from "@/lib/actions/users";
import type { UserManagementData } from "@/lib/db/users";
import type { ManagedAccountRole } from "@/lib/user-provisioning";
import type { FeedbackAgreementSource } from "@/lib/diagnostic/pilot-enrollment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type VisibleCredentials = {
  label: string;
  username: string;
  temporaryPassword: string;
  email: string | null;
  emailDelivered: boolean;
  feedbackPilotExpiresAt?: string | null;
};

const inputClass = "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

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
          {credentials.feedbackPilotExpiresAt && <p className="mt-1 text-sm text-muted-foreground">Pilote de feedback actif jusqu’au {new Date(credentials.feedbackPilotExpiresAt).toLocaleDateString("fr-FR")}.</p>}
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

export function UserManagementConsole({ data }: { data: UserManagementData }) {
  const [role, setRole] = useState<ManagedAccountRole>("student");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [grade, setGrade] = useState(7);
  const [schoolId, setSchoolId] = useState("");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [supervisedStudentId, setSupervisedStudentId] = useState("");
  const [feedbackPilot, setFeedbackPilot] = useState(false);
  const [feedbackAgreementSource, setFeedbackAgreementSource] = useState<FeedbackAgreementSource>("student");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<VisibleCredentials | null>(null);
  const [assignmentStudentId, setAssignmentStudentId] = useState(data.students[0]?.id ?? "");
  const [assignmentClassId, setAssignmentClassId] = useState("");
  const [assignmentTeacherId, setAssignmentTeacherId] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState("");

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setCredentials(null);
    try {
      const result = await createManagedUser({
        role,
        displayName,
        username,
        email,
        dateOfBirth: role === "student" ? dateOfBirth : "",
        grade: role === "student" ? grade : null,
        schoolIds: role === "supervisor" && schoolId ? [schoolId] : [],
        classIds: classId ? [classId] : [],
        teacherIds: role === "student" && teacherId ? [teacherId] : [],
        studentIds: role === "supervisor" && supervisedStudentId ? [supervisedStudentId] : [],
        feedbackPilot: role === "student" && feedbackPilot ? {
          agreementSource: feedbackAgreementSource,
          agreementConfirmed: true as const,
          agreedAt: new Date().toISOString(),
          durationDays: 30,
        } : null,
      });
      setCredentials({
        label: displayName,
        username: result.username,
        temporaryPassword: result.temporaryPassword,
        email: result.email,
        emailDelivered: result.emailDelivered,
        feedbackPilotExpiresAt: result.feedbackPilotEnrollment?.expiresAt ?? null,
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
      await assignStudentAccess({ studentId: assignmentStudentId, classId: assignmentClassId, teacherProfileId: assignmentTeacherId || null });
      setAssignmentMessage("Affectation enregistrée.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Affectation impossible."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-10">
      <section className="border-t border-border pt-7">
        <div className="mb-5 flex items-center gap-3"><UserPlus className="size-5 text-primary" /><div><h2 className="text-lg font-semibold">Créer ou inviter un utilisateur</h2><p className="text-sm text-muted-foreground">L’e-mail est facultatif. Un nom d’utilisateur et un mot de passe temporaire sont toujours fournis.</p></div></div>
        <form onSubmit={createAccount} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm">Rôle<select className={inputClass} value={role} onChange={(event) => setRole(event.target.value as ManagedAccountRole)}><option value="student">Élève</option><option value="teacher">Enseignant</option><option value="supervisor">Superviseur</option></select></label>
          <label className="text-sm">Nom complet<input className={inputClass} required minLength={2} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
          <label className="text-sm">Nom d’utilisateur <span className="text-muted-foreground">(facultatif)</span><input className={inputClass} pattern="[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} placeholder="Généré automatiquement" /></label>
          <label className="text-sm">E-mail <span className="text-muted-foreground">(facultatif)</span><input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {role === "student" && <><label className="text-sm">Date de naissance<input className={inputClass} type="date" required value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} /></label><label className="text-sm">Niveau<input className={inputClass} type="number" min={5} max={12} required value={grade} onChange={(event) => setGrade(Number(event.target.value))} /></label></>}
          {role === "supervisor" && <label className="text-sm">École supervisée<select className={inputClass} value={schoolId} onChange={(event) => setSchoolId(event.target.value)}><option value="">Aucune</option>{data.schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>}
          <label className="text-sm">{role === "teacher" ? "Classe enseignée" : role === "supervisor" ? "Classe suivie (facultatif)" : "Classe"}<select className={inputClass} required={role === "student"} value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">Aucune</option>{data.classes.map((selectedClass) => <option key={selectedClass.id} value={selectedClass.id}>{selectedClass.name}</option>)}</select></label>
          {role === "student" && <label className="text-sm">Enseignant direct <span className="text-muted-foreground">(facultatif)</span><select className={inputClass} value={teacherId} onChange={(event) => setTeacherId(event.target.value)}><option value="">Aucun</option>{data.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>}
          {role === "supervisor" && <label className="text-sm">Élève suivi <span className="text-muted-foreground">(facultatif)</span><select className={inputClass} value={supervisedStudentId} onChange={(event) => setSupervisedStudentId(event.target.value)}><option value="">Aucun</option>{data.students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>}
          {role === "student" && <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-3">L’affectation à la classe active immédiatement l’accès de l’élève.</p>}
          {role === "student" && <div className="space-y-3 border-y border-border py-4 md:col-span-2 xl:col-span-3"><label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={feedbackPilot} onChange={(event) => setFeedbackPilot(event.target.checked)} /><span><span className="font-medium">Inscrire au pilote de feedback pendant 30 jours</span><span className="mt-1 block text-muted-foreground">J’atteste que l’accord volontaire indiqué ci-dessous a été obtenu. Cet accord est distinct de l’accès scolaire normal.</span></span></label>{feedbackPilot && <label className="block max-w-sm text-sm">Accord donné par<select className={inputClass} value={feedbackAgreementSource} onChange={(event) => setFeedbackAgreementSource(event.target.value as FeedbackAgreementSource)}><option value="student">L’élève (15 ans ou plus)</option><option value="guardian">Le responsable de l’élève</option></select></label>}</div>}
          {error && <p role="alert" className="text-sm text-destructive md:col-span-2 xl:col-span-3">{error}</p>}
          <div className="md:col-span-2 xl:col-span-3"><Button disabled={busy}>{busy ? "Création…" : email ? "Créer et envoyer les identifiants" : "Créer les identifiants"}</Button></div>
        </form>
        {credentials && <div className="mt-6"><CredentialsNotice credentials={credentials} /></div>}
      </section>

      <section className="border-t border-border pt-7">
        <h2 className="text-lg font-semibold">Affecter un élève existant</h2>
        <p className="mt-1 text-sm text-muted-foreground">La classe est requise : son invitation active immédiatement l’accès. Un enseignant direct peut aussi être associé.</p>
        <form onSubmit={assignExisting} className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="text-sm">Élève<select className={inputClass} required value={assignmentStudentId} onChange={(event) => setAssignmentStudentId(event.target.value)}>{data.students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
          <label className="text-sm">Classe<select className={inputClass} required value={assignmentClassId} onChange={(event) => setAssignmentClassId(event.target.value)}><option value="">Choisir une classe</option>{data.classes.map((selectedClass) => <option key={selectedClass.id} value={selectedClass.id}>{selectedClass.name}</option>)}</select></label>
          <label className="text-sm">Enseignant<select className={inputClass} value={assignmentTeacherId} onChange={(event) => setAssignmentTeacherId(event.target.value)}><option value="">Aucun</option>{data.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>
          <div className="flex items-center gap-3 md:col-span-3"><Button type="submit" variant="outline" disabled={busy || !assignmentStudentId || !assignmentClassId}>Enregistrer l’affectation</Button>{assignmentMessage && <p role="status" className="text-sm text-success">{assignmentMessage}</p>}</div>
        </form>
      </section>

      <section className="border-t border-border pt-7">
        <h2 className="text-lg font-semibold">Comptes gérés</h2>
        <div className="mt-4 divide-y divide-border border-y border-border">
          {data.accounts.map((account) => <div key={account.profileId} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{account.displayName}</p><Badge variant="secondary">{account.role === "student" ? "Élève" : account.role === "teacher" ? "Enseignant" : "Superviseur"}</Badge>{account.feedbackPilotActive && <Badge variant="success">Pilote feedback</Badge>}{account.mustChangePassword && <Badge>Mot de passe à changer</Badge>}</div><p className="mt-1 font-mono text-xs text-muted-foreground">{account.username}</p></div><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => resetPassword(account)}><KeyRound /> Nouveau mot de passe temporaire</Button></div>)}
          {!data.accounts.length && <p className="py-5 text-sm text-muted-foreground">Aucun compte géré.</p>}
        </div>
      </section>
    </div>
  );
}
