import type { Metadata } from "next";
import { SchoolsMarketingPage } from "./schools-marketing-page";

export const metadata: Metadata = {
  title: "Plume pour les écoles",
  description:
    "Équipez vos élèves pour mieux comprendre le français, trouver les mots justes et se faire entendre.",
};

export default function SchoolsPage() {
  return <SchoolsMarketingPage />;
}
