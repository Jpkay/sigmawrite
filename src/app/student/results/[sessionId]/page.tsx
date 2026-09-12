import {loadReadingPagePayload} from "@/lib/reading/page-delivery";
import {ReadingResults} from "./reading-results";

export default async function ResultsPage({params}: {params: Promise<{sessionId: string}>}) {
  const {sessionId} = await params;
  const {text, nextStep} = await loadReadingPagePayload(sessionId, true);
  return <ReadingResults key={sessionId} textKey={sessionId} text={text} nextStep={nextStep} />;
}
