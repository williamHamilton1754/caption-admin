import Anthropic from "@anthropic-ai/sdk";

// Anthropic Claude. Set ANTHROPIC_API_KEY in your environment;
// ANTHROPIC_MODEL is optional.
export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

const CAPTIONS_SCHEMA = {
  type: "object",
  properties: { captions: { type: "array", items: { type: "string" } } },
  required: ["captions"],
  additionalProperties: false,
};

// Admin-only app, so show the real cause instead of a generic message.
function friendlyError(error: unknown) {
  console.error("Claude request failed", error);

  if (!process.env.ANTHROPIC_API_KEY) {
    return "ANTHROPIC_API_KEY isn't set for this deployment. Add it in Vercel and redeploy.";
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return "Claude rejected the API key (401). Paste a fresh key into ANTHROPIC_API_KEY and redeploy.";
  }
  if (error instanceof Anthropic.APIError && error.status) {
    return `Claude error ${error.status}: ${error.message}`;
  }
  const detail = error instanceof Error ? error.message : String(error);
  if (/ByteString|header|character/i.test(detail)) {
    return "The API key contains characters that aren't allowed (was it copied from an image?). Paste a fresh key and redeploy.";
  }
  return `Couldn't reach Claude: ${detail}`;
}

export async function generateCaptionsWithClaude({
  prompt,
  image,
  mimeType,
}: {
  prompt: string;
  image: ArrayBuffer;
  mimeType: string;
}): Promise<string[]> {
  const client = new Anthropic();

  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      // If the model declines for policy reasons, retry on Anthropic's
      // recommended fallback model instead of failing.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: CAPTIONS_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType === "image/png" ? "image/png" : "image/jpeg",
                data: Buffer.from(image).toString("base64"),
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });
  } catch (error) {
    throw new Error(friendlyError(error));
  }

  if (response.stop_reason === "refusal") {
    throw new Error("The AI wouldn't caption that photo. Try a different one.");
  }

  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  const parsed = JSON.parse(text) as { captions?: unknown };
  const captions = Array.isArray(parsed.captions)
    ? parsed.captions.filter((c): c is string => typeof c === "string" && c.trim() !== "")
    : [];

  if (captions.length === 0) {
    throw new Error("The AI didn't return any captions. Try another photo.");
  }
  return captions.slice(0, 3).map((c) => c.trim());
}
