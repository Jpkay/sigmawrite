"use client";

import Link from "next/link";
import { ArrowRight, Check, Feather } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { TurnstileChallenge, turnstileSiteKey } from "@/components/turnstile-challenge";
import { submitSchoolInquiry, type SchoolInquiryState } from "./actions";
import styles from "./schools.module.css";

type Language = "fr" | "en";

const initialState: SchoolInquiryState = { status: "idle", message: "" };

const copy = {
  fr: {
    nav: { home: "Accueil", how: "Comment ça marche", request: "Demander une proposition", login: "Se connecter" },
    hero: {
      kicker: "Plume pour les écoles et les organisations",
      title: "Chaque voix mérite les mots pour porter.",
      body: "Plume aide vos élèves à mieux comprendre le français, maîtriser la grammaire et formuler leurs idées avec précision — sans ajouter de préparation à vos équipes.",
      primary: "Équiper mon établissement",
      secondary: "J’ai déjà un code de classe",
    },
    model: {
      kicker: "Un déploiement accompagné",
      title: "Simple pour l’école. Utile dès la première classe.",
      steps: [
        ["01", "Parlez-nous de vos élèves", "Effectifs, niveaux, objectifs et calendrier : quelques informations suffisent pour préparer une proposition adaptée."],
        ["02", "Nous préparons votre espace", "Nous validons le cadre, créons l’établissement et accompagnons le premier administrateur."],
        ["03", "Vos équipes invitent les classes", "Les enseignants ajoutent leurs élèves avec des codes de classe et suivent les compétences qui progressent."],
      ],
    },
    form: {
      kicker: "Votre établissement",
      title: "Commençons par ce dont vos élèves ont besoin.",
      intro: "Cette demande ne crée pas encore de compte et ne vous engage à rien. Elle nous permet de préparer le bon déploiement.",
      fields: {
        organizationName: "Nom de l’établissement ou de l’organisation",
        organizationType: "Type d’organisation",
        country: "Pays",
        contactName: "Votre nom",
        contactRole: "Votre fonction",
        contactEmail: "E-mail professionnel",
        studentCount: "Nombre approximatif d’élèves",
        teacherCount: "Nombre d’enseignants (facultatif)",
        desiredStart: "Quand souhaitez-vous commencer ?",
        primaryNeed: "Votre besoin principal",
        message: "Quelque chose d’important à nous préciser ? (facultatif)",
      },
      organizationTypes: [
        ["school", "École ou établissement"], ["school_group", "Groupe scolaire"], ["tutoring_center", "Centre de soutien"], ["nonprofit", "Association / ONG"], ["other", "Autre organisation"],
      ],
      starts: [["asap", "Dès que possible"], ["next_term", "Au prochain trimestre"], ["next_school_year", "À la prochaine rentrée"], ["exploring", "Nous explorons les options"]],
      needs: [["grammar_writing", "Grammaire et expression écrite"], ["french_second_language", "Français langue seconde"], ["literacy", "Lecture et compréhension"], ["exam_prep", "Préparation aux examens"], ["other", "Autre besoin"]],
      submit: "Demander une proposition",
      pending: "Envoi en cours…",
      privacy: "Vos informations servent uniquement à répondre à cette demande.",
      successTitle: "Votre demande est entre de bonnes mains.",
      successBody: "Nous allons l’étudier et vous contacter pour définir la meilleure façon d’équiper vos élèves.",
      home: "Retour à l’accueil",
    },
    footer: "Le français pour dire ce que l’on veut dire.",
  },
  en: {
    nav: { home: "Home", how: "How it works", request: "Request a proposal", login: "Log in" },
    hero: {
      kicker: "Plume for schools and organisations",
      title: "Every voice deserves words that carry.",
      body: "Plume helps students understand French, master grammar, and express their ideas precisely — without adding preparation work for your team.",
      primary: "Bring Plume to my school",
      secondary: "I already have a class code",
    },
    model: {
      kicker: "Supported onboarding",
      title: "Simple for the school. Useful from the first class.",
      steps: [
        ["01", "Tell us about your students", "A few details about enrolment, levels, goals, and timing help us prepare the right proposal."],
        ["02", "We prepare your space", "We confirm the framework, create your organisation, and support its first administrator."],
        ["03", "Your team invites its classes", "Teachers add students with class codes and see which language skills are progressing."],
      ],
    },
    form: {
      kicker: "Your organisation",
      title: "Let’s start with what your students need.",
      intro: "This request does not create an account or commit you to anything. It helps us prepare the right rollout.",
      fields: {
        organizationName: "School or organisation name",
        organizationType: "Organisation type",
        country: "Country",
        contactName: "Your name",
        contactRole: "Your role",
        contactEmail: "Professional email",
        studentCount: "Approximate number of students",
        teacherCount: "Number of teachers (optional)",
        desiredStart: "When would you like to start?",
        primaryNeed: "Your main need",
        message: "Anything important we should know? (optional)",
      },
      organizationTypes: [["school", "School"], ["school_group", "School group"], ["tutoring_center", "Tutoring centre"], ["nonprofit", "Nonprofit / NGO"], ["other", "Other organisation"]],
      starts: [["asap", "As soon as possible"], ["next_term", "Next term"], ["next_school_year", "Next school year"], ["exploring", "We are exploring options"]],
      needs: [["grammar_writing", "Grammar and writing"], ["french_second_language", "French as a second language"], ["literacy", "Reading and comprehension"], ["exam_prep", "Exam preparation"], ["other", "Another need"]],
      submit: "Request a proposal",
      pending: "Sending…",
      privacy: "We only use your information to respond to this request.",
      successTitle: "Your request is in good hands.",
      successBody: "We’ll review it and contact you to define the best way to support your students.",
      home: "Back to the homepage",
    },
    footer: "French for saying what you mean.",
  },
} as const;

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <span className={styles.fieldError}>{errors[0]}</span> : null;
}

