# TODO - SaaS Starter Enhanced

每个任务完成后将 [ ] 改为 [x] 并 git commit。开始任务前先读取此文件和 CLAUDE.md。

---

## Phase 0: 初始化（Lead Agent 负责）

- [ ] 读取 CLAUDE.md 和 TODO.md 了解项目全貌
- [ ] 读取已有代码结构：lib/db/schema.ts, lib/payments/stripe.ts, app/(login)/actions.ts, middleware.ts
- [ ] 确认 .env 文件已存在（如果不存在，参考 .env.example 创建，但不要覆盖已有的 .env）
- [ ] 运行 pnpm install 确认依赖安装成功
- [ ] 安装所有新增依赖（统一安装，teammate 不可自行安装）：
  ```bash
  pnpm add recharts date-fns resend @react-email/components @react-email/render @lemonsqueezy/lemonsqueezy.js next-intl openai @tanstack/react-table
  ```
- [ ] 添加 shadcn 组件（如果还没有的话）：npx shadcn@latest add sheet separator switch progress tabs tooltip chart
- [ ] 创建基础目录结构：
  ```
  mkdir -p app/(admin)/admin/{users,activity,subscriptions}
  mkdir -p app/api/admin app/api/auth app/api/payments app/api/ai
  mkdir -p app/(login)/forgot-password app/(login)/reset-password
  mkdir -p app/(dashboard)/dashboard/usage
  mkdir -p components/admin components/usage
  mkdir -p lib/email/templates lib/ai lib/payments/providers lib/i18n
  mkdir -p messages
  ```
- [ ] git commit "chore: project setup for enhancement"
- [ ] 分配 5 个 teammate 并行开发（见下方各 Phase）

---

## Phase 1: 管理后台（teammate-admin）

### 1.1 Admin 角色与权限
- [ ] 创建 lib/db/admin-queries.ts，先定义管理员邮箱常量（硬编码 ADMIN_EMAILS = ['test@test.com']，MVP 阶段够用），提供 isAdmin(email) 检查函数
- [ ] 在同一文件中创建管理员查询函数：
  - getAllUsers(page, pageSize) — 分页获取所有用户
  - getUserStats() — 用户总数、本月新增、活跃用户数
  - getSubscriptionStats() — MRR、付费用户数、转化率、churn
  - getAllActivityLogs(page, pageSize) — 全局活动日志
- [ ] 创建 lib/db/admin-auth.ts — admin 权限检查工具函数：getAdminUser() 获取当前用户并验证是否为 admin，不是则抛错
- [ ] git commit "feat(admin): admin queries and auth middleware"

### 1.2 Admin API 路由
- [ ] GET /api/admin/stats — 返回用户统计 + 订阅统计 + MRR 数据
- [ ] GET /api/admin/users — 分页用户列表（支持搜索）
- [ ] GET /api/admin/activity — 全局活动日志
- [ ] 所有路由添加 admin 权限校验
- [ ] git commit "feat(admin): API routes"

### 1.3 Admin 数据看板页面
- [ ] 创建 app/(admin)/admin/layout.tsx — admin 布局（侧边栏：Overview / Users / Activity / Subscriptions）
- [ ] 创建 app/(admin)/admin/page.tsx — 数据看板首页：
  - 顶部 4 个 StatsCard（总用户、月新增、MRR、转化率）
  - 用户增长折线图（最近 30 天，用 recharts）
  - MRR 趋势图
  - 最近活动列表（最新 10 条）
- [ ] 创建 components/admin/StatsCard.tsx — 数据卡片（数值 + 环比变化 + 图标）
- [ ] 创建 components/admin/Charts.tsx — 折线图/柱状图组件（基于 recharts）
- [ ] git commit "feat(admin): dashboard overview page"

### 1.4 用户管理页面
- [ ] 创建 app/(admin)/admin/users/page.tsx — 用户列表表格：
  - 列：头像、名称、邮箱、注册时间、团队、订阅状态、最后登录
  - 支持搜索（按邮箱/名称）
  - 支持分页
