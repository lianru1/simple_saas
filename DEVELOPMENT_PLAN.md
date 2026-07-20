# 灵酝 skmint — 超详细开发计划

> 最后更新：2026-07-21
> 当前状态：**P0 + P1 已完成，进入 P2 体验打磨**

---

## 一、当前完成度总览

### ✅ 已完成

| 模块 | 状态 | 说明 |
|------|------|------|
| 落地页 `/` | ✅ | 个性化文案 + 登录感知 CTA + Pricing |
| 认证系统 | ✅ | Supabase 邮箱 + Google OAuth |
| 酝酿向导 `/brew` | ✅ | 三步表单：原料输入 → AI 蒸馏 → 模式/定价 |
| 文件上传 `/api/upload/extract` | ✅ | .txt .md .pdf .docx，最大 4MB |
| 蒸馏 API `/api/distill` | ✅ | DeepSeek 调用，返回 flavor + rules，扣 3 积分 |
| 品鉴聊天 `/skill/[id]` | ✅ | 流式聊天 + 统一计价 + Draw 付费墙 + 下载 |
| 品鉴画廊 `/taste` | ✅ | 公开 Skill 浏览页，筛选 All/Host/Draw，卡片入场动画 |
| 仪表板 `/dashboard` | ✅ | 积分余额 + Skills 列表 + 删除 |
| 积分系统 | ✅ | 新用户送 3 积分，蒸馏扣 3 积分 |
| 聊天计价 | ✅ | 平台统一定价：3 条免费 + 10 条/1 积分（**无例外**） |
| Draw 购买 | ✅ | `/api/skills/purchase` + 付费墙 + `purchases` 表 |
| 分成追踪 | ✅ | `credits_history.skill_id` + `skill_conversations` 表 |
| 数据库 | ✅ | skills + purchases + skill_conversations 表 + RLS |
| Creem 商品 ID | ✅ | 用户已在 Creem 后台创建 3 个积分包，ID 已填入 config |
| SEO 基础 | ✅ | sitemap.xml + robots.txt + og:image |
| 暗色/亮色模式 | ✅ | OKLCH 色彩体系 |
| Header 导航 | ✅ | Home / How It Works / Taste / Pricing + 登录感知 |

### ⚠️ 存在问题的模块

| 模块 | 问题 | 严重程度 |
|------|------|---------|
| 定价页 `PricingSection` | ✅ 已重写，展示积分包 | — |
| 移动端适配 | 未系统性测试 | 🟡 中 |
| 错误处理 | 多处 try-catch 只打 console.error | 🟢 低 |

---

## 二、当前商业模型（已确认）

### 聊天计价（平台统一定价，无例外）

```text
任何人 → 同一个 Skill 前 3 条免费 → 之后每 10 条 1 积分
  ├── 创建者 → 照付（消耗平台 token）
  ├── Draw 购买者 → 照付（买断 = 下载权，不包含免费聊天）
  ├── 普通登录用户 → 照付
  └── 未登录用户 → 3 条免费后需登录

聊天费按 skill_id 追踪 → 后续分成给创作者
```

### 蒸馏计价

```text
蒸馏 1 次 = 3 积分（刚好消耗注册送的 3 积分）
```

### Draw 买断

```text
创作者定价（积分）
买断权益：永久下载/导出
买断后聊天仍按统一计价（不免费）
```

### 积分包（Creem 支付）

```text
$9  = 3 积分
$15 = 6 积分
$20 = 9 积分
```

---

## 三、待开发清单（按优先级排列）

---

### ✅ P0 — 已完成

#### ✅ P0-1：重写 Pricing 页面 — 已完成

- ✅ 删除模板 `SUBSCRIPTION_TIERS`（Starter/Business/Enterprise 死代码）
- ✅ 移除 Creem 商品 ID 的"待替换"注释
- ✅ 积分包描述更新为当前计价（蒸馏 3 积分/次，聊天 10 条/积分）
- ✅ 定价区文案说明积分用途

#### ✅ P0-2：CTA 按钮文案适配登录状态 — 已完成

- ✅ Hero CTA 加登录感知副文案：已登录 → "Your minted minds are waiting."，未登录 → "3 credits included."

---

### 🟡 P1 — MVP 完整体验（大部分已完成，少量收尾）

#### ✅ P1-1：Draw 模式购买流程 — 已完成

