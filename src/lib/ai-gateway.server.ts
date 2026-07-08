// Helper server-only para chamar o Lovable AI Gateway.
// Uso: getAI().complete({ model, system, prompt, json })
const BASE = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type AIComplete = {
  model: string;
  system?: string;
  prompt: string;
  json?: boolean;
  maxTokens?: number;
};

export async function aiComplete(input: AIComplete): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY ausente");
  const body: Record<string, unknown> = {
    model: input.model,
    messages: [
      ...(input.system ? [{ role: "system", content: input.system }] : []),
      { role: "user", content: input.prompt },
    ],
    max_tokens: input.maxTokens ?? 1200,
  };
  if (input.json) body.response_format = { type: "json_object" };

  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`ai_gateway_${res.status}: ${txt.slice(0, 200)}`);
  }
  const j = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return j.choices?.[0]?.message?.content ?? "";
}

export function tryParseJSON<T>(s: string): T | null {
  const cleaned = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