- [ ] 创建 components/admin/UserTable.tsx — 用户表格组件
- [ ] git commit "feat(admin): user management page"

### 1.5 活动日志与订阅管理
- [ ] 创建 app/(admin)/admin/activity/page.tsx — 全局活动日志（带筛选：按事件类型、按用户）
- [ ] 创建 app/(admin)/admin/subscriptions/page.tsx — 订阅列表（团队名、套餐、状态、到期时间）
- [ ] git commit "feat(admin): activity log and subscription pages"

### 1.6 Admin 验证
- [ ] 运行 npx tsc --noEmit 确认无类型错误
- [ ] 运行 pnpm build 确认构建通过
- [ ] Smoke test：用端口 3001（PORT=3001 pnpm dev --port 3001），curl http://localhost:3001/admin 确认不返回 500，然后 kill 进程 + taskkill 兜底关闭 dev server
- [ ] git commit "fix(admin): resolve any build errors"

---

## Phase 2: 邮件系统 + Auth 增强（teammate-email）

### 2.1 邮件基础设施
- [ ] 确认 resend, @react-email/components, @react-email/render 已由 Lead 安装（不要自行 pnpm add）
- [ ] 创建 lib/email/send.ts — Resend 发送封装：
  - sendEmail(to, subject, reactComponent) 通用发送函数
  - 错误处理 + 日志
- [ ] 确认 .env 中已有 RESEND_API_KEY 占位（Lead 已在 Phase 0 创建，不要自行修改 .env）
- [ ] git commit "feat(email): email sending infrastructure"

### 2.2 邮件模板
- [ ] 创建 lib/email/templates/WelcomeEmail.tsx — 欢迎邮件（注册成功后发送）
- [ ] 创建 lib/email/templates/ResetPasswordEmail.tsx — 密码重置邮件（含重置链接）
- [ ] 创建 lib/email/templates/InvitationEmail.tsx — 团队邀请邮件（含邀请链接）
- [ ] 创建 lib/email/templates/SubscriptionEmail.tsx — 订阅确认/到期提醒
- [ ] 所有模板使用统一品牌样式（logo 占位、配色、页脚）
- [ ] git commit "feat(email): email templates"

### 2.3 忘记密码流程
- [ ] 创建 lib/db/email-schema.ts — 定义 passwordResetTokens 表（token, userId, expiresAt）和 emailVerifications 表。不要修改 lib/db/schema.ts，Lead 会在集成阶段合并。
- [ ] 在 email-schema.ts 中用 Drizzle 的 pgTable 定义表并导出。注意：这些表在 Phase 6 Lead 合并 schema 并运行迁移之前不会存在于数据库中。API 路由可以引用这些类型，代码能编译通过即可，运行时查询会失败是预期行为。
- [ ] 创建 app/api/auth/forgot-password/route.ts — 生成重置 token + 发送邮件
- [ ] 创建 app/api/auth/reset-password/route.ts — 验证 token + 更新密码
- [ ] 创建 app/(login)/forgot-password/page.tsx — 忘记密码页面（输入邮箱）
- [ ] 创建 app/(login)/reset-password/page.tsx — 重置密码页面（输入新密码）
- [ ] 在 app/(login)/login.tsx 添加「忘记密码？」链接（该文件已获得例外权限）
- [ ] git commit "feat(email): forgot password flow"

### 2.4 接入已有流程
- [ ] 修改 app/(login)/actions.ts 中的 signUp — 注册成功后发送欢迎邮件
- [ ] 修改 app/(login)/actions.ts 中的 inviteTeamMember — 发送邀请邮件（替换已有的 TODO 注释）
- [ ] git commit "feat(email): integrate with existing auth flows"

