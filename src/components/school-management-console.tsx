"use client";

import Link from "next/link";
import { schoolGradeLabel } from "@/lib/school-grade";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Building2, Plus, Save, School, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSchool, createSchoolClass, updateSchool, updateSchoolClass } from "@/lib/actions/schools";
import type { SchoolManagementClass, SchoolManagementData, SchoolManagementSchool } from "@/lib/db/schools";

const inputClass = "mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function SchoolEditor({ school, accountsHref, accountsLabel }: { school: SchoolManagementSchool; accountsHref: string; accountsLabel: string }) {
  const router = useRouter();
  const [name, setName] = useState(school.name);
  const [city, setCity] = useState(school.city ?? "");
  const [country, setCountry] = useState(school.country ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await updateSchool({ schoolId: school.id, name, city, country });
      setMessage("Établissement enregistré");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mise à jour impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-border pb-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{school.organizationName ?? "Établissement"}</p><h3 className="mt-1 text-xl font-semibold">{school.name}</h3></div>
        <Button asChild variant="outline" size="sm"><Link href={accountsHref}><Users />{accountsLabel}</Link></Button>
      </div>
      <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-[minmax(12rem,1.4fr)_minmax(9rem,1fr)_minmax(9rem,1fr)_auto] md:items-end">
        <label className="text-sm">Nom<input className={inputClass} required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="text-sm">Ville <span className="text-muted-foreground">(facultatif)</span><input className={inputClass} maxLength={120} value={city} onChange={(event) => setCity(event.target.value)} /></label>
        <label className="text-sm">Pays <span className="text-muted-foreground">(facultatif)</span><input className={inputClass} maxLength={120} value={country} onChange={(event) => setCountry(event.target.value)} /></label>
        <Button type="submit" size="sm" variant="outline" disabled={busy}><Save />{busy ? "Enregistrement…" : "Enregistrer"}</Button>
        {(message || error) && <p role={error ? "alert" : "status"} className={`text-sm md:col-span-4 ${error ? "text-destructive" : "text-success"}`}>{error || message}</p>}
      </form>
    </div>
  );
}

function ClassEditor({ selectedClass }: { selectedClass: SchoolManagementClass }) {
  const router = useRouter();
  const [name, setName] = useState(selectedClass.name);
  const [gradeLevel, setGradeLevel] = useState(selectedClass.gradeLevel ?? 7);
  const [academicYear, setAcademicYear] = useState(selectedClass.academicYear ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await updateSchoolClass({ classId: selectedClass.id, name, gradeLevel, academicYear });
      setMessage("Enregistré");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mise à jour impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 py-4 md:grid-cols-[minmax(12rem,1.6fr)_7rem_minmax(9rem,1fr)_auto] md:items-end">
      <label className="text-sm">Nom<input className={inputClass} required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="text-sm">Classe scolaire<input className={inputClass} required type="number" min={5} max={12} value={gradeLevel} onChange={(event) => setGradeLevel(Number(event.target.value))} /><span className="mt-1 block text-xs text-muted-foreground">{schoolGradeLabel(gradeLevel)}</span></label>
      <label className="text-sm">Année scolaire<input className={inputClass} required minLength={4} maxLength={20} placeholder="2026–2027" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} /></label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" variant="outline" disabled={busy}><Save />{busy ? "Enregistrement…" : "Enregistrer"}</Button>
        <Button asChild size="sm" variant="outline"><Link href={`/admin/schools/classes/${selectedClass.id}/invitations`}>Inviter des élèves <ArrowRight /></Link></Button>
      </div>
      {(message || error) && <p role={error ? "alert" : "status"} className={`text-sm md:col-span-4 ${error ? "text-destructive" : "text-success"}`}>{error || message}</p>}
    </form>
  );
}

