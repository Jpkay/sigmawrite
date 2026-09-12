import {requireRole} from "@/lib/auth";
import {getCurrentStudentId} from "@/lib/db/student";
import {createClient} from "@/lib/supabase/server";
import {StudentPageHeader as PageHeader} from "@/components/student-page-header";import{VocabularyPractice}from"./vocabulary-practice";import{loadVocabularyMemories}from"@/lib/actions/vocabulary";
export default async function Page(){await requireRole(["student"]);const owner=await getCurrentStudentId(await createClient());const memories=await loadVocabularyMemories();return <><PageHeader boundary="student:vocabulary-header" title="Vocabulaire" description="Retrouve les mots rencontrés en lecture au moment où ta mémoire en a besoin."/><VocabularyPractice key={owner} initial={memories}/></>}
