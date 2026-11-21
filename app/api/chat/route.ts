import { NextRequest, NextResponse } from "next/server";
import { generateChatResponseAI } from "@/lib/ai-provider";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  mode?: string;
  model?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, history = [] } = body;

    // Validate input
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate history format
    const validHistory = Array.isArray(history)
      ? history.filter(
          (msg) =>
            msg &&
            typeof msg === "object" &&
            typeof msg.role === "string" &&
            typeof msg.content === "string" &&
            ["user", "assistant"].includes(msg.role)
        )
      : [];

    const recentHistory = validHistory.slice(-10);

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...recentHistory,
      { role: "user", content: message },
    ];

    const systemPrompt = `You are a helpful AI coding assistant in VibeCode Editor. You help developers with:
- Code explanations and debugging
- Best practices and architecture advice  
- Writing clean, efficient code
- Troubleshooting errors
- Code reviews and optimizations

Always provide clear, practical answers with markdown and proper code syntax highlighting.`;

    // Generate ai response using local Ollama or Cloud fallback (Gemini / Groq / OpenAI)
    const aiResult = await generateChatResponseAI(messages, systemPrompt);

    return NextResponse.json({
      response: aiResult.text,
      model: aiResult.model,
      provider: aiResult.provider,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
