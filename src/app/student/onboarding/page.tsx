import {journalCurrentStudentPayload} from "@/lib/diagnostic/granular/server-delivery-journal";
import {loadInterestPromiseKept} from "@/lib/content/interest-promise";
import OnboardingClient from "./onboarding-client";
import {onboardingPayloadFor,onboardingDisplayTextFor} from "./onboarding-copy";
export default async function OnboardingPage() {
 const payload=onboardingPayloadFor(await loadInterestPromiseKept());
 await journalCurrentStudentPayload("student:onboarding-copy",onboardingDisplayTextFor(payload));
 return <OnboardingClient payload={payload}/>;
}
