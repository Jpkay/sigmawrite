import {loadReadingPagePayload} from "@/lib/reading/page-delivery";
import {ReadingPlayer} from "./reading-player";

export default async function ReadingPage({params}: {params: Promise<{sessionId: string}>}) {
  const {sessionId} = await params;
  const {text} = await loadReadingPagePayload(sessionId);
  return <ReadingPlayer key={sessionId} textKey={sessionId} text={text} />;
}
