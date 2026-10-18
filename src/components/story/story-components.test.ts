import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/story-ui", () => ({ loadStoryChapter: vi.fn(), answerStoryTask: vi.fn(), chooseStoryBranch: vi.fn(), submitStoryEnding: vi.fn(), beginStorySaga: vi.fn() }));
vi.mock("@/lib/actions/story", () => ({ reportText: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { ChapterPage } from "./chapter-page";
import { ChoiceCards, StoryTaskPanel } from "./choice-panel";
import { EndingWriter } from "./ending-writer";
import { ReportText } from "./report-text";
import { StoryHomeCard } from "./story-home-card";
import { StoryLibraryView } from "./story-library";
import { StoryReader } from "./story-reader";
import { StyleCard } from "./style-card";
import { WritingWait } from "./writing-wait";
import { STORY_COPY as copy } from "@/lib/story/copy";
import type { ReaderView } from "@/lib/actions/story-ui";
import type { StoryLibrary } from "@/lib/story/server";

const h = React.createElement;
const html = (element: React.ReactElement) => renderToStaticMarkup(element);
const decoded = (markup: string) => markup.replace(/&#x27;/gu, "'").replace(/&quot;/gu, "\"").replace(/&amp;/gu, "&");

const task = { kind: "vocabulary" as const, word: "intrépide", form: "intrépide", sentence: "Le gardien, un grand intrépide, siffla.", prompt: "Dans ce passage, que veut dire « intrépide » ?", options: ["qui parle fort", "qui n'a pas peur du danger", "qui dort"], answered: null };

const baseView: ReaderView = {
  status: "ready",
  saga: { id: "22222222-2222-4222-8222-222222222222", title: "Le ballon gris", interest: "football", styleName: "Jules Verne", manner: "à la manière de Jules Verne", chapterCount: 7, status: "active" },
  hero: { name: "Lina", avatarEmoji: "🦊", avatarLabel: "Renard rusé" },
  chapter: { id: "33333333-3333-4333-8333-333333333332", index: 2, title: "Sept heures douze", paragraphs: ["Le vestiaire sentait la boue.", "Lina sortit la première."], choices: [{ index: 0, label: "Suivre le gardien" }, { index: 1, label: "Rester au vestiaire" }], isLast: false },
  task, locked: null, bonus: false, finale: null,
};

describe("book page", () => {
  it("renders the chapter like a book page with the hero's avatar and name", () => {
    const markup = html(h(ChapterPage, { index: 2, count: 7, title: "Sept heures douze", paragraphs: ["Un.", "Deux."], heroName: "Lina", avatarEmoji: "🦊", avatarLabel: "Renard rusé" }));
    expect(markup).toContain("Chapitre 2 sur 7");
    expect(markup).toContain("Sept heures douze");
    expect(markup).toContain("🦊");
    expect(markup).toContain("Lina");
    expect(markup.match(/<p/gu)?.length).toBeGreaterThanOrEqual(4);
  });

  it("shows the waiting state with a polite live region", () => {
    const markup = html(h(WritingWait, {}));
    expect(markup).toContain(copy.writingTitle);
    expect(markup).toContain('role="status"');
    expect(html(h(WritingWait, { longer: true }))).toContain(copy.writingLonger);
  });
});

describe("choices and micro-task (H.1, H.3)", () => {
  it("offers two choice cards with pressed state", () => {
    const markup = html(h(ChoiceCards, { choices: baseView.chapter!.choices, selected: 1, onSelect: () => undefined }));
    expect(markup).toContain(copy.whatNext);
    expect(markup).toContain("Suivre le gardien");
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('aria-pressed="false"');
  });

  it("asks one vocabulary question and answers gently, never with 'faux'", () => {
    const open = html(h(StoryTaskPanel, { task, answer: null, onAnswer: () => undefined }));
    expect(open).toContain(copy.taskEyebrow);
    expect(open).toContain("<mark");
    expect(open.match(/role="radio"/gu)).toHaveLength(3);
    const answered = decoded(html(h(StoryTaskPanel, { task, answer: { optionIndex: 0, correct: false, correctIndex: 1, definition: "qui n'a pas peur du danger" }, onAnswer: () => undefined })));
    expect(answered).toContain(copy.taskGentle("intrépide", "qui n'a pas peur du danger"));
    expect(answered.toLowerCase()).not.toMatch(/faux|erreur|raté/u);
  });
});

describe("reader states", () => {
  it("shows the chapter, the choices and the report button, never the task before a choice", () => {
    const markup = html(h(StoryReader, { initial: baseView }));
    expect(markup).toContain("Sept heures douze");
    expect(markup).toContain(copy.whatNext);
    expect(markup).toContain(copy.report);
    expect(markup).not.toContain(copy.taskEyebrow);
  });

  it("waits for tomorrow without delivering the locked chapter's text", () => {
    const markup = html(h(StoryReader, { initial: { ...baseView, status: "locked", chapter: null, task: null, locked: { index: 3, title: "La tempête", choice: "Suivre le gardien" } } }));
    expect(markup).toContain(copy.lockedTitle);
    expect(markup).toContain("La tempête");
    expect(markup).toContain(copy.lockedChoice("Suivre le gardien"));
    expect(markup).not.toContain("Le vestiaire sentait la boue.");
  });

  it("shows the writing state and the unavailable state", () => {
    expect(html(h(StoryReader, { initial: { ...baseView, status: "writing", chapter: null, task: null } }))).toContain(copy.writingTitle);
    expect(html(h(StoryReader, { initial: { ...baseView, status: "unavailable", chapter: null, task: null } }))).toContain(copy.unavailableTitle);
  });

  it("ends with the style card, the real excerpt and the ending writer", () => {
    const finale = { styleName: "Jules Verne", manner: "à la manière de Jules Verne", styleCard: { text: "Cette aventure était écrite à la manière de Jules Verne : des machines.", excerpt: { text: "Phileas Fogg était un homme exact.", source: "Le Tour du monde en quatre-vingts jours" } }, words: ["intrépide", "vestiaire", "écume"], minimumWords: 60, maximumWords: 120, saved: null };
    const markup = decoded(html(h(StoryReader, { initial: { ...baseView, status: "finale", chapter: null, task: null, finale } })));
    expect(markup).toContain(copy.finaleTitle);
    expect(markup).toContain(copy.readTheReal("Jules Verne"));
    expect(markup).toContain("Phileas Fogg était un homme exact.");
    expect(markup).toContain(copy.endingChallenge("à la manière de Jules Verne"));
    for (const word of finale.words) expect(markup).toContain(word);
  });
});

describe("style card, ending, report, home card", () => {
  it("omits the excerpt for authors whose text cannot be shown", () => {
    const markup = html(h(StyleCard, { styleName: "un romancier jeunesse d'aujourd'hui", text: "Un narrateur drôle.", excerpt: null }));
    expect(markup).not.toContain("Lis le vrai");
  });

  it("keeps the save button disabled until the three words and the length are there", () => {
    const markup = html(h(EndingWriter, { sagaId: "s", words: ["intrépide"], minimumWords: 60, maximumWords: 120, manner: "à la manière de Jules Verne", saved: null, submit: async () => ({}) }));
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Ranger ma fin dans mon recueil/u);
    const saved = html(h(EndingWriter, { sagaId: "s", words: ["intrépide"], minimumWords: 60, maximumWords: 120, manner: "x", saved: { body: "Une fin.", styleChallenge: true }, submit: async () => ({}) }));
    expect(saved).toContain(copy.endingSaved);
    expect(saved).toContain("/student/recueil");
  });

  it("starts as a discreet report link", () => {
    expect(html(h(ReportText, { chapterId: "c" }))).toContain(copy.report);
  });

  it("renders each home-card state and nothing when unavailable", () => {
    expect(html(h(StoryHomeCard, { card: null }))).toBe("");
    const start = html(h(StoryHomeCard, { card: { state: "start", sagaId: null, title: null, chapterIndex: 0, chapterCount: 0, avatarEmoji: "🪶", manner: null } }));
    expect(start).toContain(copy.homeStart);
    expect(start).toContain('href="/student/histoire"');
    const ready = html(h(StoryHomeCard, { card: { state: "ready", sagaId: "abc", title: "Le ballon gris", chapterIndex: 3, chapterCount: 7, avatarEmoji: "🦊", manner: "à la manière de Jules Verne" } }));
    expect(ready).toContain(copy.homeReady(3));
    expect(ready).toContain('href="/student/histoire/abc"');
    expect(html(h(StoryHomeCard, { card: { state: "locked", sagaId: "abc", title: "T", chapterIndex: 3, chapterCount: 7, avatarEmoji: "🦊", manner: null } }))).toContain(copy.homeLocked);
  });
});

describe("library (H.1, H.6)", () => {
  const library: StoryLibrary = {
    availability: { visible: true, live: false, grade: 6, band: "6e-5e", interests: ["football"], poolStyles: {}, hasSagas: true },
    hero: { nickname: null, avatar: "plume", gender: "n" },
    active: { id: "abc", title: "Le ballon gris", interest: "football", interestLabel: "Football", emoji: "⚽", styleKey: "verne", styleName: "Jules Verne", manner: "à la manière de Jules Verne", status: "active", chaptersRead: 2, chapterCount: 7, hasEnding: false, state: "ready", nextIndex: 3 },
    completed: [],
    shelf: [{ key: "verne", name: "Jules Verne", sagas: 1, thisTerm: true }],
    stylesThisTerm: 1,
    styleGoal: 4,
    proposals: [
      { interest: "football", interestLabel: "Football", emoji: "⚽", styleKey: "daudet", styleName: "Alphonse Daudet", manner: "à la manière d’Alphonse Daudet", teaser: "un conteur qui te parle", newStyle: true },
      { interest: "football", interestLabel: "Football", emoji: "⚽", styleKey: "malot", styleName: "Hector Malot", manner: "à la manière d’Hector Malot", teaser: "un héros débrouillard", newStyle: true },
    ],
  };

  it("shows the saga in progress, the proposals with their author style and the shelf", () => {
    const markup = html(h(StoryLibraryView, { library, suggestedName: "Lina" }));
    expect(markup).toContain("Le ballon gris");
    expect(markup).toContain(copy.readToday);
    expect(markup).toContain("À la manière d’Alphonse Daudet");
    expect(markup).toContain("À la manière d’Hector Malot");
    expect(markup).toContain(copy.newStyle);
    expect(markup).toContain("1 / 4");
    expect(markup).toContain('aria-label="2 chapitre(s) lu(s) sur 7"');
  });
});
