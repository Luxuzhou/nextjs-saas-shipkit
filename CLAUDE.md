# SaaS Starter Enhanced - 项目规范

## 项目简介
基于 Vercel 官方 next-saas-starter，增强为面向出海独立开发者的全功能 SaaS Starter Kit。
在已有的 Auth + Stripe + Dashboard 基础上，新增：管理后台、邮件系统、多支付抽象层、国际化、AI 用量计费。

## 已有技术栈（不要更换）
- 框架：Next.js 15 (App Router + Turbopack)
- 语言：TypeScript (strict)
- 数据库：PostgreSQL + Drizzle ORM
- Auth：自定义 JWT（jose + bcryptjs），httpOnly cookie
- 支付：Stripe SDK
- CSS：Tailwind CSS v4
- UI：shadcn/ui + Radix UI
- 图标：Lucide React
- 验证：Zod
- 数据获取：SWR
- 包管理：pnpm

## 已有功能（不要重复实现，不要破坏）
- 邮箱密码注册/登录/登出
- 团队管理（owner/member 角色，邀请成员）
- Stripe Checkout + Webhook + Customer Portal
- 定价页面（从 Stripe 动态获取）
- Dashboard（General / Security / Activity 三个 tab）
- 活动日志（SIGN_UP, SIGN_IN 等事件记录）
- 路由保护中间件（未登录重定向到 /sign-in）
- Server Action + Zod 验证包装器

## 已有文件结构（重要：了解后再动手）
```
app/
  (dashboard)/          # 已有：landing page + dashboard
    layout.tsx          # 顶部导航栏
    page.tsx            # Landing page
    pricing/            # 定价页
    dashboard/          # 用户 dashboard
      general/          # 账户设置
      security/         # 密码修改 + 删除账户
      activity/         # 活动日志
  (login)/              # 已有：登录注册
    actions.ts          # 所有 auth Server Actions
    login.tsx           # 登录表单组件
    sign-in/
    sign-up/
  api/
    stripe/             # 已有：Stripe checkout + webhook
    team/               # 已有：获取团队信息
    user/               # 已有：获取用户信息
components/ui/          # 已有：shadcn 组件
lib/
  auth/                 # 已有：JWT session + middleware
  db/                   # 已有：Drizzle client + schema + queries
  payments/             # 已有：Stripe 集成
  utils.ts              # 已有：cn() 工具函数
```

---

## 文件所有权（严格遵守，禁止跨界）

### teammate-admin 专属
```
app/(admin)/                    # 新建：管理后台路由组
  admin/
    layout.tsx
    page.tsx                    # 管理后台首页（数据看板）
    users/page.tsx              # 用户管理
    activity/page.tsx           # 全局活动日志
    subscriptions/page.tsx      # 订阅管理
app/api/admin/                  # 新建：管理后台 API
  users/route.ts
  stats/route.ts
  activity/route.ts
components/admin/               # 新建：管理后台组件
  StatsCard.tsx
  UserTable.tsx
  Charts.tsx
lib/db/admin-queries.ts         # 新建：管理后台专用查询
lib/db/admin-auth.ts            # 新建：admin 权限检查工具函数
```

### teammate-email 专属
```
lib/email/                      # 新建：邮件系统
  send.ts                       # Resend 发送封装
  templates/                    # React Email 模板
    WelcomeEmail.tsx
    ResetPasswordEmail.tsx
    InvitationEmail.tsx
    SubscriptionEmail.tsx
app/(login)/forgot-password/    # 新建：忘记密码页面
  page.tsx
app/api/auth/                   # 新建：auth 增强 API
  forgot-password/route.ts
  reset-password/route.ts
  verify-email/route.ts
```
**例外权限**：teammate-email 可以修改以下已有文件（仅添加邮件发送调用）：
- `app/(login)/actions.ts` — 在 inviteTeamMember 和 signUp 中添加发送邮件的调用
- `app/(login)/login.tsx` — 添加「忘记密码？」链接（仅此一处改动）

**Schema 规则**：不要直接修改 `lib/db/schema.ts`。将新表定义写在 `lib/db/email-schema.ts` 中，由 Lead 在集成阶段合并到主 schema。

### teammate-payments 专属
```
lib/payments/                   # 新增文件，不动已有文件
  providers/
    stripe.ts                   # 新建：包装已有 stripe.ts，不要修改原文件
    lemon-squeezy.ts            # 新建
  types.ts                      # 新建：PaymentProvider interface
  factory.ts                    # 新建：provider 工厂
注意：已有的 lib/payments/stripe.ts 和 lib/payments/actions.ts 保留不动，新代码通过 providers/ 和 factory.ts 封装它们。
app/api/payments/               # 新建：通用支付 API
  checkout/route.ts
  webhook/route.ts
  portal/route.ts
```
**例外权限**：teammate-payments 可以修改：
- `app/(dashboard)/pricing/page.tsx` — 适配新的 provider 抽象层
- `app/(dashboard)/pricing/submit-button.tsx` — 适配新接口
- `app/api/stripe/` — 将逻辑迁移到新的 providers/ 后可标记为 deprecated

