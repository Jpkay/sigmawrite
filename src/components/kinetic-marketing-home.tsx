"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, Feather } from "lucide-react";
import { useState } from "react";
import styles from "./kinetic-marketing-home.module.css";

type Language = "fr" | "en";

const content = {
  fr: {
    nav: {
      method: "Comment ça marche",
      support: "Ce que Plume travaille",
      schools: "Écoles",
      parents: "Parents",
      privacy: "Confidentialité",
      login: "Se connecter",
      start: "Commencer",
    },
    hero: {
      kicker: "Tes idées comptent déjà.",
      headline: ["Trouve", "ta", "plume."],
      lead: "Ne laisse personne choisir tes mots à ta place.",
      body: "Plume t’aide à lire entre les lignes et à trouver les mots justes pour te faire entendre.",
      cta: "Commencer par ce qui compte pour moi",
      discover: "Voir comment Plume m’aide",
      imageAlt:
        "Trois élèves échangent devant un tableau couvert de formules",
      imageCaption: "Tes idées. Tes mots. Ta voix.",
    },
    ribbon: [
      "grammaire",
      "vocabulaire",
      "nuance",
      "formulation",
      "argument",
      "voix",
    ],
    progression: {
      eyebrow: "Le chemin",
      title: "La langue devient un outil.",
      steps: [
        "Lire entre les lignes",
        "Comprendre comment la langue fonctionne",
        "Trouver les mots justes",
        "Te faire entendre",
      ],
    },
    support: {
      eyebrow: "Un haut niveau. Le soutien pour l’atteindre.",
      title: "Ta voix compte. Donne-lui les mots qu’elle mérite.",
      body: "Plume t’aide à donner forme à ce que tu veux dire : une explication claire pour comprendre une règle, des pistes pour préciser ton vocabulaire et des retours utiles pour renforcer tes phrases. Tu essaies, tu reformules, tu affines — jusqu’à ce que tes mots soient précis, forts et vraiment les tiens.",
      items: [
        {
          label: "Grammaire",
          title: "Faire tenir tes phrases.",
          body: "Des explications claires sur les accords, la syntaxe et les conjugaisons — au moment où tu en as besoin.",
        },
        {
          label: "Vocabulaire",
          title: "Trouver le mot juste.",
          body: "Des mots plus précis, avec le contexte qui t’aide à les comprendre et à les réutiliser.",
        },
        {
          label: "Formulation",
          title: "Donner plus de force à ce que tu dis.",
          body: "Des retours utiles pour reformuler, nuancer et construire un argument qui porte.",
        },
      ],
    },
    product: {
      eyebrow: "De ton idée à tes mots",
      title: "Tu sais ce que tu veux dire. Plume t’aide à le dire avec précision.",
      draftLabel: "Ton premier jet",
      draft: "Les réseaux sociaux nous influencent beaucoup.",
      notes: [
        ["Grammaire", "Ta phrase est juste."],
        ["Vocabulaire", "Quel effet précis veux-tu nommer ?"],
        ["Formulation", "Rends le lien entre les deux idées plus net."],
      ],
      revisionLabel: "Ta phrase, affinée",
      revision:
        "Les réseaux sociaux ne reflètent pas seulement nos choix : ils contribuent aussi à les façonner.",
      ownWords: "Plus précis. Plus fort. Toujours tes mots.",
    },
    closing: {
      eyebrow: "Prêt·e à prendre la parole ?",
      title: "Trouve les mots. Fais-toi entendre.",
      cta: "Trouver ma plume",
      schools: "Découvrir Plume pour mon école",
    },
    footer: {
      line: "Le français pour dire ce que tu veux dire.",
      terms: "Conditions",
    },
  },
  en: {
    nav: {
      method: "How it works",
      support: "What Plume builds",
      schools: "Schools",
      parents: "Parents",
      privacy: "Privacy",
      login: "Log in",
      start: "Get started",
    },
    hero: {
      kicker: "Your ideas already matter.",
      headline: ["Find", "your", "voice."],
      lead: "Don’t let anyone else choose your words.",
      body: "Plume helps you read between the lines and find the French to say what you mean.",
      cta: "Start with what matters to me",
      discover: "See how Plume helps",
      imageAlt:
        "Three students talking in front of a chalkboard covered with formulas",
      imageCaption: "Your ideas. Your words. Your voice.",
    },
    ribbon: [
      "grammar",
      "vocabulary",
      "nuance",
      "expression",
      "argument",
      "voice",
    ],
    progression: {
      eyebrow: "The path",
      title: "Language becomes a tool.",
      steps: [
        "Read between the lines",
        "Understand how language works",
        "Find the right words",
        "Make yourself heard",
      ],
    },
    support: {
      eyebrow: "A high standard. The support to reach it.",
      title: "Your voice matters. Give it the words it deserves.",
      body: "Plume helps you shape what you want to say: a clear explanation when you need to understand a rule, prompts that sharpen your vocabulary, and useful feedback that strengthens your sentences. You try, rephrase, and refine — until your words are precise, powerful, and unmistakably yours.",
      items: [
        {
          label: "Grammar",
          title: "Build sentences that hold.",
          body: "Clear explanations of agreement, syntax, and conjugation — right when you need them.",
        },
        {
          label: "Vocabulary",
          title: "Find the right word.",
          body: "More precise words, with the context that helps you understand and use them again.",
        },
        {
          label: "Expression",
          title: "Give your point more force.",
          body: "Useful feedback to rephrase, add nuance, and build an argument that carries.",
        },
      ],
    },
    product: {
      eyebrow: "From your idea to your words",
      title: "You know what you mean. Plume helps you say it precisely.",
      draftLabel: "Your first draft",
      draft: "Les réseaux sociaux nous influencent beaucoup.",
      notes: [
        ["Grammar", "Your sentence is correct."],
        ["Vocabulary", "What precise effect do you want to name?"],
        ["Expression", "Make the link between both ideas clearer."],
      ],
      revisionLabel: "Your refined sentence",
      revision:
        "Les réseaux sociaux ne reflètent pas seulement nos choix : ils contribuent aussi à les façonner.",
      ownWords: "More precise. More powerful. Still your words.",
    },
    closing: {
      eyebrow: "Ready to speak up?",
      title: "Find the words. Make yourself heard.",
      cta: "Find my voice",
      schools: "Explore Plume for my school",
    },
    footer: {
      line: "French for saying what you mean.",
      terms: "Terms",
    },
  },
} as const;

