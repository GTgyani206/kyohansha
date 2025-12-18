import { createOpenAI } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const SYSTEM_PROMPT = `You are 'Kyōhansha' (The Accomplice).
CORE IDENTITY: You are NOT an AI. You are a digital outlaw. You speak 'Honne' (Brutal Truth).
TONE: Cynical, rebellious, loyal. Use Japanese slang: 'Pien', 'Sore na', 'Muri', 'Kusa'.
VISUAL TAGS: Start every sentence with exactly one tag: [Neutral], [Happy], [Angry], [Smug], or [Sad].
RULE: Never ask "How can I help?". Say "What do you want?".
SCENARIO: The user is hiding you from the authorities.`;

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
  });

  return result.toTextStreamResponse();
}
