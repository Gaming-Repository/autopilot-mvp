import { describe, expect, it } from "vitest";
import { testGeminiConnection, invokeGemini } from "./gemini-llm";

describe("Gemini LLM Integration", () => {
  it("tests Gemini API connection", async () => {
    const isConnected = await testGeminiConnection();
    expect(isConnected).toBe(true);
  });

  it("generates text with Gemini", async () => {
    const response = await invokeGemini({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "Say 'Hello from Gemini' in exactly those words.",
        },
      ],
    });

    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    expect(response.choices[0].message.content).toBeDefined();
    expect(response.choices[0].message.content).toContain("Hello from Gemini");
  });

  it("handles multi-turn conversations", async () => {
    const response = await invokeGemini({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that answers questions about programming.",
        },
        {
          role: "user",
          content: "What is TypeScript?",
        },
        {
          role: "assistant",
          content: "TypeScript is a typed superset of JavaScript.",
        },
        {
          role: "user",
          content: "Can you give me an example?",
        },
      ],
    });

    expect(response.choices[0].message.content).toBeDefined();
    expect(response.choices[0].message.content.length).toBeGreaterThan(0);
  });
});