function LanguageSwitch({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div className={styles.languageSwitch} aria-label="Language / Langue">
      {(["fr", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={language === option}
          className={language === option ? styles.languageActive : undefined}
          onClick={() => onChange(option)}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function KineticMarketingHome() {
  const [language, setLanguage] = useState<Language>("fr");
  const copy = content[language];

  function changeLanguage(next: Language) {
    setLanguage(next);
  }

  return (
    <div className={styles.root} lang={language}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Plume — accueil">
          <Feather aria-hidden="true" />
          <span>
            Plume<span>.</span>
          </span>
        </Link>

        <nav className={styles.desktopNav} aria-label={language === "fr" ? "Navigation principale" : "Main navigation"}>
          <a href="#chemin">{copy.nav.method}</a>
          <a href="#outils">{copy.nav.support}</a>
          <Link href="/schools">{copy.nav.schools}</Link>
          <Link href="/parents">{copy.nav.parents}</Link>
        </nav>

        <div className={styles.headerActions}>
          <LanguageSwitch language={language} onChange={changeLanguage} />
          <Link href="/login" className={styles.loginLink}>
            {copy.nav.login}
          </Link>
          <Link href="/signup" className={styles.headerCta}>
            {copy.nav.start}
          </Link>
        </div>

        <details className={styles.mobileMenu}>
          <summary>Menu</summary>
          <nav aria-label="Navigation mobile">
            <a href="#chemin">{copy.nav.method}</a>
            <a href="#outils">{copy.nav.support}</a>
            <Link href="/schools">{copy.nav.schools}</Link>
            <Link href="/parents">{copy.nav.parents}</Link>
            <Link href="/privacy">{copy.nav.privacy}</Link>
            <Link href="/login">{copy.nav.login}</Link>
          </nav>
        </details>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>
              <span aria-hidden="true">●</span> {copy.hero.kicker}
            </p>
            <h1 className={styles.headline}>
              {copy.hero.headline.map((line, index) => (
                <span
                  key={line}
                  className={index === 2 ? styles.headlineAccent : undefined}
                >
                  {line}
                </span>
              ))}
            </h1>
            <div className={styles.heroStatement}>
              <p className={styles.heroLead}>{copy.hero.lead}</p>
              <p>{copy.hero.body}</p>
            </div>
            <div className={styles.heroButtons}>
              <Link href="/signup" className={styles.primaryCta}>
                <span>{copy.hero.cta}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
              <a href="#outils" className={styles.textCta}>
                {copy.hero.discover}
                <ArrowDownRight aria-hidden="true" />
              </a>
            </div>
          </div>

          <figure className={styles.heroVisual}>
            <Image
              src="/plume-student-voices.jpg"
              alt={copy.hero.imageAlt}
              fill
              preload
              sizes="(max-width: 900px) 92vw, 42vw"
            />
            <div className={styles.imageWash} aria-hidden="true" />
            <figcaption>{copy.hero.imageCaption}</figcaption>
          </figure>
        </section>

        <div className={styles.ribbon} aria-hidden="true">
          <div>
            {[...copy.ribbon, ...copy.ribbon].map((word, index) => (
              <span key={`${word}-${index}`}>
                {word} <b>✦</b>
              </span>
            ))}
          </div>
        </div>

        <section id="chemin" className={styles.progression}>
          <div className={styles.sectionIntro}>
            <p>{copy.progression.eyebrow}</p>
            <h2>{copy.progression.title}</h2>
          </div>
          <ol className={styles.steps}>
            {copy.progression.steps.map((step, index) => (
              <li key={step}>
                <span>0{index + 1}</span>
                <strong>{step}</strong>
                <ArrowDownRight aria-hidden="true" />
              </li>
            ))}
          </ol>
        </section>

        <section id="outils" className={styles.support}>
          <div className={styles.supportIntro}>
            <p className={styles.eyebrow}>{copy.support.eyebrow}</p>
            <h2>{copy.support.title}</h2>
            <p className={styles.supportBody}>{copy.support.body}</p>
          </div>

          <div className={styles.supportItems}>
            {copy.support.items.map((item, index) => (
              <article key={item.label}>
                <div className={styles.itemIndex}>0{index + 1}</div>
                <p className={styles.itemLabel}>{item.label}</p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.product}>
          <div className={styles.productHeading}>
            <p className={styles.eyebrow}>{copy.product.eyebrow}</p>
            <h2>{copy.product.title}</h2>
          </div>

          <div className={styles.editor}>
            <div className={styles.draft}>
              <p className={styles.editorLabel}>{copy.product.draftLabel}</p>
              <blockquote lang="fr">“{copy.product.draft}”</blockquote>
              <span className={styles.cursor} aria-hidden="true" />
            </div>
            <div className={styles.notes}>
              {copy.product.notes.map(([label, note], index) => (
                <div key={label}>
                  <span>0{index + 1}</span>
                  <p>
                    <strong>{label}</strong>
                    {note}
                  </p>
                </div>
              ))}
            </div>
            <div className={styles.revision}>
              <p className={styles.editorLabel}>{copy.product.revisionLabel}</p>
              <blockquote lang="fr">“{copy.product.revision}”</blockquote>
              <p className={styles.ownWords}>{copy.product.ownWords}</p>
            </div>
          </div>
        </section>

        <section className={styles.closing}>
          <p>{copy.closing.eyebrow}</p>
          <h2>{copy.closing.title}</h2>
          <div>
            <Link href="/signup" className={styles.closingCta}>
              {copy.closing.cta}
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/schools" className={styles.schoolLink}>
              {copy.closing.schools}
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span>Plume.</span>
          <p>{copy.footer.line}</p>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/privacy">{copy.nav.privacy}</Link>
          <Link href="/terms">{copy.footer.terms}</Link>
          <span>© {new Date().getFullYear()} Plume</span>
        </div>
      </footer>
    </div>
  );
}