export function SchoolsMarketingPage() {
  const [language, setLanguage] = useState<Language>("fr");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(submitSchoolInquiry, initialState);
  const onCaptchaToken = useCallback((token: string | null) => setCaptchaToken(token), []);
  const text = copy[language];

  return (
    <div className={styles.root} lang={language}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Plume — accueil">
          <Feather aria-hidden="true" />
          <span>Plume<span>.</span></span>
        </Link>
        <nav className={styles.nav} aria-label={language === "fr" ? "Navigation principale" : "Main navigation"}>
          <Link href="/">{text.nav.home}</Link>
          <a href="#fonctionnement">{text.nav.how}</a>
          <a href="#demande">{text.nav.request}</a>
        </nav>
        <div className={styles.actions}>
          <div className={styles.language} aria-label="Language / Langue">
            {(["fr", "en"] as const).map((option) => (
              <button key={option} type="button" aria-pressed={language === option} onClick={() => setLanguage(option)}>{option.toUpperCase()}</button>
            ))}
          </div>
          <Link href="/login">{text.nav.login}</Link>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroOrbit} aria-hidden="true"><span /><span /><span /></div>
          <p className={styles.kicker}>{text.hero.kicker}</p>
          <h1>{text.hero.title}</h1>
          <p className={styles.heroBody}>{text.hero.body}</p>
          <div className={styles.heroButtons}>
            <a href="#demande" className={styles.primaryButton}>{text.hero.primary}<ArrowRight aria-hidden="true" /></a>
            <Link href="/join" className={styles.textButton}>{text.hero.secondary}</Link>
          </div>
        </section>

        <section id="fonctionnement" className={styles.model}>
          <div className={styles.modelIntro}>
            <p className={styles.kicker}>{text.model.kicker}</p>
            <h2>{text.model.title}</h2>
          </div>
          <ol>
            {text.model.steps.map(([number, title, body]) => (
              <li key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="demande" className={styles.request}>
          <div className={styles.requestIntro}>
            <p className={styles.kicker}>{text.form.kicker}</p>
            <h2>{text.form.title}</h2>
            <p>{text.form.intro}</p>
          </div>

          {state.status === "success" ? (
            <div className={styles.success} role="status">
              <span><Check aria-hidden="true" /></span>
              <h3>{text.form.successTitle}</h3>
              <p>{text.form.successBody}</p>
              <Link href="/">{text.form.home}<ArrowRight aria-hidden="true" /></Link>
            </div>
          ) : (
            <form action={formAction} className={styles.form}>
              <input type="hidden" name="language" value={language} />
              <input type="hidden" name="captchaToken" value={captchaToken ?? ""} />
              <label className={styles.honeypot} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>

              <label className={styles.full}>{text.form.fields.organizationName}<input name="organizationName" required minLength={2} autoComplete="organization" /><FieldError errors={state.errors?.organizationName} /></label>
              <label>{text.form.fields.organizationType}<select name="organizationType" required defaultValue="school">{text.form.organizationTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>{text.form.fields.country}<input name="country" required minLength={2} autoComplete="country-name" /><FieldError errors={state.errors?.country} /></label>
              <label>{text.form.fields.contactName}<input name="contactName" required minLength={2} autoComplete="name" /><FieldError errors={state.errors?.contactName} /></label>
              <label>{text.form.fields.contactRole}<input name="contactRole" required minLength={2} autoComplete="organization-title" /><FieldError errors={state.errors?.contactRole} /></label>
              <label className={styles.full}>{text.form.fields.contactEmail}<input name="contactEmail" type="email" required autoComplete="email" /><FieldError errors={state.errors?.contactEmail} /></label>
              <label>{text.form.fields.studentCount}<input name="studentCount" type="number" required min={1} max={100000} inputMode="numeric" /><FieldError errors={state.errors?.studentCount} /></label>
              <label>{text.form.fields.teacherCount}<input name="teacherCount" type="number" min={1} max={10000} inputMode="numeric" /><FieldError errors={state.errors?.teacherCount} /></label>
              <label>{text.form.fields.desiredStart}<select name="desiredStart" required defaultValue="exploring">{text.form.starts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>{text.form.fields.primaryNeed}<select name="primaryNeed" required defaultValue="grammar_writing">{text.form.needs.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className={styles.full}>{text.form.fields.message}<textarea name="message" rows={5} maxLength={2000} /></label>
              <div className={styles.full}><TurnstileChallenge action="school_inquiry" onToken={onCaptchaToken} /></div>

              {state.status === "error" ? <p className={`${styles.formMessage} ${styles.full}`} role="alert">{state.message}</p> : null}
              <div className={`${styles.submitRow} ${styles.full}`}>
                <button type="submit" disabled={pending || Boolean(turnstileSiteKey && !captchaToken)}>{pending ? text.form.pending : text.form.submit}<ArrowRight aria-hidden="true" /></button>
                <p>{text.form.privacy}</p>
              </div>
            </form>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerBrand}>Plume<span>.</span></Link>
        <p>{text.footer}</p>
        <div><Link href="/privacy">{language === "fr" ? "Confidentialité" : "Privacy"}</Link><Link href="/terms">{language === "fr" ? "Conditions" : "Terms"}</Link></div>
      </footer>
    </div>
  );
}
