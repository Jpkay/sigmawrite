import {SEED_TEXT_BY_ID} from "@/lib/content/texts";
export type Assignment = {
  id: string;
  text_slug: string | null;
  target_type: "text" | "competency_node" | "catch_up_step" | "dictation";
  target_node_id: string | null;
  target_dictation_id?: string | null;
  title: string;
  instructions: string | null;
  due_at: string | null;
};

export const ASSIGNMENT_COPY={title:"À faire",start:"Commencer"};
export function assignmentDisplay(a:Assignment){
 const target=a.target_type === "text" ? (a.text_slug ? SEED_TEXT_BY_ID[a.text_slug]?.title ?? a.text_slug : "Lecture") : a.target_type === "dictation" ? "Défi dictée de classe" : "Micro-session de compétence";
 return {title:a.title,description:target+(a.due_at ? ` · échéance ${a.due_at}` : "")};
}
