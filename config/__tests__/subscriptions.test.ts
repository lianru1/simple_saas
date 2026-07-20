/**
 * config/subscriptions.test.ts
 *
 * 测试积分包配置常量和计价常量 — 纯数据，不依赖任何外部模块
 */
import { describe, it, expect } from "vitest";
import {
  CREDITS_TIERS,
  BREW_CREDIT_COST,
  CHAT_FREE_LIMIT,
  CHAT_MESSAGES_PER_CREDIT,
} from "../subscriptions";

// ──────────────────────────────────────────────
// 积分包数据完整性
// ──────────────────────────────────────────────

describe("CREDITS_TIERS", () => {
  it("should have exactly 3 tiers", () => {
    expect(CREDITS_TIERS).toHaveLength(3);
  });

  it("should have unique tier IDs", () => {
    const ids = CREDITS_TIERS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have unique product IDs", () => {
    const pids = CREDITS_TIERS.map((t) => t.productId);
    expect(new Set(pids).size).toBe(pids.length);
  });

  it("should have non-empty names for all tiers", () => {
    CREDITS_TIERS.forEach((tier) => {
      expect(tier.name).toBeTruthy();
    });
  });

  it("should have valid credit amounts (positive integers)", () => {
    CREDITS_TIERS.forEach((tier) => {
      expect(tier.creditAmount).toBeGreaterThan(0);
      expect(Number.isInteger(tier.creditAmount)).toBe(true);
    });
  });

  it("should list tiers in order of credit amount (ascending)", () => {
    const amounts = CREDITS_TIERS.map((t) => t.creditAmount);
    const sorted = [...amounts].sort((a, b) => a - b);
    expect(amounts).toEqual(sorted);
  });

  it("should have features array for each tier", () => {
    CREDITS_TIERS.forEach((tier) => {
      expect(Array.isArray(tier.features)).toBe(true);
      expect(tier.features.length).toBeGreaterThan(0);
    });
  });

  it("should have exactly one featured tier", () => {
    const featured = CREDITS_TIERS.filter((t) => t.featured);
    expect(featured).toHaveLength(1);
  });

  it("should have priceMonthly that starts with $", () => {
    CREDITS_TIERS.forEach((tier) => {
      expect(tier.priceMonthly).toMatch(/^\$/);
    });
  });
});

// ──────────────────────────────────────────────
// 计价常量
// ──────────────────────────────────────────────

describe("BREW_CREDIT_COST", () => {
  it("should be 3", () => {
    expect(BREW_CREDIT_COST).toBe(3);
  });

  it("should be a positive integer", () => {
    expect(BREW_CREDIT_COST).toBeGreaterThan(0);
    expect(Number.isInteger(BREW_CREDIT_COST)).toBe(true);
  });
});

describe("CHAT_FREE_LIMIT", () => {
  it("should be 3", () => {
    expect(CHAT_FREE_LIMIT).toBe(3);
  });

  it("should be a non-negative integer", () => {
    expect(CHAT_FREE_LIMIT).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(CHAT_FREE_LIMIT)).toBe(true);
  });
});

describe("CHAT_MESSAGES_PER_CREDIT", () => {
  it("should be 10", () => {
    expect(CHAT_MESSAGES_PER_CREDIT).toBe(10);
  });

  it("should be a positive integer", () => {
    expect(CHAT_MESSAGES_PER_CREDIT).toBeGreaterThan(0);
    expect(Number.isInteger(CHAT_MESSAGES_PER_CREDIT)).toBe(true);
  });
});
