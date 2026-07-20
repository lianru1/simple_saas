/**
 * lib/distill-prompt.test.ts
 *
 * 测试蒸馏提示词模块 — buildDistillUserMessage() 和 DISTILL_PROMPT 常量
 */
import { describe, it, expect } from "vitest";
import { DISTILL_PROMPT, buildDistillUserMessage } from "../distill-prompt";

// ──────────────────────────────────────────────
// buildDistillUserMessage
// ──────────────────────────────────────────────

describe("buildDistillUserMessage", () => {
  it("should wrap material with the expected markers", () => {
    const result = buildDistillUserMessage("hello world");
    expect(result).toContain("【Source Material】");
    expect(result).toContain("【End of Source Material】");
    expect(result).toContain("hello world");
  });

  it("should place material between the markers", () => {
    const result = buildDistillUserMessage("test content");
    const startIdx = result.indexOf("【Source Material】");
    const contentIdx = result.indexOf("test content");
    const endIdx = result.indexOf("【End of Source Material】");

    expect(startIdx).toBeLessThan(contentIdx);
    expect(contentIdx).toBeLessThan(endIdx);
  });

  it("should handle empty string", () => {
    const result = buildDistillUserMessage("");
    expect(result).toBe("【Source Material】\n\n【End of Source Material】");
  });

  it("should handle multi-line material", () => {
    const material = "line 1\nline 2\nline 3";
    const result = buildDistillUserMessage(material);
    expect(result).toContain(material);
  });

  it("should handle special characters in material", () => {
    const material = "<script>alert('xss')</script>";
    const result = buildDistillUserMessage(material);
    // 不能转义或修改原文（prompt 注入是上游的责任）
    expect(result).toContain(material);
  });

  it("should handle Unicode / CJK characters", () => {
    const material = "这是一段中文文本，包含 emoji 🎉 和日文 こんにちは";
    const result = buildDistillUserMessage(material);
    expect(result).toContain(material);
  });
});

// ──────────────────────────────────────────────
// DISTILL_PROMPT 常量
// ──────────────────────────────────────────────

describe("DISTILL_PROMPT", () => {
  it("should be a non-empty string", () => {
    expect(DISTILL_PROMPT).toBeTruthy();
    expect(typeof DISTILL_PROMPT).toBe("string");
    expect(DISTILL_PROMPT.length).toBeGreaterThan(100);
  });

  it("should reference the JSON output format", () => {
    expect(DISTILL_PROMPT).toContain("Output JSON Format");
  });

  it("should reference all extraction dimensions", () => {
    expect(DISTILL_PROMPT).toContain("Flavor Profile");
    expect(DISTILL_PROMPT).toContain("Voice Samples");
    expect(DISTILL_PROMPT).toContain("Brewing Rules");
    expect(DISTILL_PROMPT).toContain("Honest Boundaries");
  });

  it("should forbid markdown code blocks in output", () => {
    expect(DISTILL_PROMPT).toContain("do NOT wrap it in markdown code blocks");
  });
});
