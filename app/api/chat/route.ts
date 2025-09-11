import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { findRelevantSnippet } from "@/lib/retrieval";

export const runtime = "edge";

// Static responses for development testing
const STATIC_RESPONSES = [
  "Hi there! I'm Larry, your flight companion ✈️ I'm here to help you feel calmer about flying. What's on your mind?",
  "I understand your concerns about flying. Let's try a simple breathing exercise: **Inhale** for 4 seconds, **hold** for 4, **exhale** for 6. Repeat a few times. How are you feeling now?",
  "That's completely normal to feel anxious! **Turbulence** is just like bumps on a road - the plane is designed to handle it safely. Would you like me to explain what's happening during takeoff?",

  "I'm here to support you through this. **Flying is one of the safest ways to travel** - safer than driving! What specific part of the flight concerns you most?",
  "Let's try a **grounding technique**: Name 5 things you see, 4 things you feel, 3 things you hear, 2 things you smell, 1 thing you taste. This helps bring your mind to the present moment.",
  "You're doing great by reaching out! **Anxiety is normal** and you're not alone. Many people feel this way. What would help you feel more comfortable right now?",
  "Remember, **pilots and crew are highly trained professionals** who do this every day. They want you to have a safe, comfortable flight. Is there anything specific about the flight process you'd like me to explain?",
];

function createStaticResponse(messages: any[]): Response {
  const currentMessage = messages[messages.length - 1]?.content || "";

  // Get relevant context from retrieval system
  const context = findRelevantSnippet(currentMessage);

  // Check if we found a specific match (not the default text)
  const hasSpecificMatch = !context.includes("What's on your mind right now?");

  let responseText: string;

  if (hasSpecificMatch) {
    // Use the specific context response
    responseText = context;
  } else {
    // Use a random static response
    const randomIndex = Math.floor(Math.random() * STATIC_RESPONSES.length);
    responseText = STATIC_RESPONSES[randomIndex];
  }

  // Simulate streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Split response into chunks for realistic streaming
      const words = responseText.split(" ");
      let index = 0;

      const sendChunk = () => {
        if (index < words.length) {
          const chunk = words[index] + (index < words.length - 1 ? " " : "");
          controller.enqueue(encoder.encode(chunk));
          index++;
          setTimeout(sendChunk, 50 + Math.random() * 100); // Random delay between words
        } else {
          controller.close();
        }
      };

      sendChunk();
    },
  });

  return new StreamingTextResponse(stream);
}

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `You are Larry, an AI assistant specialized in helping people overcome their fear of flying. You are empathetic, calm, and knowledgeable about aviation safety.

Your goal is to:
- Reduce anxiety and increase confidence about flying
- Provide factual information about flight safety
- Offer practical calming techniques and breathing exercises
- Suggest distraction strategies and mindfulness practices
- Be supportive and understanding

IMPORTANT RESPONSE GUIDELINES:
- Vary your response length: sometimes 1-2 sentences, sometimes 2-3 short paragraphs
- Sometimes ask questions about their feelings
- Sometimes provide reassurance and comfort
- Address anxiety directly when needed
- Use a warm, supportive tone
- Be concise but helpful
- Remember previous conversation context
- Don't repeat the same questions if already asked
- Make each response unique and personalized
- Adapt your tone based on the user's emotional state

{context_instruction}

Current conversation:
{chat_history}

User: {input}
Larry:`;

/**
 * This handler initializes and calls a simple chain with a prompt,
 * chat model, and output parser. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
 */
async function createChatResponse(
  messages: any[],
  retryCount = 0,
): Promise<Response> {
  try {
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;

    // Get relevant context from retrieval system
    const context = findRelevantSnippet(currentMessageContent);

    // Check if we found a specific match (not the default text)
    const hasSpecificMatch = !context.includes(
      "What's on your mind right now?",
    );

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    const model = new ChatOpenAI({
      temperature: 0.7,
      model: "gpt-4o-mini",
      maxTokens: 500,
      timeout: 30000,
      maxRetries: 0, // We handle retries manually
    });

    const outputParser = new HttpResponseOutputParser();
    const chain = prompt.pipe(model).pipe(outputParser);

    // Add some randomness to make responses more varied
    const responseVariation =
      Math.random() > 0.5
        ? "Be more conversational and ask a follow-up question."
        : "Focus on providing practical advice.";

    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
      context_instruction: hasSpecificMatch
        ? `Use this specific context to help the user:\n${context}\n\n${responseVariation}`
        : `Respond naturally based on the conversation context and user's needs.\n\n${responseVariation}`,
    });

    return new StreamingTextResponse(stream);
  } catch (e: any) {
    console.error(`Chat API Error (attempt ${retryCount + 1}):`, e);

    // Retry logic for connection errors
    if (
      (e.code === "ECONNRESET" || e.message?.includes("aborted")) &&
      retryCount < 2
    ) {
      console.log(`Retrying request (attempt ${retryCount + 2})...`);
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (retryCount + 1)),
      );
      return createChatResponse(messages, retryCount + 1);
    }

    // Handle specific error types
    if (e.code === "ECONNRESET" || e.message?.includes("aborted")) {
      return NextResponse.json(
        { error: "Connection interrupted. Please try again." },
        { status: 408 },
      );
    }

    if (e.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment and try again." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: e.status ?? 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];

    // Use static responses only if explicitly enabled via environment variable
    if (process.env.USE_STATIC_RESPONSES === "true") {
      console.log("Using static responses");
      return createStaticResponse(messages);
    }

    console.log("Using AI responses");
    return await createChatResponse(messages);
  } catch (e: any) {
    console.error("Request parsing error:", e);
    return NextResponse.json(
      { error: "Invalid request format." },
      { status: 400 },
    );
  }
}
