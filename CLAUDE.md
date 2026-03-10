# SaaS Starter Enhanced - 项目规范

## 项目简介
基于 Vercel 官方 next-saas-starter，增强为面向出海独立开发者的全功能 SaaS Starter Kit。
在已有的 Auth + Stripe + Dashboard 基础上，分 4 轮增强共 15 个模块：管理后台、邮件系统、多支付抽象层、国际化、AI 用量计费、RBAC 权限、完整计费、通知系统、插件市场、GDPR 合规、OAuth/SSO、API 网关、数据分析、功能开关、文档站 + Landing Page。

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
app/(login)/reset-password/    # 新建：重置密码页面
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
**例外权限**：teammate-payments 可以修改（低优先级，时间不够可跳过）：
- `app/(dashboard)/pricing/page.tsx` — 适配新的 provider 抽象层
- `app/(dashboard)/pricing/submit-button.tsx` — 适配新接口
注意：**不要修改 `app/api/stripe/` 目录下的任何文件**，已有的 Stripe 路由保留不动。

### teammate-i18n 专属
```
messages/                       # 新建：翻译文件
  en.json
  zh.json
lib/i18n/                       # 新建：i18n 配置
  config.ts
  request.ts
  middleware.ts                 # 导出 intl 中间件配置，供 Lead 集成
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

## Phase 2 文件所有权（Wave 2 teammates）

### teammate-rbac 专属
```
lib/rbac/                       # 新建：RBAC 权限系统
  types.ts
  permissions.ts
  check.ts
lib/db/rbac-schema.ts           # 新建：roles/permissions 表
app/(admin)/admin/roles/        # 新建：角色管理页面
app/api/rbac/                   # 新建：RBAC API
```
**Schema 规则**：不要修改 `lib/db/schema.ts`，新表写在 `lib/db/rbac-schema.ts`。
**禁止修改** `lib/db/admin-auth.ts`，RBAC 逻辑放在 `lib/rbac/` 中。

### teammate-billing 专属
```
lib/billing/                    # 新建：计费系统
  plans.ts
  invoices.ts
  plan-manager.ts
lib/db/billing-schema.ts        # 新建：billing 相关表
app/(dashboard)/dashboard/billing/  # 新建：计费页面
app/api/billing/                # 新建：计费 API
```
**Schema 规则**：不要修改 `lib/db/schema.ts`，新表写在 `lib/db/billing-schema.ts`。
**禁止修改** `lib/ai/` 和 `lib/payments/` 下的已有文件，可以 import 复用。

### teammate-notifications 专属
```
lib/notifications/              # 新建：通知系统
  sender.ts
  webhook-dispatcher.ts
lib/db/notifications-schema.ts  # 新建：通知相关表
app/(dashboard)/dashboard/notifications/  # 新建：通知中心
app/api/notifications/          # 新建：通知 API
components/notifications/       # 新建：NotificationBell 等组件
```
**Schema 规则**：不要修改 `lib/db/schema.ts`，新表写在 `lib/db/notifications-schema.ts`。

### teammate-plugins 专属
```
lib/plugins/                    # 新建：插件系统
  registry.ts
  lifecycle.ts
lib/db/plugins-schema.ts        # 新建：插件相关表
app/(dashboard)/dashboard/integrations/  # 新建：集成市场
app/api/plugins/                # 新建：插件 API
```
**Schema 规则**：不要修改 `lib/db/schema.ts`，新表写在 `lib/db/plugins-schema.ts`。

### teammate-compliance 专属
```
lib/compliance/                 # 新建：合规系统
  audit-logger.ts
  data-exporter.ts
  retention.ts
lib/db/compliance-schema.ts     # 新建：审计日志等表
app/(admin)/admin/compliance/   # 新建：合规管理页面
app/api/compliance/             # 新建：合规 API
```
**Schema 规则**：不要修改 `lib/db/schema.ts`，新表写在 `lib/db/compliance-schema.ts`。

### teammate-e2e 专属
```
e2e/                            # 新建：E2E 测试
  *.spec.ts
playwright.config.ts            # 新建
```
**禁止修改任何业务代码**，只写测试。

### teammate-ai-assistant 专属
```
lib/ai-assistant/               # 新建：AI 助手
  conversation-manager.ts
  streaming.ts
app/(dashboard)/dashboard/ai-assistant/  # 新建：AI 助手页面
app/api/ai/assistant/           # 新建：助手 API
```
**禁止修改 `lib/ai/` 下的已有文件**，可以 import 复用。

### teammate-realtime 专属
```
lib/realtime/                   # 新建：实时系统
  presence.ts
  event-bus.ts
