import type { Metadata } from "next";
import { KineticMarketingHome } from "@/components/kinetic-marketing-home";

export const metadata: Metadata = {
  title: "Trouve ta plume",
  description:
    "Plume aide les élèves à comprendre le français, trouver les mots justes et se faire entendre.",
};

export default function Home() {
  return <KineticMarketingHome />;
}