### 2.5 Email 验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] Smoke test：用端口 3002（PORT=3002 pnpm dev --port 3002），curl http://localhost:3002/forgot-password 确认不返回 500，然后 kill 进程 + taskkill 兜底关闭 dev server
- [ ] git commit "fix(email): resolve any build errors"

---

## Phase 3: 多支付抽象层（teammate-payments）

### 3.1 支付 Provider 接口定义
- [ ] 创建 lib/payments/types.ts — 定义 PaymentProvider interface：
  ```typescript
  interface PaymentProvider {
    createCheckoutSession(params: CheckoutParams): Promise<string>  // 返回 checkout URL
    createCustomerPortalSession(customerId: string): Promise<string>
    handleWebhook(body: string, signature: string): Promise<WebhookEvent>
    getProducts(): Promise<Product[]>
    getPrices(): Promise<Price[]>
  }
  ```
- [ ] 定义通用类型：Product, Price, Subscription, WebhookEvent, CheckoutParams
- [ ] git commit "feat(payments): payment provider interface"

### 3.2 Stripe Provider 重构
- [ ] 创建 lib/payments/providers/stripe.ts — 将已有 lib/payments/stripe.ts 的函数封装为 class StripeProvider implements PaymentProvider
- [ ] 重要：不要删除或修改原 lib/payments/stripe.ts，创建新文件包装它。原文件保留作为 fallback。
- [ ] git commit "refactor(payments): stripe provider"

### 3.3 Lemon Squeezy Provider
- [ ] 确认 @lemonsqueezy/lemonsqueezy.js 已由 Lead 安装（不要自行 pnpm add）
- [ ] 创建 lib/payments/providers/lemon-squeezy.ts — 实现 PaymentProvider 接口
- [ ] 对于 Lemon Squeezy 的每个方法，如果不确定 SDK 用法，写好函数签名和类型，内部用 TODO 注释标记，不要瞎猜 API 调用
- [ ] git commit "feat(payments): lemon squeezy provider"

### 3.4 Provider 工厂
- [ ] 创建 lib/payments/factory.ts — 根据环境变量 PAYMENT_PROVIDER（默认 stripe）返回对应 provider 实例
- [ ] 创建 app/api/payments/checkout/route.ts — 通用 checkout 路由（调用 factory 获取 provider）
- [ ] 创建 app/api/payments/webhook/route.ts — 通用 webhook 路由
- [ ] 创建 app/api/payments/portal/route.ts — 通用 portal 路由
- [ ] git commit "feat(payments): provider factory and unified routes"

### 3.5 Pricing 页面适配（低优先级，时间不够可跳过）
- [ ] 修改 app/(dashboard)/pricing/page.tsx — 使用 provider 抽象层获取产品
- [ ] 修改 app/(dashboard)/pricing/submit-button.tsx — 适配新 checkout 接口
- [ ] 如果改动导致已有 Stripe 流程报错，立即回退改动，保持原 pricing 页面不变
- [ ] git commit "feat(payments): pricing page adapter"

### 3.6 Payments 验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] Smoke test：用端口 3003（PORT=3003 pnpm dev --port 3003），curl http://localhost:3003/api/payments/checkout 确认不返回 500，然后 kill 进程 + taskkill 兜底关闭 dev server
- [ ] git commit "fix(payments): resolve any build errors"

---

## Phase 4: 国际化 i18n（teammate-i18n）

### 4.1 基础设施搭建
- [ ] 确认 next-intl 已由 Lead 安装（不要自行 pnpm add）
- [ ] 创建 lib/i18n/config.ts — 支持的语言列表（en, zh）+ 默认语言（en）
- [ ] 创建 lib/i18n/request.ts — next-intl 的 getRequestConfig
- [ ] 创建 lib/i18n/middleware.ts — 导出 intlMiddleware 配置/函数，供 Lead 集成到根 middleware.ts（**不要直接修改根 middleware.ts**）
- [ ] 修改 next.config.ts — 添加 createNextIntlPlugin
- [ ] git commit "feat(i18n): infrastructure setup"