app/api/realtime/               # 新建：SSE API
components/realtime/            # 新建：在线状态等组件
```
不要自行添加到 layout，Lead 在集成阶段处理。

### teammate-devops 专属
```
.github/workflows/              # 新建：CI/CD
  ci.yml
Dockerfile                      # 新建
docker-compose.yml              # 新建
vercel.json                     # 新建
```
**不要修改 next.config.ts 除了添加 `output: 'standalone'`**。

---

## Phase 4 文件所有权（Wave 4 teammates）

### teammate-oauth 专属
```
lib/oauth/                      # 新建：OAuth 系统
  types.ts
  providers/google.ts
  providers/github.ts
  factory.ts
  totp.ts
lib/db/oauth-schema.ts          # 新建：oauthAccounts/twoFactorSecrets 表
app/api/auth/oauth/             # 新建：OAuth API 路由
app/api/auth/2fa/               # 新建：2FA API 路由
app/(dashboard)/dashboard/security/  # 注意：已有 security tab，新建独立安全设置页面
```
**Schema 规则**：不要修改 `lib/db/schema.ts`，新表写在 `lib/db/oauth-schema.ts`。
**例外权限**：可在 `app/(login)/login.tsx` 末尾添加社交登录按钮，不改动已有逻辑。

### teammate-api-gateway 专属
```
lib/api-gateway/                # 新建：API 网关
  key-manager.ts
  rate-limiter.ts
  middleware.ts
  openapi-spec.ts
lib/db/api-gateway-schema.ts    # 新建：apiKeys/apiRequestLogs 表
app/api/v1/                     # 新建：Versioned API
  teams/route.ts
  members/route.ts
  activity/route.ts
  usage/route.ts
  docs/route.ts
app/api/api-keys/               # 新建：API Key 管理
app/(dashboard)/dashboard/api-keys/   # 新建：API Key 管理页面
app/(dashboard)/dashboard/api-docs/   # 新建：Swagger UI 页面
```
**Schema 规则**：不要修改 `lib/db/schema.ts`，新表写在 `lib/db/api-gateway-schema.ts`。

### teammate-analytics 专属
```
lib/analytics/                  # 新建：分析系统
  tracker.ts
  client-tracker.ts
  queries.ts
lib/db/analytics-schema.ts      # 新建：analyticsEvents/funnels 表
app/api/analytics/              # 新建：分析 API
app/(dashboard)/dashboard/analytics/  # 新建：分析页面
```
**Schema 规则**：不要修改 `lib/db/schema.ts`，新表写在 `lib/db/analytics-schema.ts`。

### teammate-feature-flags 专属
```
lib/feature-flags/              # 新建：功能开关
  engine.ts
  react.ts
lib/db/feature-flags-schema.ts  # 新建：featureFlags 表
app/api/feature-flags/          # 新建：Flag API
app/(dashboard)/dashboard/feature-flags/  # 新建：Flag 管理页面
```
**Schema 规则**：不要修改 `lib/db/schema.ts`，新表写在 `lib/db/feature-flags-schema.ts`。

### teammate-docs 专属
```
lib/docs/                       # 新建：文档工具
  mdx.ts
  sidebar.ts
  search.ts
content/docs/                   # 新建：MDX 文档内容
  getting-started.mdx
  authentication.mdx
  billing.mdx
  api-reference.mdx
  deployment.mdx
app/docs/                       # 新建：文档页面（注意不在路由组内）
  layout.tsx
  [[...slug]]/page.tsx
components/docs/                # 新建：文档组件
  Sidebar.tsx
  TOC.tsx
  SearchDialog.tsx
  CodeBlock.tsx
```

### teammate-landing 专属
```
components/landing/             # 新建：Landing Page 组件
  Hero.tsx
  Features.tsx
  Testimonials.tsx
  FAQ.tsx
  CTA.tsx
  Stats.tsx
