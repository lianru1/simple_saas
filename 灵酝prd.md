📄 灵酝 (skmint) 全栈开发 PRD · Claude Code 专用版

版本：v1.2（蒸馏内核增强版）

适用对象：独立开发者 + Claude Code / Cursor 等 AI 编程工具

核心技术栈：Next.js 15 (App Router) + TypeScript + Tailwind CSS + Supabase + Vercel AI SDK

1. 品牌语言与产品隐喻（开发时必须遵守）

功能逻辑 UI/接口文案 变量/字段建议命名

上传素材 投入原料 raw_material

生成 AI 人设 定型风味 flavor_profile

核心规则 酿造铁律 brewing_rules (Array)

发布 Skill 完成酝酿 /api/brew

买断下载 出窖提取 mode: 'draw'

托管调用 窖藏待饮 / 品鉴 /skill/[id]/taste

回答末尾 饮酒须知 固定后缀常量 DISCLAIMER

1. 核心 AI Prompt 工程（给 Claude 写代码用）

2.1 蒸馏人格专用 System Prompt（用于 /api/distill）

将此逻辑写入后端，调用 LLM 时严格使用。

const DISTILL_PROMPT = `
你是一位经验萃取师。请根据用户提供的[原料文本]，严格按照以下要求提炼信息，并以纯 JSON 格式输出，不要包含 markdown 代码块标记。

【提炼要求】

1. 风味档案 (flavor)：用第一人称，模仿创作者的口吻，写出 100 字以内的身份定义、语言风格（有无口头禅/黑话）和价值观底线。严禁使用“您好，我是 AI 助手”等客套话。
2. 酿造铁律 (rules)：提炼出 3-5 条该领域不可违背的核心 SOP、避坑点或判断逻辑，每条不超过 30 字。
3. 示例填充：如果原料不足，基于常识做合理推断，但需标注不确定性。

【输出 JSON 格式】
{
  "flavor": "string（风味档案全文）",
  "rules": ["string（铁律1）", "string（铁律2）", "..."]
}

【原料文本开始】
{USER_INPUT}
【原料文本结束】
`;

// 前端拿到 JSON 后，自动填入表单让用户 Confirm

2.2 聊天品鉴 System Prompt（用于 /api/chat）

const buildChatPrompt = (flavor: string, rules: string[], material: string) => `
【角色设定】
${flavor}

【酿造铁律】
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

【背景参考原料】（仅作参考，勿全文背诵）
${material.slice(0, 2000)}

【交互指令】

- 回答需结合上述风味和铁律，语言要像那个创作者本人。
- 拒绝回答与原料领域无关的敏感问题。
- 回答结束后，必须另起一行追加："\n*饮酒须知：本回答仅代表创作者个人经验，不构成绝对标准，请自行判断。*"
`;

1. 数据模型定义（prisma/schema.prisma）

generator client { provider = "prisma-client-js" }

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String?  @unique
  skills    Skill[]
  createdAt DateTime @default(now())
}

model Skill {
  id            String   @id @default(uuid())
  user          User     @relation(fields: [userId], references: [id])
  userId        String
  name          String   // 佳酿名称
  flavor        String   // 风味档案
  rules         String[] // 酿造铁律
  material      String?  // 原始原料文本
  mode          String   @default("host") // 'host' | 'draw'
  priceCents    Int      @default(19900)
  quotaUsed     Int      @default(0)
  quotaTotal    Int      @default(50)
  createdAt     DateTime @default(now())

  @@index([userId])
}

1. 功能详细说明

4.1 酝酿向导页 (/brew)

1. 用户输入名称和原料文本。
2. 点击“萃取风味” → 前端 fetch('/api/distill', {method:'POST', body:...})。
3. 拿到 JSON 回填表单，用户可编辑。
4. 点击【完成酝酿】→ 调用 Next.js Server Action createSkill() 存入 Supabase。
5. 成功后跳转至 /skill/[id]。

4.2 品鉴页 (/skill/[id])

• 读取 Skill 数据，渲染聊天框。

• 提问时调 /api/chat 接口，使用 Vercel AI SDK streamText 返回，实现打字机效果。

• 限制：若 quotaUsed >= quotaTotal 且未登录/未付费，阻断并返回提示。

4.3 商业双轨（逻辑层）

• 若 mode === 'draw'，个人中心显示【出窖】按钮，预留支付接口。

• 若 mode === 'host'，自动生成分享链接，任何人可试聊 3 次。

1. API 接口约定

POST /api/distill

• Request: { material: string }

• Response: { flavor: string, rules: string[] }

POST /api/chat

• Request: { skillId: string, message: string }

• Logic: 查库 → 构建 Prompt → 调 LLM 流式返回。

• Header: Content-Type: text/plain (流式) 或标准 JSON 错误处理。

1. 非功能性要求（Claude 必须遵守）

1. UI 极简主义：使用 Tailwind CSS，font-mono 或 font-sans，主色 #7B68EE 雾紫，背景深色系（适合 AI 聊天调性）。
1. 安全性：.env.local 存放 OPENAI_API_KEY / ANTHROPIC_API_KEY / DATABASE_URL，绝不提交到 Git。
1. 错误处理：AI 接口超时或报错时，前端 Toast 提示“本次酝酿中断，请重试”。
1. 类型安全：前后端共享 Skill 类型定义，不使用 any。

1. 给 Claude Code 的最终执行指令（复制即用）

你是一个精通 Next.js 15、TypeScript 和 Tailwind CSS 的全栈工程师。
请基于以下要求，使用 Vercel AI SDK 帮我完成 skmint（灵酝）应用的初始代码：

1. 初始化 Prisma 并写好上面的 schema，配置好 Supabase 连接。
2. 写两个 Route Handler：
   - /api/distill：接收原料文本，使用上面 PRD 里定义的 DISTILL_PROMPT 调大模型，返回 JSON。
   - /api/chat：接收 skillId 和消息，从 DB 取出 flavor 和 rules，拼装 Prompt 后流式回复，末尾必须带“饮酒须知”免责。
3. 写一个简单的 /brew 页面（三步表单），用 useState 管理步骤，调用 /api/distill 回填第二步。
4. 写 /skill/[id]/page.tsx，做一个极简的聊天窗口，发送消息后展示 AI 打字机回复。
5. 所有页面使用 Tailwind CSS 书写，配色用深灰背景(#111827)+白色文字+紫色高亮按钮。

先输出项目结构和核心文件代码，不要写测试，代码要能直接运行。

1. 后续迭代清单（MVP 之后）
接入 pgvector，把 material 做切片 Embedding 检索（替代全文截取）。

接入 Creem 完成「出窖提取」的真实支付。

增加 RLHF 点赞/点踩，优化风味校准。

导出功能：将 Skill 打包为标准的 OpenAI Assistant 格式供下载。