### 4.2 翻译文件
- [ ] 创建 messages/en.json — 英文翻译：
  - common（按钮、状态、导航）
  - auth（登录、注册、忘记密码）
  - dashboard（设置、安全、活动）
  - pricing（套餐名称、功能描述）
  - admin（管理后台所有文案）
  - usage（AI 用量相关）
- [ ] 创建 messages/zh.json — 中文翻译（对应 en.json 所有 key）
- [ ] git commit "feat(i18n): translation files"

### 4.3 语言切换组件
- [ ] 创建 components/LocaleSwitcher.tsx — 语言切换下拉菜单（中文/English）
- [ ] 修改 app/layout.tsx — 添加 NextIntlClientProvider
- [ ] 将 LocaleSwitcher 添加到 app/layout.tsx 中（你有该文件的例外权限，不要修改 app/(dashboard)/layout.tsx）
- [ ] git commit "feat(i18n): locale switcher component"

### 4.4 注意事项
- [ ] **不要修改已有页面**（Landing page、登录页、Dashboard、定价页）。已有页面的国际化由 Lead 在 Phase 6 统一处理。
- [ ] 只对 teammate-i18n 新建的文件（LocaleSwitcher 等）使用翻译函数
- [ ] git commit "feat(i18n): i18n ready for integration"

### 4.5 i18n 验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] Smoke test：用端口 3004（PORT=3004 pnpm dev --port 3004），curl http://localhost:3004 确认不返回 500，然后 kill 进程 + taskkill 兜底关闭 dev server
- [ ] git commit "fix(i18n): resolve any build errors"

---

## Phase 5: AI 用量追踪与计费（teammate-ai）

### 5.1 数据模型
- [ ] 创建 lib/db/ai-schema.ts — 定义以下表（不要修改 lib/db/schema.ts，Lead 会在集成阶段合并）：
  - aiUsageLogs（userId, teamId, model, inputTokens, outputTokens, cost, endpoint, createdAt）
  - aiQuotas（teamId, plan, monthlyTokenLimit, tokensUsed, resetAt）
- [ ] 在 ai-schema.ts 中用 Drizzle 的 pgTable 定义表并导出。注意：这些表在 Phase 6 Lead 合并 schema 并运行迁移之前不会存在于数据库中。API 路由可以引用这些类型，代码能编译通过即可。
- [ ] git commit "feat(ai): usage tracking schema"

### 5.2 用量追踪核心
- [ ] 创建 lib/ai/types.ts — AI 相关类型（UsageRecord, Quota, AIModel 等）
- [ ] 创建 lib/ai/usage-tracker.ts：
  - trackUsage(userId, teamId, model, inputTokens, outputTokens) — 记录用量
  - getUsage(teamId, startDate, endDate) — 查询用量
  - getMonthlyUsage(teamId) — 当月用量汇总
  - getRemainingQuota(teamId) — 剩余配额
- [ ] 创建 lib/ai/rate-limiter.ts：
  - checkRateLimit(teamId) — 检查是否超出速率限制
  - checkQuota(teamId, estimatedTokens) — 检查配额是否足够
- [ ] git commit "feat(ai): usage tracker and rate limiter"

### 5.3 AI 计费逻辑
- [ ] 创建 lib/ai/billing.ts：
  - calculateCost(model, inputTokens, outputTokens) — 根据模型计算费用
  - getMonthlyBill(teamId) — 当月账单
  - 支持不同定价模型：按量计费 / 包月额度
- [ ] git commit "feat(ai): billing logic"

### 5.4 示例 AI 端点
- [ ] 确认 openai 已由 Lead 安装（不要自行 pnpm add）
- [ ] 创建 app/api/ai/chat/route.ts — 示例聊天 API：
  - 使用 openai SDK 调 DeepSeek（baseURL: https://api.deepseek.com, model: deepseek-chat）
  - 请求前检查配额
  - 请求后记录用量
  - 流式响应（SSE）
