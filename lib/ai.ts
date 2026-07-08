/**
 * ============================================================================
 * AI HOOKS — placeholders only. NOTHING here is live. NO API key needed.
 * ============================================================================
 *
 * These stubs exist so the UI can already have its "✨ Suggest instructions"
 * button (currently disabled with a "coming soon" tooltip). When you're
 * ready to turn AI on, this is the ONLY file you need to fill in, plus one
 * env var.
 *
 * HOW TO ENABLE AI LATER (step by step)
 *   1. Get an API key from your provider of choice (e.g. Anthropic:
 *      https://console.anthropic.com → API Keys).
 *   2. Add it to .env.local AND to Vercel → Settings → Environment
 *      Variables, as:  AI_API_KEY=sk-...
 *   3. Replace the bodies below with a real API call. Example with the
 *      Anthropic SDK (npm install @anthropic-ai/sdk):
 *
 *        import Anthropic from "@anthropic-ai/sdk";
 *        const client = new Anthropic({ apiKey: process.env.AI_API_KEY });
 *        const msg = await client.messages.create({
 *          model: "claude-sonnet-5",
 *          max_tokens: 1024,
 *          messages: [{ role: "user", content: `Write beginner-friendly
 *            build instructions for a robot using these parts: ${parts}
 *            and this code:\n${code}` }],
 *        });
 *        return msg.content[0].type === "text" ? msg.content[0].text : null;
 *
 *   4. The button on the post form un-disables itself automatically once
 *      aiEnabled() returns true (it checks via the /api/ai route).
 *
 * ⚠️ SERVER-ONLY: never call AI providers from the browser — the key would
 * leak. The post form calls POST /api/ai, which calls these functions.
 * ============================================================================
 */

/** True once the owner has configured an AI key. Controls the UI button. */
export function aiEnabled(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

/**
 * FUTURE: given the project's code and parts list, draft step-by-step build
 * instructions the poster can edit.
 *
 * Currently: always returns null (feature disabled).
 */
export async function suggestInstructions(
  code: string,
  parts: string[]
): Promise<string | null> {
  // ---- REPLACE THIS with a real API call (see header comment) ----
  void code;
  void parts;
  return null;
}

/**
 * FUTURE: given code, return a short plain-language summary of what it does
 * (shown on the post page above the code).
 *
 * Currently: always returns null (feature disabled).
 */
export async function summarizeCode(code: string): Promise<string | null> {
  // ---- REPLACE THIS with a real API call (see header comment) ----
  void code;
  return null;
}
