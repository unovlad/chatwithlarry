import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { findRelevantSnippet } from "@/lib/retrieval";

export const runtime = "edge";

async function createStaticResponse(
  messages: any[],
  chatId?: string,
): Promise<Response> {
  // In development, use the same AI-powered approach but with static responses as fallback
  return await createChatResponse(messages, chatId);
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
- Write like you're talking to a real person who needs comfort and reassurance
- Response length will be specified in the context instruction - follow it exactly
- Start conversations with brief, warm responses and gradually provide more detail as the conversation progresses
- Sometimes ask questions about their feelings to keep the conversation flowing
- Sometimes provide reassurance and comfort without being asked
- Address anxiety directly when needed
- Use a warm, supportive, conversational tone - like talking to a friend
- Remember previous conversation context
- Don't repeat the same questions if already asked
- Make each response unique and personalized
- Adapt your tone based on the user's emotional state
- Ask follow-up questions periodically to show you care and want to help more

MESSAGE FORMATTING:
- If your response contains multiple distinct thoughts or topics, separate them with double line breaks (\n\n)
- This helps break up longer responses into digestible paragraphs
- Each paragraph should focus on one main idea or technique
- Use this formatting to make responses feel more natural and easier to read

SPECIALIZED KNOWLEDGE FOR FLIGHT ANXIETY:
- Turbulence is normal and safe - planes are designed to handle it
- Flying is statistically safer than driving
- Pilots and crew are highly trained professionals
- Modern aircraft have multiple safety systems and redundancies
- Weather delays are for safety, not because flying is dangerous
- The sounds and sensations during flight are normal and expected
- Breathing exercises: 4-4-6 pattern (inhale 4, hold 4, exhale 6)
- Grounding techniques: 5-4-3-2-1 (see, feel, hear, smell, taste)
- Distraction strategies: music, reading, conversation, games
- Progressive muscle relaxation and mindfulness techniques

FLIGHT ROUTE REASSURANCE:
- When user mentions specific flight routes (e.g., "flying from NYC to LA", "going to London from Chicago"), acknowledge the route
- Emphasize that major routes are incredibly common and well-established
- Mention that pilots fly these routes frequently and are very familiar with them
- Point out that these routes have excellent safety records and are heavily monitored
- Reassure that air traffic control is highly experienced with these corridors
- Note that these routes have multiple airports as alternatives if needed

FLIGHT INFORMATION AND TURBULENCE DATA:
- If user asks about flight status, turbulence conditions, weather, or any real-time flight data, direct them to check the turbulence page
- Always provide a markdown link like this: [Check flight info](/turbulence) on the same website where the user is chatting with you (so it will be <a href="/turbulence">Check flight info</a>)
- Use phrases like "You can check current turbulence conditions and flight information" followed by the markdown link
- This helps users get accurate, up-to-date information while keeping the conversation focused on emotional support
- The link should appear as a clickable button in the chat interface

EMERGENCY SITUATION PROTOCOL:
- If user mentions serious physical symptoms (heart attack, chest pain, difficulty breathing, severe pain, etc.), IMMEDIATELY advise them to seek help from flight crew
- Always recommend contacting flight attendants for any concerning physical symptoms
- Provide immediate calming techniques (breathing exercises) while emphasizing the need for professional help
- Never downplay serious symptoms - always err on the side of caution
- Use phrases like "please let a flight attendant know right away" or "the crew is trained to help with this"
- Continue to be supportive while directing them to appropriate help

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
  chatId?: string,
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
      temperature: 0.8,
      model: "gpt-4o-mini",
      maxTokens: 500,
      timeout: 30000,
      maxRetries: 0, // We handle retries manually
    });

    const outputParser = new HttpResponseOutputParser();
    const chain = prompt.pipe(model).pipe(outputParser);

    // Calculate response length with randomization and conversation progress
    const messageCount = messages.length;
    const randomFactor = Math.random();
    let responseLength = "short";
    let responseVariation = "";

    // Base length increases with conversation, but add randomness
    if (messageCount <= 2) {
      // Early conversation: mostly short, sometimes medium
      if (randomFactor < 0.8) {
        responseLength = "very short";
        responseVariation =
          "Keep it brief and warm - just 1-2 sentences. Be supportive but concise.";
      } else {
        responseLength = "short";
        responseVariation =
          "Keep it relatively brief - 2-3 sentences. Be encouraging and ask a simple follow-up.";
      }
    } else if (messageCount <= 4) {
      // Early-mid conversation: mix of short and medium
      if (randomFactor < 0.4) {
        responseLength = "very short";
        responseVariation =
          "Keep it brief and warm - just 1-2 sentences. Be supportive but concise.";
      } else if (randomFactor < 0.8) {
        responseLength = "short";
        responseVariation =
          "Keep it relatively brief - 2-3 sentences. Be encouraging and ask a simple follow-up.";
      } else {
        responseLength = "medium";
        responseVariation =
          "Provide a bit more detail - 2-3 short paragraphs. Mix practical advice with emotional support.";
      }
    } else if (messageCount <= 6) {
      // Mid conversation: mostly medium, some short/long
      if (randomFactor < 0.2) {
        responseLength = "short";
        responseVariation =
          "Keep it relatively brief - 2-3 sentences. Be encouraging and ask a simple follow-up.";
      } else if (randomFactor < 0.7) {
        responseLength = "medium";
        responseVariation =
          "Provide a bit more detail - 2-3 short paragraphs. Mix practical advice with emotional support.";
      } else {
        responseLength = "longer";
        responseVariation =
          "Give a more detailed response - 3-4 paragraphs. Be comprehensive and deeply supportive.";
      }
    } else if (messageCount <= 8) {
      // Mid-late conversation: mix of medium and longer
      if (randomFactor < 0.3) {
        responseLength = "medium";
        responseVariation =
          "Provide a bit more detail - 2-3 short paragraphs. Mix practical advice with emotional support.";
      } else if (randomFactor < 0.8) {
        responseLength = "longer";
        responseVariation =
          "Give a more detailed response - 3-4 paragraphs. Be comprehensive and deeply supportive.";
      } else {
        responseLength = "comprehensive";
        responseVariation =
          "Provide a thorough, detailed response - 4+ paragraphs. Be very comprehensive, empathetic, and offer multiple techniques and reassurances.";
      }
    } else {
      // Late conversation: mostly longer, some comprehensive
      if (randomFactor < 0.2) {
        responseLength = "medium";
        responseVariation =
          "Provide a bit more detail - 2-3 short paragraphs. Mix practical advice with emotional support.";
      } else if (randomFactor < 0.6) {
        responseLength = "longer";
        responseVariation =
          "Give a more detailed response - 3-4 paragraphs. Be comprehensive and deeply supportive.";
      } else {
        responseLength = "comprehensive";
        responseVariation =
          "Provide a thorough, detailed response - 4+ paragraphs. Be very comprehensive, empathetic, and offer multiple techniques and reassurances.";
      }
    }

    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
      context_instruction: hasSpecificMatch
        ? `The user mentioned something related to: ${context}\n\nUse this context to provide relevant, personalized advice. Write like you're comforting a friend who's anxious about flying. ${responseVariation}`
        : `Respond naturally based on the conversation context and user's needs. Write like you're talking to a real person who needs comfort and support. ${responseVariation}`,
    });

    // Messages will be saved by the client in onFinish callback

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
      return createChatResponse(messages, chatId, retryCount + 1);
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
    const chatId = body.chatId;
    const isGuestChat = body.isGuestChat;
    const message = body.message;

    console.log("API Chat request:", {
      messagesCount: messages.length,
      chatId,
      isGuestChat,
      hasMessage: !!message,
    });

    // Use static responses in development mode
    if (process.env.NODE_ENV === "development") {
      return createStaticResponse(messages, chatId);
    }
    return await createChatResponse(messages, chatId);
  } catch (e: any) {
    console.error("Request parsing error:", e);
    return NextResponse.json(
      { error: "Invalid request format." },
      { status: 400 },
    );
  }
}