- [ ] 创建 app/api/ai/usage/route.ts — 查询用量统计 API
- [ ] 确认 .env 中已有 DEEPSEEK_API_KEY 和 DEEPSEEK_BASE_URL 占位（Lead 已在 Phase 0 创建，不要自行修改 .env）
- [ ] git commit "feat(ai): chat endpoint with usage tracking"

### 5.5 用量 Dashboard 页面
- [ ] 修改 app/(dashboard)/dashboard/layout.tsx — 侧边栏添加 "Usage" 导航项
- [ ] 创建 app/(dashboard)/dashboard/usage/page.tsx — 用量页面：
  - 当月用量环形进度条（已用/总配额）
  - 按天用量柱状图（最近 30 天）
  - 按模型用量饼图
  - 费用明细表格
- [ ] 创建 components/usage/UsageMeter.tsx — 用量仪表盘组件
- [ ] 创建 components/usage/UsageChart.tsx — 用量图表组件
- [ ] 创建 components/usage/PlanLimits.tsx — 套餐配额展示组件
- [ ] git commit "feat(ai): usage dashboard page"

### 5.6 AI 模块验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] Smoke test：用端口 3005（PORT=3005 pnpm dev --port 3005），curl http://localhost:3005/dashboard/usage 确认不返回 500，然后 kill 进程 + taskkill 兜底关闭 dev server
- [ ] git commit "fix(ai): resolve any build errors"

---

## Phase 6: 集成与收尾（Lead Agent 负责）

### 6.1 Schema 合并
- [ ] 读取 lib/db/email-schema.ts 和 lib/db/ai-schema.ts
- [ ] 将这两个文件中的表定义合并到 lib/db/schema.ts（追加到已有表的后面）
- [ ] 更新 lib/db/email-schema.ts 和 lib/db/ai-schema.ts 改为从 schema.ts 重新导出（保持其他模块的 import 不变）
- [ ] 运行 pnpm db:generate && pnpm db:migrate 应用所有 schema 变更
- [ ] git commit "feat: merge all schemas"

### 6.2 Middleware 合并
- [ ] 读取 lib/i18n/middleware.ts 中导出的 intl 配置
- [ ] 修改根 middleware.ts，将 next-intl 中间件与已有的 auth session 刷新逻辑合并
- [ ] 确保：未登录用户仍然被重定向到 /sign-in，i18n 路由正常工作
- [ ] git commit "feat: integrate i18n middleware"

### 6.3 导航互通
- [ ] 确认顶部导航能到 Dashboard、Pricing、Admin
- [ ] 确认 Dashboard 侧边栏能到 General、Security、Activity、Usage
- [ ] 确认 Admin 侧边栏能到 Overview、Users、Activity、Subscriptions
- [ ] 如有导航缺失，直接修复

### 6.4 全局验证
- [ ] 运行 npx tsc --noEmit 检查全局类型错误
- [ ] 运行 pnpm build 检查构建
- [ ] 如果有错误，定位到具体模块，指派对应 teammate 修复
- [ ] 反复修复直到 pnpm build 成功
- [ ] 全量 Smoke Test：用端口 3010（PORT=3010 pnpm dev --port 3010）启动后依次验证以下路由不返回 500：
  - http://localhost:3010（首页）
  - http://localhost:3010/sign-in（登录页）
  - http://localhost:3010/pricing（定价页）
  - http://localhost:3010/admin（管理后台）
  - http://localhost:3010/forgot-password（忘记密码）
  - http://localhost:3010/dashboard/usage（用量页面）
  如果有 500 错误，修复后重新验证。验证完毕后 kill 进程 + taskkill 兜底关闭 dev server。
- [ ] git commit "feat: integration complete - all modules verified"
- [ ] echo 'done' > COMPLETE && git add COMPLETE && git commit -m 'chore: mark project as complete'
- [ ] 输出 COMPLETE
