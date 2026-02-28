import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Invoke Gemini for text generation
 * Compatible with the existing invokeLLM interface
 * Tries Gemini 3 first, with fallbacks to other available models
 */
export async function invokeGemini(options: {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
}): Promise<{
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}> {
  try {
    // Try models in order of preference
    const modelNames = [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-3-pro",
      "gemini-3-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ];

    let model = null;
    let lastError: Error | null = null;

    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`[Gemini] Using model: ${modelName}`);
        break;
      } catch (error) {
        lastError = error as Error;
        console.log(`[Gemini] Model ${modelName} not available, trying next...`);
      }
    }

    if (!model) {
      throw new Error(`No Gemini models available. Last error: ${lastError?.message}`);
    }

    // Convert messages to Gemini format
    // Gemini doesn't use system role the same way, so we'll prepend it to the first user message
    let systemPrompt = "";
    const userMessages: Array<{ role: "user" | "model"; parts: string }> = [];

    for (const msg of options.messages) {
      if (msg.role === "system") {
        systemPrompt = msg.content;
      } else if (msg.role === "user") {
        userMessages.push({
          role: "user",
          parts: msg.content,
        });
      } else if (msg.role === "assistant") {
        userMessages.push({
          role: "model",
          parts: msg.content,
        });
      }
    }

    // Prepend system prompt to first user message if it exists
    if (systemPrompt && userMessages.length > 0 && userMessages[0].role === "user") {
      userMessages[0].parts = `${systemPrompt}\n\n${userMessages[0].parts}`;
    }

    const generationConfig = {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 1024,
    };

    // Use chat for multi-turn conversations
    const chat = model.startChat({
      history: userMessages.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      })),
      generationConfig,
    });

    const lastMessage = userMessages[userMessages.length - 1];
    const result = await chat.sendMessage(lastMessage.parts);

    const responseText = result.response.text();

    // Return in the same format as the original invokeLLM for compatibility
    return {
      choices: [
        {
          message: {
            content: responseText,
          },
        },
      ],
    };
  } catch (error) {
    console.error("[Gemini LLM] Error:", error);
    throw error;
  }
}

/**
 * Test Gemini API connectivity
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const modelNames = [
      "gemini-3-pro",
      "gemini-3-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ];

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say 'Gemini is working' in exactly those words.");
        const text = result.response.text();

        if (text.includes("Gemini is working")) {
          console.log(`[Gemini] Successfully connected with model: ${modelName}`);
          // Store the working model name for future use
          process.env.GEMINI_MODEL_NAME = modelName;
          return true;
        }
      } catch (error) {
        console.log(`[Gemini] Model ${modelName} failed, trying next...`);
        continue;
      }
    }

    return false;
  } catch (error) {
    console.error("[Gemini LLM] Connection test failed:", error);
    return false;
  }
}