- ✅ 购买 API `POST /api/skills/purchase`
- ✅ 品鉴页付费墙（未购买时显示价格和解锁按钮）
- ✅ 购买后显示 Download 按钮
- ✅ `purchases` 表 + RLS
- ✅ 积分扣减 + 流水记录（含 skill_id）

#### ✅ P1-2：聊天计价统一 — 已完成

- ✅ `app/api/chat/route.ts` 重写：统一按条计费
- ✅ `skill_conversations` 表追踪每个用户对每个 Skill 的聊天量
- ✅ 3 条免费 + 10 条/1 积分
- ✅ 积分余额检查，不足时返回 402
- ✅ 创建者和购买者不再有免费后门
- ✅ `credits_history.skill_id` 分成追踪

#### ⬜ P1-3：移动端响应式适配

**当前状态**：使用了 Tailwind 响应式类（`md:` breakpoint），但没有系统测试。

**需要检查的页面**：

| 页面 | 重点检查 |
|------|---------|
| `/` 落地页 | Hero 标题是否换行正常，How It Works 三列是否堆叠 |
| `/brew` | 三步表单在手机上是否可操作，文件上传区域是否够大 |
| `/skill/[id]` | 聊天输入框是否在键盘上方，消息气泡宽度 |
| `/taste` | 卡片网格是否堆叠，筛选标签是否溢出 |
| `/dashboard` | Skills 卡片网格是否堆叠，按钮是否会溢出 |
| `/sign-in` `/sign-up` | 表单是否居中 |

**涉及文件**：多个页面，逐个检查

**工作量**：约 2-3 小时

---

#### ✅ P1-4：SEO 基础设施 — 已完成

- ✅ `app/sitemap.ts` — 动态 sitemap（含所有 skill 详情页）
- ✅ `app/robots.ts` — robots.txt
- ✅ `app/layout.tsx` — og:image + twitter:image

#### ✅ P1-5：积分耗尽体验 — 已完成

- ✅ `/brew` 进入时检查积分，不足时顶部提示
- ✅ 积分不足时 Step 3 提交按钮置灰
- ✅ 聊天积分不足时返回明确错误提示
- ✅ Dashboard 积分卡片显示余额

#### ✅ P1-6：公开浏览页 `/taste` — 已完成

- ✅ 所有已发布 Skill 的卡片网格
- ✅ All / Host / Draw 筛选
- ✅ Framer Motion 入场动画
- ✅ 空状态引导文案 + "Bottle the First Persona" CTA
- ✅ Header 导航已加 "Taste" 入口

---

### 🟢 P2 — 体验打磨（下一轮）

#### P2-1：首页动画与动效

**当前状态**：页面是静态的，没有入场动画。

**impeccable 技能要求**：

- 入场动画使用 Framer Motion（项目已安装）
- `@media (prefers-reduced-motion: reduce)` 降级
- 每个 section 的动画应配合其内容（不只是统一的 fade-in）

**建议**：

- Hero：标题逐字淡入（stagger 50ms）
- How It Works：三列依次从下方滑入（stagger 200ms）
- Why 区域：在视口内时触发
- 整体调性：克制的、手艺感的动效，不是花哨的

**涉及文件**：

- `app/page.tsx`
- 可能需要新建 `components/landing/` 下的动画组件

**工作量**：约 2-3 小时

---

#### P2-2：品鉴页体验优化

**当前问题**：

1. 消息列表没有"AI 正在输入..."的三点跳动动画——目前只有一个静态 spinner
2. 没有对话历史——刷新页面消息全部丢失
3. 没有"清空对话"按钮
4. 欢迎语太简单——可以展示更多关于这个 Skill 的信息
5. 错误状态下的重试按钮不明显

**改进**：

1. 打字指示器：三点依次跳动的小动画
2. 对话历史：存 localStorage，刷新后恢复（不做服务端存储，那是后续迭代）
3. 欢迎卡片：展示 flavor profile 摘要 + rules 列表
4. 错误消息旁增加 "Retry" 按钮

**涉及文件**：

- `app/skill/[id]/page.tsx`

**工作量**：约 2 小时

---

#### P2-3：仪表板改进

**当前问题**：

1. 空状态只有一个按钮——可以加一些示例/引导
2. 删除了 Skill 后没有撤销提示
3. Skills 多了没有搜索/筛选
4. 积分卡片可以展示更多信息（"还可蒸馏 N 次，可品鉴约 N 条"）

