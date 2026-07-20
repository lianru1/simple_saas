// ── Skill 类型定义 ──

/** 商业模式 */
export type SkillMode = "host" | "draw";

/** skills 数据库表对应的类型 */
export interface Skill {
  id: string;
  user_id: string;
  name: string; // 佳酿名称
  flavor: string; // 风味档案（第一人称，80-120字）
  voice_samples: string[]; // 场景对话样本（3-5条直接引用）
  rules: string[]; // 酿造铁律（3-5条）
  boundaries: string[]; // 诚实边界（2-3条：不知道/不会做的事）
  material: string | null; // 原始原料文本
  mode: SkillMode; // host=托管 / draw=买断
  price_credits: number; // 买断所需积分
  quota_used: number; // 已品鉴次数
  quota_total: number; // 总品鉴次数上限
  created_at: string;
  updated_at: string;
}

/** 创建 Skill 时的表单输入 */
export interface CreateSkillInput {
  name: string;
  flavor: string;
  rules: string[];
  material?: string;
  mode?: SkillMode;
}

/** /api/distill 的请求体 */
export interface DistillRequest {
  material: string;
}

/** /api/distill 的成功响应 */
export interface DistillResponse {
  flavor: string;
  voice_samples: string[];
  rules: string[];
  boundaries: string[];
}

/** /api/chat 的请求体 */
export interface ChatRequest {
  skillId: string;
  message: string;
}

/** 聊天消息 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** 购买记录（Draw 买断） */
export interface Purchase {
  id: string;
  user_id: string;
  skill_id: string;
  price_credits: number;
  created_at: string;
}

/** 对话计数记录 */
export interface SkillConversation {
  id: string;
  user_id: string;
  skill_id: string;
  message_count: number;
  free_messages_used: number;
  credits_spent: number;
  created_at: string;
  updated_at: string;
}