export function SchoolManagementConsole({ data }: { data: SchoolManagementData }) {
  const router = useRouter();
  const [selectedSchoolId, setSelectedSchoolId] = useState(data.viewerSchoolId ?? data.schools[0]?.id ?? "");
  const selectedSchool = data.schools.find((school) => school.id === selectedSchoolId) ?? data.schools[0] ?? null;
  const [organizationChoice, setOrganizationChoice] = useState(data.organizations[0]?.id ?? "new");
  const [organizationName, setOrganizationName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [curriculumType, setCurriculumType] = useState<"national" | "french" | "ib" | "cambridge" | "other">("national");
  const [className, setClassName] = useState("");
  const [classGrade, setClassGrade] = useState(7);
  const [classYear, setClassYear] = useState("2026–2027");
  const [busy, setBusy] = useState<"school" | "class" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdSchoolId, setCreatedSchoolId] = useState<string | null>(null);

  async function submitSchool(event: React.FormEvent) {
    event.preventDefault();
    setBusy("school");
    setMessage("");
    setError("");
    setCreatedSchoolId(null);
    try {
      const result = await createSchool({
        schoolName,
        organizationId: organizationChoice === "new" ? null : organizationChoice,
        organizationName: organizationChoice === "new" ? organizationName : null,
        city,
        country,
        curriculumType,
      });
      setCreatedSchoolId(result.schoolId);
      setSelectedSchoolId(result.schoolId);
      setSchoolName("");
      setOrganizationName("");
      setCity("");
      setMessage("Établissement créé. Vous pouvez maintenant nommer son administrateur et ajouter ses classes.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Création impossible.");
    } finally {
      setBusy(null);
    }
  }

  async function submitClass(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedSchool) return;
    setBusy("class");
    setMessage("");
    setError("");
    try {
      await createSchoolClass({ schoolId: selectedSchool.id, name: className, gradeLevel: classGrade, academicYear: classYear });
      setClassName("");
      setMessage(`Classe ajoutée à ${selectedSchool.name}.`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Création impossible.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-10">
      {data.viewerRole === "platform_admin" && (
        <section className="border-y border-border py-7">
          <div className="mb-5 flex items-start gap-3">
            <Building2 className="mt-0.5 size-5 text-primary" />
            <div><h2 className="text-lg font-semibold">Créer un établissement</h2><p className="mt-1 text-sm text-muted-foreground">Rattachez-le à une organisation existante ou créez son organisation en même temps.</p></div>
          </div>
          <form onSubmit={submitSchool} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm">Organisation<select className={inputClass} value={organizationChoice} onChange={(event) => setOrganizationChoice(event.target.value)}>{data.organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}<option value="new">Nouvelle organisation</option></select></label>
            {organizationChoice === "new" && <label className="text-sm">Nom de la nouvelle organisation<input className={inputClass} required minLength={2} maxLength={160} value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} /></label>}
            <label className="text-sm">Nom de l’établissement<input className={inputClass} required minLength={2} maxLength={120} value={schoolName} onChange={(event) => setSchoolName(event.target.value)} /></label>
            <label className="text-sm">Ville <span className="text-muted-foreground">(facultatif)</span><input className={inputClass} maxLength={120} value={city} onChange={(event) => setCity(event.target.value)} /></label>
            <label className="text-sm">Pays <span className="text-muted-foreground">(facultatif)</span><input className={inputClass} maxLength={120} value={country} onChange={(event) => setCountry(event.target.value)} /></label>
            <label className="text-sm">Programme<select className={inputClass} value={curriculumType} onChange={(event) => setCurriculumType(event.target.value as typeof curriculumType)}><option value="national">Programme national</option><option value="french">Programme français</option><option value="ib">Baccalauréat international</option><option value="cambridge">Cambridge</option><option value="other">Autre</option></select></label>
            <div className="flex items-center gap-3 md:col-span-2 xl:col-span-3"><Button disabled={busy === "school"}><Plus />{busy === "school" ? "Création…" : "Créer l’établissement"}</Button></div>
          </form>
          {createdSchoolId && <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" href={`/admin/users?role=school_admin&schoolId=${encodeURIComponent(createdSchoolId)}`}>Nommer l’administrateur de cet établissement <ArrowRight className="size-4" /></Link>}
        </section>
      )}

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-3"><School className="mt-0.5 size-5 text-primary" /><div><h2 className="text-lg font-semibold">Établissements et classes</h2><p className="mt-1 text-sm text-muted-foreground">Les changements de classe restent limités au nom, au niveau et à l’année scolaire.</p></div></div>
          <span className="text-sm text-muted-foreground">{data.schools.length} établissement{data.schools.length === 1 ? "" : "s"}</span>
        </div>

        {data.schools.length === 0 ? (
          <p className="border-y border-border py-5 text-sm text-muted-foreground">Aucun établissement accessible.</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(13rem,.38fr)_minmax(0,1fr)]">
            {data.schools.length > 1 && <nav aria-label="Établissements" className="divide-y divide-border border-y border-border">{data.schools.map((school) => <button key={school.id} type="button" onClick={() => { setSelectedSchoolId(school.id); setMessage(""); setError(""); }} className={`w-full px-1 py-4 text-left transition-colors ${selectedSchool?.id === school.id ? "text-primary" : "text-foreground hover:text-primary"}`}><span className="block text-sm font-semibold">{school.name}</span><span className="mt-1 block text-xs text-muted-foreground">{school.organizationName ?? "Sans organisation"} · {school.classes.length} classe{school.classes.length === 1 ? "" : "s"}</span></button>)}</nav>}

            {selectedSchool && <div className={data.schools.length === 1 ? "lg:col-span-2" : ""}>
              <SchoolEditor
                key={selectedSchool.id}
                school={selectedSchool}
                accountsHref={data.viewerRole === "platform_admin" ? `/admin/users?role=school_admin&schoolId=${encodeURIComponent(selectedSchool.id)}` : `/admin/users?schoolId=${encodeURIComponent(selectedSchool.id)}`}
                accountsLabel={data.viewerRole === "platform_admin" ? "Nommer un administrateur" : "Gérer les comptes"}
              />

              <form onSubmit={submitClass} className="grid gap-3 border-b border-border py-5 md:grid-cols-[minmax(12rem,1.6fr)_7rem_minmax(9rem,1fr)_auto] md:items-end">
                <label className="text-sm">Nouvelle classe<input className={inputClass} required minLength={2} maxLength={100} placeholder="5e A" value={className} onChange={(event) => setClassName(event.target.value)} /></label>
                <label className="text-sm">Classe scolaire<input className={inputClass} required type="number" min={5} max={12} value={classGrade} onChange={(event) => setClassGrade(Number(event.target.value))} /><span className="mt-1 block text-xs text-muted-foreground">{schoolGradeLabel(classGrade)}</span></label>
                <label className="text-sm">Année scolaire<input className={inputClass} required minLength={4} maxLength={20} value={classYear} onChange={(event) => setClassYear(event.target.value)} /></label>
                <Button type="submit" size="sm" disabled={busy === "class"}><Plus />{busy === "class" ? "Ajout…" : "Ajouter"}</Button>
              </form>

              <div className="divide-y divide-border border-b border-border">
                {selectedSchool.classes.map((selectedClass) => <ClassEditor key={selectedClass.id} selectedClass={selectedClass} />)}
                {selectedSchool.classes.length === 0 && <p className="py-5 text-sm text-muted-foreground">Aucune classe. Ajoutez la première ci-dessus.</p>}
              </div>
            </div>}
          </div>
        )}
        {(message || error) && <p role={error ? "alert" : "status"} className={`mt-4 text-sm ${error ? "text-destructive" : "text-success"}`}>{error || message}</p>}
      </section>
    </div>
  );
}