**改进**：

1. 空状态加引导文案
2. 删除加确认 + Toast
3. Skills 列表加搜索框（客户端过滤即可）
4. 积分卡片展示"还可蒸馏 N 次，可品鉴约 N 条"

**涉及文件**：

- `app/dashboard/page.tsx`
- `components/dashboard/skill-card.tsx`

**工作量**：约 2-3 小时

---

#### P2-4：蒸馏流程改进

**当前问题**：

1. Step 1 的 name 输入框在"原料"上面，但逻辑上应该先填原料再取名
2. 蒸馏失败时，用户需要重新点按钮——应该自动重试 1 次
3. 没有"原料预览/编辑"模式——上传了文件后只能看到追加的文本，但不能单独删除某个文件的内容
4. Step 2 的 "Looks like me" 按钮——如果 flavor 或 rules 是空的，点完到 Step 3 预览会很尴尬

**改进**：

1. 调整 Step 1 布局：原料在上，名字在下（或 AI 蒸馏后建议名字）
2. 蒸馏失败自动重试 1 次，2 次都失败再提示
3. AI 蒸馏成功后，如果用户没填名字，从 flavor 中提取一个建议名字
4. Step 2 → Step 3 之间加校验：flavor 不为空，至少 1 条 rule

**涉及文件**：

- `app/brew/page.tsx`
- `app/api/distill/route.ts`

**工作量**：约 2 小时

---

#### P2-5：Header 导航改进

**当前问题**：

1. 已登录用户在非 Dashboard 页面时，Header 显示 "Dashboard" 按钮 + "Sign out"——但 `/brew` 入口不够醒目
2. Dashboard 页面 Header 不显示导航链接

**改进**：

1. 已登录用户 Header 始终显示 "Brew" 按钮（主要 CTA）
2. 用户头像/名字在下拉菜单中（而不是直接显示邮箱）

**涉及文件**：

- `components/header.tsx`

**工作量**：约 1.5 小时

---

### 🔵 P3 — 后续迭代（MVP 之后）

#### P3-1：品牌 UI 全面改造

**PRD 要求的视觉方向**：

- 主色：`#7B68EE` 雾紫
- 深色背景：`#111827`
- "酿酒/品鉴"主题贯穿

**需要做的**：

- 重新设计 Logo（目前使用 `public/images/logo.png`）
- 统一所有组件的品牌色
- 设计"酿酒"主题的插画/图标系统
- 考虑纸质纹理/暖色调细节（呼应"手艺感"）

**涉及文件**：几乎所有 UI 文件

**工作量**：约 1-2 天，建议用 impeccable skill 的 `craft` 命令

---

#### P3-2：pgvector 嵌入检索

- 目前 AI 蒸馏时，原料文本是完整塞进 prompt 的
- 当原料很长时（如一本书），需要先做嵌入检索，只取最相关的段落
- Supabase 原生支持 pgvector

**工作量**：约 1 天

---

#### P3-3：RLHF 点赞/点踩

- 品鉴聊天中，用户可以对 AI 回复点赞/点踩
- 数据收集后用于优化 prompt 或 fine-tune

**工作量**：约 1-2 天

---

#### P3-4：创作者收益仪表板

- 展示每个 Skill 的品鉴次数、购买次数
- 积分收入统计（基于 `credits_history.skill_id` 和 `skill_conversations`）
- 结算功能（平台定期按积分结算给创作者）

**工作量**：约 2-3 天

---

#### P3-5：导出为 OpenAI Assistant 格式

- 用户可以将自己蒸馏的人格导出为 OpenAI Custom GPT
- 导出为 JSON 配置文件

**工作量**：约 1 天

---

#### P3-6：多语言支持

- 先加中文（简体）
- 后续加日语、韩语（亚洲市场）
- 需要 i18n 方案（next-intl 推荐）

**工作量**：约 2-3 天

---

## 四、技术债清单

