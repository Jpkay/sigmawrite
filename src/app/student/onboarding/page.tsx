import {journalCurrentStudentPayload} from "@/lib/diagnostic/granular/server-delivery-journal";
import OnboardingClient from "./onboarding-client";
import {onboardingPayload,onboardingDisplayText} from "./onboarding-copy";
export default async function OnboardingPage() {
 await journalCurrentStudentPayload("student:onboarding-copy",onboardingDisplayText);
 return <OnboardingClient payload={onboardingPayload}/>;
}