### teammate-i18n 专属
```
messages/                       # 新建：翻译文件
  en.json
  zh.json
lib/i18n/                       # 新建：i18n 配置
  config.ts
  request.ts
components/LocaleSwitcher.tsx   # 新建：语言切换组件
```
**例外权限**：teammate-i18n 可以修改：
- `app/layout.tsx` — 添加 NextIntlClientProvider
- `next.config.ts` — 添加 createNextIntlPlugin

**禁止修改 `middleware.ts`**。middleware 中 auth 和 i18n 的合并逻辑复杂，由 Lead 在 Phase 6 集成阶段统一处理。teammate-i18n 应在 `lib/i18n/middleware.ts` 中导出一个 intlMiddleware 配置/函数，供 Lead 集成时使用。

**重要策略**：
1. 先搭建 next-intl 基础设施（config, messages, `lib/i18n/middleware.ts` 导出配置）
2. 创建翻译文件和 LocaleSwitcher 组件
3. 对新建的页面做国际化
4. **不要碰已有页面**，留给 Lead 集成阶段统一包裹

### teammate-ai 专属
```
lib/ai/                         # 新建：AI 用量系统
  usage-tracker.ts              # token 计数 + 记录
  billing.ts                    # 用量计费逻辑
  rate-limiter.ts               # API 调用限流
  types.ts                      # AI 相关类型
app/api/ai/                     # 新建：AI API
  usage/route.ts                # 用量查询
  chat/route.ts                 # 示例 AI 端点（带用量追踪）
app/(dashboard)/dashboard/usage/ # 新建：用量页面
  page.tsx
components/usage/               # 新建：用量组件
  UsageMeter.tsx
  UsageChart.tsx
  PlanLimits.tsx
```
**例外权限**：teammate-ai 可以修改：
- `app/(dashboard)/dashboard/layout.tsx` — 在侧边栏添加 "Usage" 导航项（只添加一个导航项，不改动其他内容）

**Schema 规则**：不要直接修改 `lib/db/schema.ts`。将新表定义写在 `lib/db/ai-schema.ts` 中，由 Lead 在集成阶段合并到主 schema。

**注意**：teammate-admin 不可以修改 `app/(dashboard)/dashboard/layout.tsx`，该文件只有 teammate-ai 有例外权限。

---

## 新增依赖允许列表
所有新增依赖已在 Phase 0 由 Lead 统一安装。**Teammate 禁止自行运行 pnpm add**，避免 pnpm-lock.yaml 并发冲突。如果发现缺少某个依赖，通知 Lead 安装。

已安装的新增依赖：
- `resend` + `@react-email/components` + `@react-email/render`（邮件系统）
- `@lemonsqueezy/lemonsqueezy.js`（Lemon Squeezy SDK）
- `next-intl`（国际化）
- `openai`（DeepSeek API，用于示例 AI 端点）
- `recharts`（管理后台图表）
- `@tanstack/react-table`（管理后台表格，可选）
- `date-fns`（日期处理）

## 验证命令
```bash
# 类型检查
npx tsc --noEmit

# 构建
pnpm build

# 开发服务器
pnpm dev
```

## Git 规范
- 每完成一个独立功能，立即 git commit
- commit message 格式：feat/fix/refactor: 简短描述
- 不要创建分支，所有人在 main 上提交（简化集成）
- commit 前先 git pull（如果其他 teammate 有新提交）

## 环境变量
```
# 已有（在 .env 中）
POSTGRES_URL=          # PostgreSQL 连接字符串
STRIPE_SECRET_KEY=     # Stripe 密钥
STRIPE_WEBHOOK_SECRET= # Stripe webhook 密钥
BASE_URL=http://localhost:3000
AUTH_SECRET=           # JWT 签名密钥

# 新增（teammate 负责在 .env 中添加占位）
RESEND_API_KEY=        # 邮件发送（teammate-email）
LEMON_SQUEEZY_API_KEY= # Lemon Squeezy（teammate-payments）
LEMON_SQUEEZY_WEBHOOK_SECRET=
DEEPSEEK_API_KEY=      # DeepSeek API（teammate-ai）
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

## 禁止事项
- 禁止删除或重命名已有文件（除非是明确的重构迁移）
- 禁止修改不属于自己的文件（除了上述例外权限）
- 禁止更换已有技术栈（不要把 Drizzle 换成 Prisma 等）
- 禁止使用 any 类型
- 禁止安装未在允许列表中的依赖
- 禁止跳过类型检查
