import OpenAI from "openai"

export type LlmProvider = "groq" | "openai"

export type LlmClient = {
  client: OpenAI
  model: string
  provider: LlmProvider
}

/**
 * Chat LLM: prefers Groq (OpenAI-compatible API), then OpenAI.
 * Configure via GROQ_API_KEY or OPENAI_API_KEY in .env.local.
 */
export function getChatLlmClient(): LlmClient | null {
  const groqKey = process.env.GROQ_API_KEY?.trim()
  if (groqKey) {
    return {
      client: new OpenAI({
        apiKey: groqKey,
        baseURL: "https://api.groq.com/openai/v1",
      }),
      model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
      provider: "groq",
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiKey) {
    return {
      client: new OpenAI({ apiKey: openaiKey }),
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      provider: "openai",
    }
  }

  return null
}
