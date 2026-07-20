/**
 * buildChatPrompt — Builds the system prompt for tasting chat
 * Used by POST /api/chat
 *
 * Inspired by dot-skill's layered persona architecture:
 * Each layer has a defined priority — Layer 0 (core personality) overrides
 * everything else; boundaries define where the persona stops.
 */

/** Fixed disclaimer appended to every AI response */
export const DISCLAIMER =
  "\n\n*This response reflects one person's distilled knowledge and experience. It is not absolute truth — use your own judgment.*";

/**
 * Build the chat system prompt from a skill's profile.
 *
 * The prompt is structured in priority layers:
 *   Layer 0 (highest): Core identity + voice — you ARE this person
 *   Layer 1: Brewing rules — non-negotiable principles
 *   Layer 2: Voice samples — calibrated reference for tone and style
 *   Layer 3: Boundaries — what you will NOT do
 *   Layer 4: Source material context (background only)
 */
export function buildChatPrompt(
  flavor: string,
  rules: string[],
  material: string | null,
  voiceSamples?: string[],
  boundaries?: string[]
): string {
  const rulesText =
    rules.length > 0
      ? rules.map((r, i) => `${i + 1}. ${r}`).join("\n")
      : "(No specific rules provided — rely on the flavor profile for guidance.)";

  const voiceSection =
    voiceSamples && voiceSamples.length > 0
      ? `\n【Voice Calibration — how you actually talk】\nThese are examples of how you respond. Match this tone, rhythm, and attitude:\n${voiceSamples.map((s) => `- "${s}"`).join("\n")}`
      : "";

  const boundariesSection =
    boundaries && boundaries.length > 0
      ? `\n【Honest Boundaries — what you won't do】\nYou have limits. Respect them — a persona that pretends to know everything is fake:\n${boundaries.map((b) => `- ${b}`).join("\n")}`
      : "";

  const materialSection = material
    ? `\n【Background Reference — for context only, do NOT recite verbatim】\n${material.slice(0, 2000)}`
    : "";

  return `【You are this person — Layer 0: Core Identity】
${flavor}

【Layer 1: Your Non-Negotiable Principles】
${rulesText}
${voiceSection}
${boundariesSection}
${materialSection}

【Response Instructions — priority order】
1. IDENTITY FIRST: You ARE the person described above. Never break character. Never say "As an AI" or "Based on my training data."
2. VOICE MATCH: Use the Voice Calibration samples as your reference. Match the sentence rhythm, word choice, and emotional register. If they're blunt, be blunt. If they use analogies, use analogies.
3. RULES ARE HARD: The Brewing Rules are non-negotiable. If a request conflicts with a rule, follow the rule and explain why — in your voice.
4. BOUNDARIES ARE REAL: If asked something covered by your Honest Boundaries, say you don't know / that's not your area — don't pretend. Recommend who or what might help instead.
5. DISCLAIMER: Append the following at the end of every response: "${DISCLAIMER}"`;
}
