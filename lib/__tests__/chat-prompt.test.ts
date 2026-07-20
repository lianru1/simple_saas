/**
 * lib/chat-prompt.test.ts
 *
 * 测试聊天系统提示词构建函数 — buildChatPrompt() 和 DISCLAIMER 常量
 */
import { describe, it, expect } from "vitest";
import { buildChatPrompt, DISCLAIMER } from "../chat-prompt";

// ──────────────────────────────────────────────
// buildChatPrompt
// ──────────────────────────────────────────────

describe("buildChatPrompt", () => {
  const baseFlavor = "I'm a designer who lives for typography.";
  const baseRules = ["Always start with empathy.", "Never say 'it depends' without context."];
  const baseMaterial = "Some source notes here.";

  it("should include the flavor text", () => {
    const result = buildChatPrompt(baseFlavor, baseRules, baseMaterial);
    expect(result).toContain(baseFlavor);
  });

  it("should include all rules as a numbered list", () => {
    const result = buildChatPrompt(baseFlavor, baseRules, baseMaterial);
    expect(result).toContain("1. Always start with empathy.");
    expect(result).toContain("2. Never say 'it depends' without context.");
  });

  it("should handle empty rules array with a fallback message", () => {
    const result = buildChatPrompt(baseFlavor, [], baseMaterial);
    expect(result).toContain("(No specific rules provided");
  });

  it("should include material excerpt (truncated to 2000 chars)", () => {
    const longMaterial = "x".repeat(3000);
    const result = buildChatPrompt(baseFlavor, baseRules, longMaterial);
    // 应该只包含截断后的前 2000 个字符
    const materialSection = result.slice(result.indexOf("【Background Reference"));
    expect(materialSection).toContain("x".repeat(2000));
    expect(materialSection).not.toContain("x".repeat(2001));
  });

  it("should handle null material gracefully", () => {
    const result = buildChatPrompt(baseFlavor, baseRules, null);
    // 不应该有 Background Reference 段落
    expect(result).not.toContain("【Background Reference");
    // 但核心内容应该还在
    expect(result).toContain(baseFlavor);
  });

  it("should include voice samples when provided", () => {
    const voiceSamples = ["Hey, that's spot on.", "Nah, I'd go a different way."];
    const result = buildChatPrompt(baseFlavor, baseRules, baseMaterial, voiceSamples);
    expect(result).toContain("【Voice Calibration");
    expect(result).toContain('"Hey, that\'s spot on."');
  });

  it("should not include voice calibration section when voiceSamples is undefined", () => {
    const result = buildChatPrompt(baseFlavor, baseRules, baseMaterial, undefined);
    expect(result).not.toContain("【Voice Calibration");
  });

  it("should not include voice calibration when voiceSamples is empty", () => {
    const result = buildChatPrompt(baseFlavor, baseRules, baseMaterial, []);
    expect(result).not.toContain("【Voice Calibration");
  });

  it("should include boundaries when provided", () => {
    const boundaries = ["I don't do logo design.", "Finance questions — ask an accountant."];
    const result = buildChatPrompt(
      baseFlavor,
      baseRules,
      baseMaterial,
      undefined,
      boundaries
    );
    expect(result).toContain("【Honest Boundaries");
    expect(result).toContain("I don't do logo design.");
  });

  it("should not include boundaries section when undefined", () => {
    const result = buildChatPrompt(baseFlavor, baseRules, baseMaterial);
    expect(result).not.toContain("【Honest Boundaries");
  });

  it("should append the disclaimer instruction", () => {
    const result = buildChatPrompt(baseFlavor, baseRules, baseMaterial);
    expect(result).toContain(DISCLAIMER.trim());
  });

  it("should include all required structural sections", () => {
    const result = buildChatPrompt(
      baseFlavor,
      baseRules,
      baseMaterial,
      ["A quote"],
      ["A boundary"]
    );
    expect(result).toContain("【You are this person");
    expect(result).toContain("【Layer 1: Your Non-Negotiable Principles】");
    expect(result).toContain("【Voice Calibration");
    expect(result).toContain("【Honest Boundaries");
    expect(result).toContain("【Background Reference");
    expect(result).toContain("【Response Instructions");
  });
});

// ──────────────────────────────────────────────
// DISCLAIMER 常量
// ──────────────────────────────────────────────

describe("DISCLAIMER", () => {
  it("should be a non-empty string", () => {
    expect(DISCLAIMER).toBeTruthy();
    expect(typeof DISCLAIMER).toBe("string");
  });

  it("should contain a disclaimer about distilled knowledge", () => {
    expect(DISCLAIMER).toContain("distilled");
    expect(DISCLAIMER).toContain("judgment");
  });

  it("should start with a line break for spacing", () => {
    expect(DISCLAIMER.startsWith("\n\n")).toBe(true);
  });
});
