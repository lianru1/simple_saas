# skmint（灵酝）— AI 人格蒸馏 SaaS 平台

> 让创作者把自己的知识和经验"蒸馏"为可对话的 AI 人格，然后托管或出售。

---

## 1. 项目概览

| 项目 | 说明 |
|------|------|
| **产品名** | skmint / 灵酝 |
| **定位** | 出海 SaaS — 面向全球创作者的 AI 人格蒸馏与托管平台 |
| **基础仓库** | [simple_saas](https://github.com/fishfl/simple_saas)（Next.js + Supabase + Creem.io 启动套件） |
| **技术栈** | Next.js 15 (App Router) + TypeScript + Tailwind CSS + Supabase + Creem.io |
| **域名** | 本地: `localhost:3000` / 生产: [skmint.tech](https://skmint.tech) |
| **部署** | Vercel（已部署上线） |
| **语言** | 面向出海，界面默认英文，后续可加中文 |

---

## 2. 技术栈详情

| 层面 | 技术 | 用途 |
|------|------|------|
| 前端框架 | Next.js 15 (React 19) | 全栈框架，App Router |
| 语言 | TypeScript 5.7 | 类型安全 |
| 样式 | Tailwind CSS 3.4 + shadcn/ui | UI 组件 |
| 动画 | Framer Motion | 页面动效 |
| 后端数据库 | Supabase (PostgreSQL) | 用户认证 + 业务数据 |
| 支付 | Creem.io | 全球信用卡 + 支付宝收款 |
| AI SDK | Vercel AI SDK（后续添加） | LLM 流式调用 |
| ORM | Prisma（后续添加） | 数据库迁移与查询 |
| 部署 | Vercel | 生产环境托管 |
| 包管理 | npm | 依赖管理 |

---

## 3. 已安装的 AI 技能包（Skills）

本项目已安装两个技能包，存储在 `.claude/skills/` 目录（仅项目级别，非全局安装）：

### 3.1 设计 Skill：Impeccable（`pbakaus/impeccable`）

- **作者**：Paul Bakaus（前 Google 设计师）
- **用途**：网页 UI 设计美化、审查、打磨、动效、配色、排版
- **反 AI 模板化**：内置反模式库，避免生成千篇一律的"AI 风格"
- **命令**：`/impeccable init` 初始化，`/audit` 审查，`/polish` 打磨，`/critique` 批评
- **约定**：设计美化工作在当前会话进行，不新开会话

### 3.2 SEO Skill：Claude SEO（`AgriciDaniel/claude-seo`）

控制

- **包含**：25 个子技能（seo, seo-audit, seo-content, seo-schema, seo-technical 等）
- **用途**：全栈 SEO 优化（技术 SEO、内容策略、结构化数据、AI 搜索优化等）
- **约定**：**SEO 工作将新开一个独立会话进行，不污染设计/开发会话的上下文**

---

## 4. 当前项目状态

### 3.1 已有的（来自 simple_saas 启动套件）

- ✅ Supabase 邮箱 + Google OAuth 登录/注册
- ✅ 受保护的 Dashboard 页面（需登录）
- ✅ Creem.io 支付集成（订阅 + 积分）
- ✅ 积分系统（`customers.credits` + `credits_history` 表）
- ✅ Credits API（`/api/credits`）
- ✅ Creem Webhook 处理（`/api/webhooks/creem`）
- ✅ 落地页（Hero + Features + Pricing）
- ✅ 响应式设计 + 暗色/亮色模式
- ✅ shadcn/ui 组件库

### 4.2 已完成的（灵酝核心功能，2025-07-19）

- ✅ `/brew` — 酝酿向导页（三步表单 + 文件上传 + 模式选择）
- ✅ `/api/distill` — 蒸馏 AI 接口（DeepSeek）
- ✅ `/api/chat` — 品鉴聊天接口（流式 SSE）
- ✅ `/api/upload/extract` — 文件提取接口（.txt .md .pdf .docx）
- ✅ `/skill/[id]` — Skill 品鉴页（聊天窗口 + 下载/分享）
- ✅ 商业双轨逻辑（host 托管 + draw 买断，定价已接入）
- ✅ 积分系统接入（蒸馏扣 1 积分，余额检查）
- ✅ Dashboard Skills 列表（查看、复制链接、删除）
- ✅ 全站英文文案（个人化调性）
- ✅ OKLCH 暗色/亮色主题

### 4.3 待开发的（P0 → P3，详见 DEVELOPMENT_PLAN.md）

- ⬜ **P0**：定价页重写（替换模板）、Creem 商品 ID 替换、CTA 文案修复
- ⬜ **P1**：Draw 购买流程、配额扣减 bug 修复、移动端适配、SEO 基础、积分耗尽体验
- ⬜ **P2**：首页动效、品鉴页优化、仪表板改进、蒸馏流程优化、Header 导航改进
- ⬜ **P3**：品牌 UI 全面改造、Logo/视觉资产、pgvector 嵌入、RLHF、多语言

---

## 5. 已知问题（已记录，待修复）

### 5.1 注册流程问题

**问题 1：Supabase 邮箱确认导致注册后无法直接登录**

- **现象**：注册成功（Supabase Auth 有用户），但跳转 `/dashboard` 后中间件检测到无登录会话，重定向回 `/sign-in`
- **原因**：Supabase 默认开启邮箱确认，用户确认前 `getUser()` 返回 error
- **临时方案**：在 Supabase 后台关闭 "Confirm email"
- **最终方案**：上线前修改 `app/actions.ts` 的 `signUpAction`，判断 `data.session` 是否存在，无 session 时提示用户查收确认邮件

**问题 2：`Invalid path specified in request URL` 错误**

- **现象**：注册时偶发 Supabase 返回此错误
- **原因**：`.env.local` 修改后 Next.js 热更新可能未及时加载新的环境变量
- **解决**：修改 `.env.local` 后建议重启 `npm run dev`

### 5.2 `resetPasswordAction` 缺少 `return` 语句

- **位置**：`app/actions.ts` 第 89-124 行
- **说明**：多处 `encodedRedirect()` 调用前缺少 `return`，虽因 `redirect()` 内部抛异常而实际不影响执行，但代码不规范
- **状态**：待修复（低优先级）

### 5.3 `proxy.ts` 中间件文件名非标准

- **说明**：项目使用 `proxy.ts` 而非标准 `middleware.ts`，导出函数名为 `proxy` 而非 `middleware`。目前 Next.js 编译正常，但升级时需留意兼容性

---

## 6. 产品需求（来自灵酝 PRD v1.2）

### 6.1 品牌语言（开发时必须遵守）

| 功能逻辑 | UI/接口文案 | 变量/字段命名 |
|----------|------------|-------------|
| 上传素材 | 投入原料 | `raw_material` |
| 生成 AI 人设 | 定型风味 | `flavor_profile` |
| 核心规则 | 酿造铁律 | `brewing_rules` (Array) |
| 发布 Skill | 完成酝酿 | `/api/brew` |
| 买断下载 | 出窖提取 | `mode: 'draw'` |
| 托管调用 | 窖藏待饮 / 品鉴 | `/skill/[id]/taste` |
| 回答末尾免责 | 饮酒须知 | 固定后缀常量 `DISCLAIMER` |

### 6.2 核心功能

#### 6.2.1 酝酿向导页 (`/brew`)

三步表单：

1. 用户输入名称 + 原料文本
2. 点击「萃取风味」→ `POST /api/distill` → AI 回填表单（flavor + rules），用户可编辑
3. 点击「完成酝酿」→ Server Action 存入 Supabase → 跳转 `/skill/[id]`

#### 6.2.2 品鉴页 (`/skill/[id]`)

- 极简聊天窗口
- 调用 `/api/chat`，Vercel AI SDK `streamText` 实现打字机效果
- 限制：`quotaUsed >= quotaTotal` 且未登录/未付费时阻断

#### 6.2.3 商业双轨

- **host**（托管）：自动生成分享链接，任何人可免费试聊（次数由创作者设定 `quota_total`，默认 50 次）
- **draw**（出窖/买断）：免费试聊 **2 次**后显示付费墙，用户用积分买断后永久访问 + 可下载（2025-07-19 决策确认）

### 6.3 API 接口

#### `POST /api/distill`

```
Request:  { material: string }
Response: { flavor: string, rules: string[] }
```

使用 `DISTILL_PROMPT`（见 PRD 第 2.1 节）调用 LLM，返回纯 JSON。

#### `POST /api/chat`

```
Request:  { skillId: string, message: string }
Response: Streaming text (Content-Type: text/plain)
```

查库 → 构建 Prompt（`buildChatPrompt`）→ LLM 流式返回，尾部追加「饮酒须知」。

### 6.4 数据模型（Prisma Schema，尚未创建）

```prisma
model User {
  id        String   @id @default(uuid())
  email     String?  @unique
  skills    Skill[]
  createdAt DateTime @default(now())
}

model Skill {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String           // 佳酿名称
  flavor      String           // 风味档案（100 字以内第一人称）
  rules       String[]         // 酿造铁律（3-5 条）
  material    String?          // 原始原料文本
  mode        String   @default("host")  // 'host' | 'draw'
  priceCents  Int      @default(19900)
  quotaUsed   Int      @default(0)
  quotaTotal  Int      @default(50)
  createdAt   DateTime @default(now())
}
```

### 6.5 非功能性要求

1. **UI 极简主义**：主色 `#7B68EE` 雾紫，深色背景 `#111827`，白色文字
2. **安全性**：API Key 存 `.env.local`，不提交 Git
3. **错误处理**：AI 超时/报错 → Toast "本次酝酿中断，请重试"
4. **类型安全**：前后端共享类型，禁用 `any`
5. **出海优先**：界面英文，支付用 Creem（支持全球信用卡 + 支付宝）

### 6.6 后续迭代（MVP 之后）

- pgvector 嵌入检索（替代原料全文截取）
- Creem 买断支付对接
- RLHF 点赞/点踩优化
- 导出为 OpenAI Assistant 格式

### 6.7 商业模式与定价（已确定：MVP 仅积分包）

> **2025-07-19 决策**：MVP 只用积分包模式，会员订阅延后讨论。理由是——积分已经涵盖了"蒸馏消耗"和"买断 Skill"两个场景，再加订阅会让 MVP 变复杂。等验证了用户愿意付费后，再考虑加订阅制。

#### MVP 收费类型（2 种）

| # | 收费类型 | 用户付钱的原因 | 谁来定价 | Creem 配置 |
|---|---------|-------------|---------|-----------|
| ① | 积分包 | 买积分，用于蒸馏 + 买断 Skill | 平台固定价格 | CREDITS_TIERS |
| ② | 买断 Skill | 用积分兑换，永久下载某个 Skill | 创作者定积分价 | 不直接在 Creem 建商品 |

#### 积分体系流程

```
用户付 $ → 买积分包（Creem 固定价格商品）
         → 积分到账（customers.credits）
         → 用积分兑换：
           ├── 蒸馏一次 Skill（消耗 N 积分）
           └── 买断一个 Skill（消耗创作者设定的积分价）
         → 你定期按积分结算给创作者
```

#### 为什么用积分

- Creem 商品价格必须由你预先设定，但 Skill 买断价由创作者自己定
- 积分作为"内部货币"绕开这个矛盾
- 用户先充值积分，再用积分兑换，就像游戏金币
- 现有代码已有完整的积分系统（`customers.credits` + `credits_history` + `CREDITS_TIERS`），MVP 开发量最小

#### 关键数据库字段

- `customers.credits` — 用户当前积分余额
- `Skill.priceCredits` — 创作者设定的积分价格（待加到 Schema）
- `Skill.mode` — `'host'`（托管/订阅制）或 `'draw'`（买断/积分兑换）

---

## 7. SEO 策略约定

### 7.1 目标关键词

经用户自行调研，以下关键词有搜索量且竞争可行：

| 类型 | 关键词 |
|------|--------|
| **核心词** | distill、skill distillation、mint skills、brew skills |
| **长尾词** | Distill Your Experience into Skills、distill knowledge into AI、turn expertise into AI skill |
| **品牌词** | skmint、skmint AI |

### 7.2 SEO 工作约定

- **独立会话**：SEO 优化工作（关键词分析、内容策略、技术 SEO、Schema 等）在**新开对话窗口**中进行
- **不污染上下文**：当前会话专注于产品设计和功能开发，SEO 不在此讨论
- **使用技能包**：新会话中使用已安装的 Claude SEO（25 个子技能）

### 7.3 技术 SEO 待办

- [ ] 完善 metadata（title、description、keywords、og:image）
- [ ] 生成 sitemap.xml
- [ ] 生成 robots.txt
- [ ] Schema.org 结构化数据（SoftwareApplication、FAQ）
- [ ] hreflang 多语言标记（后续加中文时）
- [ ] Core Web Vitals 优化

---

## 8. 🚨 最重要的协作规则（全项目期遵守）

### 8.1 开发者背景

**本项目使用者（就是写这个文档的人要求的人）是不懂编程的小白。** 所有技术决策不能由 AI 单方面做出。

### 8.2 技术决策流程（铁律）

当遇到任何技术选择时（选什么库、什么架构、怎么实现），AI 必须：

1. **列出所有可行方案**（至少 2-3 个）
2. **用通俗语言解释每个方案**：
   - 这个方案是什么（用比喻或日常例子）
   - 优点是什么
   - 缺点是什么
   - 适合什么场景
3. **给出推荐意见**（明确说"我推荐方案 X，因为……"）
4. **由用户决定**，不替用户做主

### 8.3 禁止的行为

- ❌ 不要假设用户懂技术术语（middleware、ORM、migration、RLS 等），首次出现时必须解释
- ❌ 不要替用户做技术选型（"我已经帮你装了 XXX"）
- ❌ 不要在用户没同意的情况下删除或大幅修改已有代码
- ❌ 不要跳过解释直接写代码（先说明要改什么、为什么改）
- ❌ 不要一次性改太多文件，分步骤来，每步确认

### 8.4 推荐的沟通方式

- ✅ 每次改动前先说清楚：改哪个文件、改什么、为什么
- ✅ 写完代码后解释：这段代码做了什么
- ✅ 遇到报错时：用大白话解释错误原因，然后给修复方案
- ✅ 经常总结当前进度，让用户知道做到哪了

### 8.5 会话分工约定

- **当前会话**（本窗口）：产品设计美化 + 功能开发
- **SEO 会话**（新开窗口）：所有 SEO 相关工作，使用 Claude SEO 技能包
- **原因**：SEO 工作需要大量网页搜索和分析，会占用很多上下文空间，分离后不影响设计/开发工作的连贯性
- **共享资源**：两个会话共用同一个代码仓库、同一个 CLAUDE.md、同一套技能包

---

## 9. 项目文件结构

```
skmint/
├── app/
│   ├── actions.ts              # Server Actions（登录/注册/密码重置）
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 落地页（Hero + Features + Pricing）
│   ├── (auth-pages)/           # 认证页面（登录/注册/忘记密码）
│   ├── auth/callback/route.ts  # OAuth 回调
│   ├── dashboard/              # 用户仪表板（受保护页面）
│   ├── api/credits/            # 积分 API
│   └── api/creem/              # Creem 支付 API + Webhook
├── components/
│   ├── ui/                     # shadcn/ui 基础组件
│   ├── dashboard/              # Dashboard 业务组件
│   └── *.tsx                   # header, footer, pricing 等
├── config/subscriptions.ts     # 订阅/积分产品配置
├── hooks/                      # 自定义 Hooks（use-user, use-credits 等）
├── lib/                        # 第三方库配置（Creem SDK, utils）
├── types/                      # TypeScript 类型定义
├── utils/supabase/             # Supabase 客户端（browser/server/middleware/service-role）
├── supabase/migrations/        # 数据库迁移 SQL
├── proxy.ts                    # Next.js 中间件（认证守卫）
├── .env.local                  # 环境变量（不提交 Git）
└── 灵酝prd.md                  # 原始产品需求文档
```

---

## 10. 品牌视觉资产

> **2025-07-19**：品牌色 `#7B68EE` 需要设计师调校，视觉资产（Logo、品牌字、标语、装饰图）尚未准备好。以下为生图提示词，用于 Midjourney / DALL·E / Stable Diffusion。

### 10.1 品牌关键词

- 核心隐喻：酿酒、蒸馏、窖藏、品鉴
- 氛围：手艺感、私密、沉静、温暖
- 不是：科技炫酷、AI 模板化、企业商务
- 中文名「灵酝」= spirit + brew，英文名「skmint」= skill + mint

### 10.2 Logo 提示词

```
A minimalist logo for a brand called "skmint" — a platform that distills human expertise into AI personalities. The brand metaphor is craft distillery meets personal knowledge. Design a clean, iconic mark that combines: a copper alembic still OR a glass bottle OR a drop of liquid, with a subtle nod to a brain/synapse or a fingerprint. Style: Japanese minimalism meets artisan apothecary. Colors: muted purple (#7B68EE) on deep charcoal (#111827). No gradients. Vector logo, white background, centered composition. The mark should work at small sizes (favicon) and feel premium and intimate — not corporate, not tech-bro. --no text --no complex detail --style minimalist
```

~~~
我自己改的一版
Professional graphic design logomark for "skmint" — no text, no lettering. Concept: a geometric abstraction of an oak barrel using precise negative space. Visualize a softened rounded-square container where a single, delicate horizontal line bisects the form (evoking the liquid level and the cooper's hoop), accompanied by a perfectly circular aperture or dot representing a drop of distilled essence. Execution must follow Swiss minimalist branding principles: optical balance, mathematical proportions, grid-based construction, and absolute simplicity. Avoid any literal drawing of wood, barrels, or liquid; imply the metaphor through pure form. Style: modern tech-meets-craft, premium and confident — not illustrative, not rustic. Color: flat muted purple #7B68EE on pure white background. Single-weight clean stroke, vector precision, zero gradients, zero textures, zero 3D. Designed explicitly to function as a favicon, app icon, and social avatar.
~~~

### 10.3 品牌字（Wordmark）提示词

```
下面也是我改过的，这个更符合我的感觉
Hand-drawn calligraphy wordmark for "skmint", elegant modern script lettering with a flowing, dancing baseline. Thick-to-thin ink strokes, visible pen pressure, and a subtle ink bleed texture on paper — like a master distiller's handwritten label on a limited-edition bottle. Delicate ligature connecting 'm' to 'i' and 't', flourishes on the descenders. Warm, intimate, artisanal, and slightly imperfect (not vector-perfect). Muted purple #7B68EE ink color, rendered on a deep charcoal #111827 textured paper background. Minimalist, high-end craft aesthetic, no neon, no gradients, no digital gloss.

(printed text, sans-serif, block letters, computer font, vector outline, symmetrical, rigid baseline:1.4), (childish handwriting, chicken scratch)
```

### 10.4 中文品牌字提示词

```
Chinese calligraphy-inspired lettering for "灵酝" (spirit brew). Style: semi-cursive (行书) with modern restraint — not traditional scroll, not graffiti. The characters should feel fluid and warm, like the label on a cherished bottle of aged wine, handwritten by the vintner. Ink on handmade paper texture, slight bleed at the stroke edges. Color: muted purple #7B68EE on deep charcoal #111827 background. The brand bottles human expertise into AI personas — the lettering should evoke "craft, personal, time-aged, precious" — not factory-printed, not digital.
```

(暂缓)

### 10.5 标语（Tagline）

备选方案（待确认）：

- "Your mind, bottled." — 简洁，个人化
- "Distill your expertise. Share your spirit." — 当前使用中（用这个）
- "Everyone has a voice. Bottle yours." — 更包容
- "Brew yourself." — 极简

### 10.6 页面装饰图提示词

**Hero 区背景/插画**：

```
A warm, atmospheric illustration for a website hero section. Scene: the interior of a small countryside estate cellar at dusk — oak barrels stacked along stone walls, soft amber light filtering through a small high window, dust motes floating in the light. On an old wooden worktable in the foreground: scattered handwritten notes, a leather-bound journal open, a single dark glass bottle catching the light, a wax seal stamp. The feeling is quiet, personal, timeless — like a master vintner's private study, not a factory. Color palette: muted purple (#7B68EE) accents on deep charcoal (#111827) shadows, warm amber (#C88A4A) highlights. No faces, no text, no UI elements. Horizontal composition, subtle film grain. Not scientific, not laboratory, not industrial. --ar 16:9
```

**How It Works 区配图**：

```
Three-panel triptych illustration for a knowledge craft platform. The visual metaphor is artisan winemaking in a countryside estate — not a laboratory, not a factory.

Panel 1 — "Gather": A weathered wooden table in a sunlit estate garden. Scattered across it: handwritten letters, old notebooks, photographs, a few sprigs of dried herbs. The raw ingredients of a life — messy, personal, real. Warm morning light, shallow depth of field.

Panel 2 — "Age": Inside the estate cellar. Rows of oak barrels with chalk marks and dates. One barrel in the foreground, slightly open — a warm, faintly glowing amber light seeps from within, suggesting something transforming quietly inside. Stone walls, cool shadows, a single copper tasting cup on a barrel top. The feeling is patience and craft — slow transformation, not mechanical processing.

Panel 3 — "Bottle": A single dark glass bottle on an aged wooden shelf, sealed with deep purple wax. A handwritten parchment label tied with twine. Soft, warm light catches the bottle from one side. Below the shelf, a pair of tasting glasses wait. Ready to be shared. Intimate, precious, complete.

Style: painterly line art with selective muted color accents (purple #7B68EE, warm amber #C88A4A, deep charcoal #111827). Not watercolor, not vector-flat, not scientific diagram. Loose but deliberate — like an artisan's sketchbook. Three square panels, equal size. --ar 1:1
```

**纹理/背景装饰**：

```
Subtle background texture for a dark-themed craft website. Fine handmade paper grain, barely visible. Faint hints of: wood grain from old barrel staves, the circular ring mark left by a glass on wood, and the gentle irregularity of handmade cotton paper. Deep charcoal (#111827) base. The texture should be so subtle it's almost not there — only visible on closer look. Seamless tileable. No text, no logos, no obvious patterns, no cork texture (too on-the-nose). --ar 1:1 --style raw
```

### 10.7 资产状态追踪

| 资产 | 状态 | 文件位置 |
|------|------|---------|
| Logo (icon) | ✅ 已完成 | `public/images/logo.png` |
| Wordmark (skmint) | ✅ 已完成 | `public/images/品牌字.png` |
| 中文品牌字 (灵酝) | ⬜ 暂缓 | — |
| 标语 | ⬜ 待确认 | 从备选方案中选 |
| Hero 插画 | ✅ 已完成 | `public/images/页面装饰图.png` |
| 三步流程插画 (Gather) | ✅ 已完成 | `public/images/区配图1-gather.png` |
| 三步流程插画 (Age) | ✅ 已完成 | `public/images/区配图2-age.png` |
| 三步流程插画 (Bottle) | ✅ 已完成 | `public/images/区配图3-Minted​.png` |
| 背景纹理 | ✅ 已完成 | `public/images/纹理.png` |
| Favicon | ⬜ 依赖 Logo | Logo 确定后可基于 `logo.png` 生成 |

---

## 11. 重要决策记录

> 每次双方确认的决策都记录在此，按时间倒序。

### 2025-07-19

| 决策 | 结论 | 理由 |
|------|------|------|
| MVP 商业模式 | **仅积分包**，不做会员订阅 | 积分已覆盖蒸馏 + 买断两个场景，再加订阅会让 MVP 变复杂。验证付费意愿后再考虑订阅 |
| Draw 免费试聊 | **2 次** | 给买家尝尝味道，1 次太少，3 次太多 |
| 积分定价 | **$9=3积分、$15=6积分、$20=9积分**（每积分成本递减：$3 → $2.50 → $2.22） | 用户确认。价格递减逻辑合理，每档都有吸引力 |
| 域名 | **skmint.tech** | 最终确定，不再更改 |
| 品牌色 | `#7B68EE` 需要设计师调校 | 需要配合实际视觉资产一起调整 |
| 视觉资产 | Logo、品牌字、标语、装饰图全部需要 | 用户自行生图后提供给我 |
| 开发计划 | P0→P1→P2→P3 四轮推进 | 先修阻塞问题，再补完整体验，最后打磨 |
| CLAUDE.md 维护 | 每次讨论确认后同步更新 | 作为项目的唯一事实来源 |

---

## 12. 环境变量参考

| 变量 | 用途 | 获取位置 |
|------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API 地址 | Supabase → Settings → Data API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 客户端密钥（公开） | Supabase → Settings → Data API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥（保密） | Supabase → Settings → Data API → service_role key |
| `CREEM_API_KEY` | Creem 支付密钥 | Creem → Developers → API Keys |
| `CREEM_WEBHOOK_SECRET` | Creem Webhook 签名密钥 | Creem → Developers → Webhooks |
| `CREEM_API_URL` | Creem API 地址 | 测试: `https://test-api.creem.io/v1` / 正式: `https://api.creem.io` |
| `CREEM_TEST_MODE` | 是否测试模式 | `true`（测试）/ `false`（正式） |
| `BASE_URL` | 网站地址 | 本地: `http://localhost:3000` / 线上: `https://skmint.tech` |
| `CREEM_SUCCESS_URL` | 支付成功后跳转地址 | `https://skmint.tech/dashboard` |
| `OPENAI_API_KEY` 或 `ANTHROPIC_API_KEY` | AI 模型密钥（后续添加） | OpenAI/Anthropic 后台 |
