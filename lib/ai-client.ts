import OpenAI from "openai";

/**
 * DeepSeek AI 客户端
 *
 * DeepSeek 完全兼容 OpenAI SDK 格式，
 * 只需改 baseURL 和 apiKey 即可接入。
 */

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  throw new Error(
    "DEEPSEEK_API_KEY is not set in environment variables. " +
    "AI features (distill, chat) will not work. " +
    "Add DEEPSEEK_API_KEY to your .env.local file."
  );
}

export const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey,
});

/** 使用的 DeepSeek 模型 */
export const AI_MODEL = "deepseek-chat";