```
**例外权限**：可以修改 `app/(marketing)/page.tsx`（或 `app/(dashboard)/page.tsx`），用新组件替换首页内容。保持 Header/Footer 不变。

---

## 新增依赖允许列表
所有新增依赖已在 Phase 0 由 Lead 统一安装。**Teammate 禁止自行运行 pnpm add**，避免 pnpm-lock.yaml 并发冲突。如果发现缺少某个依赖，通知 Lead 安装。

已安装的新增依赖：
- `resend` + `@react-email/components` + `@react-email/render`（邮件系统）
- `@lemonsqueezy/lemonsqueezy.js`（Lemon Squeezy SDK）
- `next-intl`（国际化）
- `openai`（DeepSeek API，用于示例 AI 端点）
- `recharts`（管理后台图表 + 分析图表）
- `@tanstack/react-table`（管理后台表格，可选）
- `date-fns`（日期处理）
- `uuid` + `@types/uuid`（唯一标识生成）
- `csv-stringify`（CSV 导出）
- `archiver` + `@types/archiver`（压缩导出）
- `playwright` + `@playwright/test`（E2E 测试，devDependency）
- `next-auth` + `@auth/drizzle-adapter`（OAuth 基础设施）
- `arctic`（轻量 OAuth provider 库）
- `swagger-ui-react` + `@types/swagger-ui-react`（API 文档展示）
- `gray-matter` + `next-mdx-remote`（MDX 文档系统）
- `rehype-highlight` + `rehype-slug` + `remark-gfm`（MDX 插件）
- `framer-motion`（动画库）

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
- Agent Teams 在同一本地仓库工作，不需要 git pull

## 环境变量
```
# 已有（在 .env 中）
POSTGRES_URL=          # PostgreSQL 连接字符串
STRIPE_SECRET_KEY=     # Stripe 密钥
STRIPE_WEBHOOK_SECRET= # Stripe webhook 密钥
BASE_URL=http://localhost:3000
AUTH_SECRET=           # JWT 签名密钥

# 新增（已在 .env 中预设占位，teammate 不要自行修改 .env）
RESEND_API_KEY=        # 邮件发送
LEMON_SQUEEZY_API_KEY= # Lemon Squeezy
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_WEBHOOK_SECRET=
PAYMENT_PROVIDER=stripe # 默认 stripe，可切换为 lemon-squeezy
DEEPSEEK_API_KEY=      # DeepSeek API
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Phase 4 新增
GOOGLE_CLIENT_ID=      # Google OAuth
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=      # GitHub OAuth
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=       # NextAuth 密钥（可复用 AUTH_SECRET）
```

## 并发安全规则
- **禁止并行 pnpm build**：`.next/` 目录是共享的，多个 teammate 同时 `pnpm build` 会导致缓存损坏。每个 teammate 在运行 `pnpm build` 前不需要特殊处理，但如果构建失败并显示缓存错误，先运行 `rm -rf .next` 再重试。
- **Smoke test 必须使用分配的端口**：每个 teammate 有专属端口，禁止使用 3000 端口。端口分配：admin=3001, email=3002, payments=3003, i18n=3004, ai=3005, ai-assistant=3006, realtime=3007, rbac=3001, billing=3002, notifications=3003, plugins=3004, compliance=3005, oauth=3011, api-gateway=3012, analytics=3013, feature-flags=3014, docs=3015, landing=3016, 集成验证=3010。
- **Smoke test 后必须关闭 dev server**：`kill $PID` + `taskkill //F //PID $PID` 双重关闭，防止进程残留。

## 环境变量降级策略
以下环境变量可能为空或 placeholder，代码必须优雅处理：
- `STRIPE_SECRET_KEY=sk_test_placeholder` → Stripe API 调用会失败。所有调用 Stripe SDK 的代码必须 try-catch，在 key 无效时返回空数据或友好错误，不要让页面 500。
- `RESEND_API_KEY=`（空）→ 邮件发送函数在 key 为空时跳过发送，打印 console.warn，不要抛错。
- `DEEPSEEK_API_KEY=`（空）→ AI 聊天端点在 key 为空时返回 `{ error: "DEEPSEEK_API_KEY not configured" }` 和 HTTP 503。
- `LEMON_SQUEEZY_API_KEY=`（空）→ Lemon Squeezy provider 在 key 为空时所有方法抛出明确错误，factory 默认选 Stripe。
- `GOOGLE_CLIENT_ID=`（空）→ Google 登录按钮显示但点击提示"未配置"，不影响邮箱登录。
- `GITHUB_CLIENT_ID=`（空）→ 同上。

## 禁止事项
- 禁止删除或重命名已有文件（除非是明确的重构迁移）
- 禁止修改不属于自己的文件（除了上述例外权限）
- 禁止更换已有技术栈（不要把 Drizzle 换成 Prisma 等）
- 禁止使用 any 类型
- 禁止安装未在允许列表中的依赖
- 禁止跳过类型检查
