/**
 * lib/env.ts — 环境变量集中验证
 *
 * 在应用启动时检查所有必需的环境变量是否存在。
 * 如果缺失，立即抛出明确错误——不静默降级，不错误追踪。
 *
 * 其他模块从 process.env 读取前应通过此模块验证。
 */

const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CREEM_API_KEY",
  "CREEM_WEBHOOK_SECRET",
  "CREEM_API_URL",
  "DEEPSEEK_API_KEY",
] as const;

const OPTIONAL_VARS = [
  "CREEM_TEST_MODE",
  "BASE_URL",
  "CREEM_SUCCESS_URL",
] as const;

/**
 * 验证所有必需的环境变量是否存在。
 * 应在应用首次导入时调用（如 root layout）。
 * 返回一个包含所有已验证变量的对象，避免各处重复使用 `!` 非空断言。
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const name of REQUIRED_VARS) {
    if (!process.env[name]) {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
        missing.map((v) => `  - ${v}`).join("\n") +
        `\n\nPlease add them to your .env.local file.`
    );
  }
}

/**
 * 安全读取必需的环境变量（已验证过的变量直接用此函数取，无需 `!`）。
 * 如果变量未设置则抛错——调用此函数前应先运行 validateEnv()。
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Environment variable "${name}" is not set. ` +
      `Run validateEnv() at startup to catch this early.`
    );
  }
  return value;
}

export const ENV = {
  get SUPABASE_URL() { return requireEnv("NEXT_PUBLIC_SUPABASE_URL"); },
  get SUPABASE_ANON_KEY() { return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"); },
  get SUPABASE_SERVICE_ROLE_KEY() { return requireEnv("SUPABASE_SERVICE_ROLE_KEY"); },
  get CREEM_API_KEY() { return requireEnv("CREEM_API_KEY"); },
  get CREEM_WEBHOOK_SECRET() { return requireEnv("CREEM_WEBHOOK_SECRET"); },
  get CREEM_API_URL() { return requireEnv("CREEM_API_URL"); },
  get DEEPSEEK_API_KEY() { return requireEnv("DEEPSEEK_API_KEY"); },
  get CREEM_TEST_MODE() { return process.env.CREEM_TEST_MODE; },
  get BASE_URL() { return process.env.BASE_URL; },
  get CREEM_SUCCESS_URL() { return process.env.CREEM_SUCCESS_URL; },
} as const;
