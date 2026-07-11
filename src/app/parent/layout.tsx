import Link from "next/link";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { LanguageToggle } from "@/components/language-toggle";
import { getSessionProfile } from "@/lib/auth";
import { getPendingConsentChildren } from "@/lib/db/lifecycle";
import { adultCopy, getAdultLanguage } from "@/lib/i18n";

export default async function ParentLayout({children}:{children:React.ReactNode}){const session=await getSessionProfile();const language=await getAdultLanguage();const copy=adultCopy[language];const nav:NavItem[]=[{href:"/parent",label:copy.home},{href:"/parent/settings",label:copy.settings},{href:"/parent/privacy",label:copy.privacy}];const pending=session?.role==="parent"?await getPendingConsentChildren():[];return <DashboardShell area={language==="en"?"Parent":"Parent"} nav={nav} user={{name:session?.displayName??"Parent",role:session?.role??"parent",analyticsId:session?.id}} signOutLabel={language==="en"?"Sign out":"Se déconnecter"}><LanguageToggle language={language}/>{pending.length>0&&<div className="mb-5 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><p className="font-medium">{language==="en"?"Consent pending":"Consentement en attente"}</p><p className="text-muted-foreground">{pending.map(child=>child.name).join(", ")} {language==="en"?"cannot access activities yet.":"ne peut pas encore accéder aux activités."}</p><Link href="/parent/privacy" className="mt-2 inline-block text-primary hover:underline">{language==="en"?"Review consent":"Examiner le consentement"}</Link></div>}{children}</DashboardShell>}