| # | 问题 | 位置 | 影响 | 优先级 |
| --- | --- | --- | --- | --- |
| 1 | ~~Pricing 页面仍是通用模板~~ | ✅ 已修复 | — | — |
| 2 | 数据库迁移需手动执行 | `supabase/migrations/` | 两个迁移脚本需在 Supabase SQL Editor 运行 | P1 |
| 3 | `resetPasswordAction` 缺少 `return` | `app/actions.ts:98-125` | 不会阻止执行但代码不规范 | P3 |
| 4 | `proxy.ts` 非标准中间件文件名 | `proxy.ts` | Next.js 升级时需留意 | P3 |
| 5 | AI 调用无超时控制 | `lib/ai-client.ts` | DeepSeek 可能长时间无响应 | P2 |
| 6 | 蒸馏结果无缓存 | `app/api/distill/route.ts` | 相同原料重复蒸馏浪费 API 费用 | P3 |
| 7 | 聊天无速率限制 | `app/api/chat/route.ts` | 已登录用户可能被滥用刷 API 费用 | P1 |
| 8 | `any` 类型 | `components/header.tsx:11` | HeaderProps user 用了 `any` | P2 |

---

## 五、建议执行顺序

```text
✅ 已完成：
  数据库表设计 → Creem 商品创建 → 聊天统一计价
  → Draw 购买流程 → /taste 画廊 → SEO 基础
  → P0 收尾（Pricing 重写 + CTA 文案）

📋 下一轮（P2 打磨）：
  P2-1 首页动效 → P2-2 品鉴页优化 → P2-3 仪表板改进
  → P2-4 蒸馏流程改进 → P2-5 Header 导航

📋 再下一轮：
  P2-2 品鉴页优化 → P2-3 仪表板改进 → P2-4 蒸馏流程改进
  → P1-3 移动端适配 → P2-5 Header 导航

📋 后续迭代（MVP 之后）：
  P3-1 品牌 UI → P3-2 pgvector → P3-3 RLHF → P3-4 创作者收益仪表板
```

---

## 六、验证清单

每次完成一轮后，逐项验证：

- [x] `npm run build` 0 错误
- [ ] 首页：CTA 根据登录状态正确跳转
- [ ] 注册 → 自动获得 3 积分
- [ ] `/brew`：上传文件 → AI 蒸馏 → 编辑 → 选择 Host/Draw → 提交（扣 3 积分）
- [ ] `/brew`：积分不足时正确阻断
- [ ] `/skill/[id]`：聊天流式输出正常
- [ ] `/skill/[id]`：前 3 条免费，之后按 10 条/1 积分收费（**包括创建者和购买者**）
- [ ] `/skill/[id]`：聊天积分不足时返回错误提示
- [ ] `/skill/[id]`：Draw 模式显示付费墙和解锁按钮
- [ ] `/skill/[id]`：Draw 购买后显示 Download 按钮
- [ ] `/taste`：所有已发布 Skill 可见，筛选功能正常
- [ ] `/dashboard`：Skills 列表正确显示，删除功能正常
- [ ] Pricing 页面展示积分包（非通用 SaaS tier）
- [ ] Creem 支付：测试模式下可正常购买积分
- [ ] 移动端：所有页面可操作，不溢出
- [ ] 暗色模式：所有页面切换正常

---

## 七、已决策事项

| # | 决策 | 结论 | 日期 |
|---|------|------|------|
| 1 | MVP 商业模式 | **仅积分包**，不做会员订阅 | 2025-07-19 |
| 2 | Draw 免费试聊 | **3 次**（与普通聊天统一） | 2025-07-19 |
| 3 | 积分定价 | **$9=3积分、$15=6积分、$20=9积分** | 2025-07-19 |
| 4 | 域名 | **skmint.tech** | 2025-07-19 |
| 5 | 品牌色 | `#7B68EE`，需设计师调校 | 2025-07-19 |
| 6 | 聊天计价模型 | **平台统一定价，无例外**（创建者/购买者也付费） | 2026-07-21 |
| 7 | Draw 买断权益 | **仅下载导出**，不包含免费聊天 | 2026-07-21 |
| 8 | 蒸馏积分消耗 | **3 积分**（消耗完注册赠送的积分） | 2026-07-21 |
| 9 | 分成追踪 | 每笔聊天费和购买费记录 `skill_id`，后续结算 | 2026-07-21 |

---

## 八、未决策事项（需要用户确认）

1. **会员订阅要不要做？** 积分已经覆盖了蒸馏 + 聊天 + 买断三个场景。等验证了付费意愿后再考虑。
2. **品牌色**：是否严格用 `#7B68EE`（雾紫），还是要设计师调一个更好的？
3. **Logo**：目前使用 `public/images/logo.png`，是否需要重新设计？
4. **聊天速率限制**：已登录用户可能刷 API，需要加限制吗？建议 20 条/分钟。
