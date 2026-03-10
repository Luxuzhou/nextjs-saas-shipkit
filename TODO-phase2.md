# TODO - SaaS Starter Enhanced Phase 2 + 3

第二轮：多租户 RBAC、完整计费、通知系统、插件市场、合规导出。
第三轮：E2E 测试、AI 智能助手、实时协作、CI/CD 部署。
每个任务完成后将 [ ] 改为 [x] 并 git commit。开始任务前先读取此文件和 CLAUDE.md。

---

## Phase 7: 初始化（Lead Agent 负责）

- [ ] 读取 CLAUDE.md 和 TODO-phase2.md 了解任务
- [ ] 读取当前 schema：lib/db/schema.ts
- [ ] 安装新增依赖（teammate 禁止自行安装）：
  ```bash
  pnpm add uuid @types/uuid csv-stringify archiver @types/archiver
  ```
- [ ] 创建目录结构：
  ```
  mkdir -p lib/rbac lib/billing lib/notifications lib/plugins lib/compliance
  mkdir -p app/api/rbac app/api/billing app/api/notifications app/api/plugins app/api/compliance
  mkdir -p app/\(dashboard\)/dashboard/billing app/\(dashboard\)/dashboard/notifications app/\(dashboard\)/dashboard/integrations
  mkdir -p app/\(admin\)/admin/compliance app/\(admin\)/admin/roles
  mkdir -p components/rbac components/billing components/notifications components/plugins components/compliance
  ```
- [ ] git commit "chore: phase 2 setup"
- [ ] 分配 5 个 teammate

---

## Phase 8: 多租户 + RBAC 权限体系（teammate-rbac）

### 8.1 Schema 定义
- [ ] 创建 lib/db/rbac-schema.ts，定义以下表（不要修改 lib/db/schema.ts）：
  - roles（id, teamId, name, description, isSystem, createdAt）— 角色表，isSystem 标记内置角色
  - permissions（id, resource, action, description）— 权限定义表
  - rolePermissions（roleId, permissionId）— 角色-权限关联表
  - userRoles（userId, teamId, roleId, assignedAt, assignedBy）— 用户-团队-角色关联表
- [ ] 导出所有表和关系定义
- [ ] git commit "feat(rbac): schema definition"

### 8.2 RBAC 核心逻辑
- [ ] 创建 lib/rbac/types.ts — Resource 和 Action 枚举：
  - Resources: team, member, billing, admin, ai_usage, notifications, plugins, compliance
  - Actions: create, read, update, delete, manage
- [ ] 创建 lib/rbac/permissions.ts：
  - DEFAULT_ROLES: owner（全部权限）、admin（除 delete team 外全部）、member（基础读写）、viewer（只读）
  - SYSTEM_PERMISSIONS: 所有 resource x action 组合
  - seedDefaultRoles(teamId) — 初始化团队默认角色
- [ ] 创建 lib/rbac/check.ts：
  - hasPermission(userId, teamId, resource, action) — 检查用户是否有某权限
  - requirePermission(userId, teamId, resource, action) — 无权限则抛错
  - getUserPermissions(userId, teamId) — 获取用户在某团队的所有权限
  - getUserRole(userId, teamId) — 获取用户在某团队的角色
- [ ] 创建 lib/rbac/middleware.ts — withPermission(resource, action) 高阶函数，用于包裹 API route handler
- [ ] git commit "feat(rbac): core permission logic"

### 8.3 RBAC API
- [ ] GET/POST /api/rbac/roles — 查询/创建团队角色
- [ ] PUT/DELETE /api/rbac/roles/[roleId] — 更新/删除角色（禁止删除 isSystem 角色）
- [ ] POST /api/rbac/assign — 给用户分配角色
- [ ] GET /api/rbac/permissions — 查询当前用户权限
- [ ] 所有路由用 withPermission 中间件保护
- [ ] git commit "feat(rbac): API routes"

### 8.4 RBAC 管理页面
- [ ] 创建 app/(admin)/admin/roles/page.tsx — 角色管理页面：
  - 角色列表（名称、权限数量、成员数量）
  - 创建/编辑角色（勾选权限矩阵）
  - 系统角色不可删除
- [ ] 创建 components/rbac/RoleEditor.tsx — 权限矩阵编辑器（resource x action 网格）
- [ ] 创建 components/rbac/RoleAssigner.tsx — 给成员分配角色的组件
- [ ] git commit "feat(rbac): admin role management page"

### 8.5 RBAC 验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] Smoke test：端口 3001，验证 /admin/roles 不返回 500
- [ ] git commit "fix(rbac): resolve any build errors"

---

## Phase 9: 完整计费系统（teammate-billing）

### 9.1 Schema 定义
- [ ] 创建 lib/db/billing-schema.ts（不要修改 lib/db/schema.ts）：
  - invoices（id, teamId, periodStart, periodEnd, totalAmount, currency, status, stripeInvoiceId, pdfUrl, createdAt）
  - usageBillingRecords（id, teamId, month, aiTokensUsed, aiCost, apiCallsUsed, apiCost, totalCost, settledAt）
  - planChangeLogs（id, teamId, fromPlan, toPlan, changedBy, changedAt, effectiveAt, reason）
- [ ] git commit "feat(billing): schema definition"

### 9.2 计费核心逻辑
- [ ] 创建 lib/billing/types.ts — Plan, Invoice, BillingPeriod, UsageTier 等类型
- [ ] 创建 lib/billing/plans.ts：
  - PLAN_CONFIGS: free / starter / pro / enterprise 套餐定义
  - 每个套餐包含：月价、年价、AI token 额度、API 调用额度、团队成员上限
  - getPlanByName(name) — 获取套餐配置
  - comparePlans(from, to) — 升级/降级判断
- [ ] 创建 lib/billing/invoice-generator.ts：
  - generateMonthlyInvoice(teamId) — 生成月度账单
  - 汇总：基础套餐费 + AI 超额用量费 + API 超额费
  - getInvoiceHistory(teamId, limit) — 查询历史账单
- [ ] 创建 lib/billing/plan-manager.ts：
  - changePlan(teamId, newPlan, userId) — 变更套餐（记录日志）
  - handleTrialExpiry(teamId) — 试用期到期处理
  - checkPlanLimits(teamId) — 检查是否超出套餐限制
- [ ] git commit "feat(billing): core billing logic"

### 9.3 Billing API
- [ ] GET /api/billing/invoices — 查询账单历史
- [ ] GET /api/billing/current — 当前周期用量和预估费用
- [ ] POST /api/billing/change-plan — 变更套餐
- [ ] GET /api/billing/plans — 查询所有可用套餐
- [ ] **环境变量降级**：Stripe 不可用时返回 mock 数据
- [ ] git commit "feat(billing): API routes"

### 9.4 Billing Dashboard 页面
- [ ] 创建 app/(dashboard)/dashboard/billing/page.tsx：
  - 当前套餐信息卡片（套餐名、价格、到期时间）
  - 本月用量概览（AI tokens / API 调用 / 成员数 vs 限额）
  - 预估本月账单金额
  - 账单历史列表（日期、金额、状态、下载链接）
  - 套餐升降级按钮
- [ ] 创建 components/billing/PlanCard.tsx — 套餐信息展示
- [ ] 创建 components/billing/InvoiceTable.tsx — 账单历史表格
- [ ] 创建 components/billing/UsageOverview.tsx — 用量概览（进度条）
- [ ] git commit "feat(billing): dashboard billing page"

### 9.5 Billing 验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] Smoke test：端口 3002，验证 /dashboard/billing 不返回 500
- [ ] git commit "fix(billing): resolve any build errors"

---

## Phase 10: 实时通知 + Webhook 系统（teammate-notifications）

### 10.1 Schema 定义
- [ ] 创建 lib/db/notifications-schema.ts（不要修改 lib/db/schema.ts）：
  - notifications（id, userId, teamId, type, title, body, isRead, channel, metadata, createdAt）
  - webhookEndpoints（id, teamId, url, secret, events, isActive, createdAt, lastTriggeredAt）
  - webhookDeliveries（id, webhookEndpointId, event, payload, statusCode, response, attempts, nextRetryAt, createdAt）
- [ ] git commit "feat(notifications): schema definition"

### 10.2 通知核心逻辑
- [ ] 创建 lib/notifications/types.ts：
  - NotificationType 枚举：subscription_created, subscription_canceled, payment_received, payment_failed, member_joined, member_removed, quota_warning, quota_exceeded, security_alert
  - NotificationChannel: in_app, email, webhook
  - WebhookEvent 类型定义
- [ ] 创建 lib/notifications/sender.ts：
  - sendNotification(userId, type, title, body, metadata) — 创建站内通知
  - sendToTeam(teamId, type, title, body) — 给团队所有成员发通知
  - markAsRead(notificationId, userId) — 标记已读
  - markAllRead(userId) — 全部已读
  - getUnreadCount(userId) — 未读数量
- [ ] 创建 lib/notifications/webhook-dispatcher.ts：
  - dispatchWebhook(teamId, event, payload) — 触发 webhook
  - 查找匹配 event 的 endpoints，POST payload + HMAC 签名
  - 失败自动重试（最多 3 次，指数退避）
  - recordDelivery(endpointId, event, payload, statusCode, response) — 记录投递结果
- [ ] git commit "feat(notifications): core notification and webhook logic"

### 10.3 通知 API
- [ ] GET /api/notifications — 查询当前用户通知列表（分页）
- [ ] POST /api/notifications/read — 标记已读（单个或全部）
- [ ] GET /api/notifications/unread-count — 未读数量（供轮询）
- [ ] POST /api/webhooks — 创建 webhook endpoint
- [ ] GET /api/webhooks — 查询团队的 webhook endpoints
- [ ] DELETE /api/webhooks/[id] — 删除 webhook
- [ ] GET /api/webhooks/[id]/deliveries — 查询投递历史
- [ ] git commit "feat(notifications): API routes"

### 10.4 通知页面
- [ ] 创建 app/(dashboard)/dashboard/notifications/page.tsx：
  - 通知列表（标题、内容、时间、已读/未读状态）
  - 标记已读/全部已读按钮
  - 按类型筛选
  - Webhook 管理 tab：endpoint 列表、添加/删除、投递历史
- [ ] 创建 components/notifications/NotificationBell.tsx — 顶部导航栏通知铃铛（带未读数角标）
- [ ] 创建 components/notifications/NotificationList.tsx — 通知列表组件
- [ ] 创建 components/notifications/WebhookManager.tsx — Webhook 管理组件
- [ ] git commit "feat(notifications): notification center page"

### 10.5 通知验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] Smoke test：端口 3003，验证 /dashboard/notifications 不返回 500
- [ ] git commit "fix(notifications): resolve any build errors"

---

## Phase 11: 插件/集成市场架构（teammate-plugins）

### 11.1 Schema 定义
- [ ] 创建 lib/db/plugins-schema.ts（不要修改 lib/db/schema.ts）：
  - plugins（id, slug, name, description, author, version, iconUrl, category, status, configSchema, createdAt）— 插件注册表
  - pluginInstallations（id, pluginId, teamId, isEnabled, config, installedBy, installedAt, updatedAt）— 安装记录
  - pluginApiKeys（id, pluginId, teamId, apiKey, scopes, expiresAt, createdAt）— 插件 API 密钥
- [ ] git commit "feat(plugins): schema definition"

### 11.2 插件核心逻辑
- [ ] 创建 lib/plugins/types.ts：
  - PluginManifest: slug, name, version, description, author, configSchema, requiredScopes, hooks
  - PluginHook: onInstall, onUninstall, onConfigUpdate, onEvent
  - PluginScope: read_team, write_team, read_members, read_billing, send_notifications 等
- [ ] 创建 lib/plugins/registry.ts：
  - registerPlugin(manifest) — 注册插件
  - getPlugin(slug) — 获取插件信息
  - listPlugins(category?, status?) — 列出插件（支持分类和状态筛选）
  - BUILT_IN_PLUGINS: 预置 2-3 个示例插件（Slack 通知、GitHub 集成、Zapier 连接器），用 TODO 标记实际集成代码
- [ ] 创建 lib/plugins/lifecycle.ts：
  - installPlugin(teamId, pluginSlug, config, userId) — 安装插件
  - uninstallPlugin(teamId, pluginSlug) — 卸载插件
  - updatePluginConfig(teamId, pluginSlug, newConfig) — 更新配置
  - enablePlugin / disablePlugin — 启用/禁用
  - generateApiKey(teamId, pluginSlug, scopes) — 生成 API 密钥
- [ ] git commit "feat(plugins): core plugin system"

### 11.3 插件 API
- [ ] GET /api/plugins — 插件市场列表
- [ ] GET /api/plugins/[slug] — 插件详情
- [ ] POST /api/plugins/[slug]/install — 安装插件
- [ ] DELETE /api/plugins/[slug]/uninstall — 卸载插件
- [ ] PUT /api/plugins/[slug]/config — 更新插件配置
- [ ] POST /api/plugins/[slug]/api-key — 生成 API 密钥
- [ ] git commit "feat(plugins): API routes"

### 11.4 集成市场页面
- [ ] 创建 app/(dashboard)/dashboard/integrations/page.tsx：
  - 插件卡片网格（图标、名称、描述、分类标签、安装/已安装状态）
  - 分类筛选（All / Communication / DevOps / Analytics / Automation）
  - 已安装插件 tab：配置、启用/禁用、卸载
- [ ] 创建 components/plugins/PluginCard.tsx — 插件卡片
- [ ] 创建 components/plugins/PluginConfigForm.tsx — 动态配置表单（根据 configSchema 生成）
- [ ] 创建 components/plugins/PluginMarketplace.tsx — 市场网格布局
- [ ] git commit "feat(plugins): integration marketplace page"

### 11.5 插件验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] Smoke test：端口 3004，验证 /dashboard/integrations 不返回 500
- [ ] git commit "fix(plugins): resolve any build errors"

---

## Phase 12: 数据导出 + 审计日志 + GDPR 合规（teammate-compliance）

### 12.1 Schema 定义
- [ ] 创建 lib/db/compliance-schema.ts（不要修改 lib/db/schema.ts）：
  - auditLogs（id, teamId, userId, action, resource, resourceId, oldValue, newValue, ipAddress, userAgent, createdAt）— 详细审计日志
  - dataExportRequests（id, userId, teamId, type, status, fileUrl, requestedAt, completedAt, expiresAt）— 数据导出请求
  - dataRetentionPolicies（id, teamId, resource, retentionDays, isActive, createdAt, updatedAt）— 数据保留策略
- [ ] git commit "feat(compliance): schema definition"

### 12.2 审计日志核心
- [ ] 创建 lib/compliance/types.ts：
  - AuditAction 枚举：create, read, update, delete, export, login, logout, permission_change, config_change
  - AuditResource 枚举：user, team, member, role, subscription, invoice, plugin, webhook, settings
  - DataExportType: full_export, user_data, team_data, billing_data, activity_data
  - ExportStatus: pending, processing, completed, failed, expired
- [ ] 创建 lib/compliance/audit-logger.ts：
  - logAudit(teamId, userId, action, resource, resourceId, oldValue?, newValue?) — 记录审计日志
  - getAuditLogs(teamId, filters) — 查询审计日志（支持按 action/resource/user/时间范围筛选）
  - 高阶函数 withAuditLog(handler, action, resource) — 自动审计包装器
- [ ] 创建 lib/compliance/data-exporter.ts：
  - requestExport(userId, teamId, type) — 创建导出请求
  - processExport(requestId) — 处理导出（生成 CSV/JSON）
  - 导出内容按 type 不同：
    - full_export: 用户数据 + 团队数据 + 活动日志 + 账单
    - user_data: 仅个人信息（GDPR Subject Access Request）
    - team_data: 团队成员 + 设置
    - billing_data: 账单 + 用量记录
  - getExportHistory(userId) — 查询导出历史
- [ ] 创建 lib/compliance/retention.ts：
  - setRetentionPolicy(teamId, resource, retentionDays) — 设置保留策略
  - getRetentionPolicies(teamId) — 查询保留策略
  - DEFAULT_RETENTION: activity_logs=365, audit_logs=730, ai_usage=180
- [ ] git commit "feat(compliance): audit logger and data exporter"

### 12.3 合规 API
- [ ] POST /api/compliance/export — 请求数据导出
- [ ] GET /api/compliance/export — 查询导出历史和下载链接
- [ ] GET /api/compliance/audit — 查询审计日志（分页 + 筛选）
- [ ] GET/PUT /api/compliance/retention — 查询/更新数据保留策略
- [ ] git commit "feat(compliance): API routes"

### 12.4 合规管理页面
- [ ] 创建 app/(admin)/admin/compliance/page.tsx：
  - 审计日志查看器（可按用户/操作类型/资源/时间范围筛选）
  - 数据导出面板（选择导出类型、查看历史导出）
  - 数据保留策略配置
- [ ] 创建 components/compliance/AuditLogViewer.tsx — 审计日志表格（带高级筛选）
- [ ] 创建 components/compliance/DataExportPanel.tsx — 数据导出操作面板
- [ ] 创建 components/compliance/RetentionSettings.tsx — 保留策略编辑器
- [ ] git commit "feat(compliance): admin compliance page"

### 12.5 合规验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] Smoke test：端口 3005，验证 /admin/compliance 不返回 500
- [ ] git commit "fix(compliance): resolve any build errors"

---

## Phase 13: 集成与收尾（Lead Agent 负责）

### 13.1 Schema 合并
- [ ] 将 rbac-schema.ts、billing-schema.ts、notifications-schema.ts、plugins-schema.ts、compliance-schema.ts 中的表定义合并到 lib/db/schema.ts
- [ ] 更新各 schema 文件改为从 schema.ts 重新导出
- [ ] 运行 pnpm db:generate && pnpm db:migrate
- [ ] git commit "feat: merge phase 2 schemas"

### 13.2 导航更新
- [ ] Dashboard 侧边栏添加：Billing、Notifications、Integrations 导航项
- [ ] Admin 侧边栏添加：Roles、Compliance 导航项
- [ ] 确认所有新页面都能从导航进入
- [ ] git commit "feat: update navigation for phase 2"

### 13.3 全局验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] 全量 Smoke Test（端口 3010）：
  - http://localhost:3010（首页）
  - http://localhost:3010/admin（管理后台）
  - http://localhost:3010/admin/roles（角色管理）
  - http://localhost:3010/admin/compliance（合规管理）
  - http://localhost:3010/dashboard/billing（计费页面）
  - http://localhost:3010/dashboard/notifications（通知中心）
  - http://localhost:3010/dashboard/integrations（集成市场）
  - http://localhost:3010/dashboard/usage（用量页面，确认未被破坏）
- [ ] 如果有 500 错误，修复后重新验证
- [ ] git commit "feat: phase 2 integration complete - all modules verified"
- [ ] 不要创建 COMPLETE 文件，继续 Phase 14

---

## Phase 14: 初始化第三轮（Lead Agent 负责）

- [ ] 安装新增依赖（teammate 禁止自行安装）：
  ```bash
  pnpm add -D playwright @playwright/test
  npx playwright install chromium
  ```
- [ ] 创建目录结构：
  ```
  mkdir -p lib/ai-assistant app/api/ai/assistant app/api/ai/analyze
  mkdir -p app/\(dashboard\)/dashboard/ai-assistant
  mkdir -p components/ai-assistant
  mkdir -p e2e
  mkdir -p .github/workflows
  mkdir -p docker
  ```
- [ ] git commit "chore: phase 3 setup"
- [ ] 分配 4 个 teammate（Phase 15-18）

---

## Phase 15: E2E 测试套件（teammate-e2e）

### 15.1 Playwright 配置
- [ ] 创建 playwright.config.ts：
  - baseURL: http://localhost:3000
  - projects: chromium only（减少复杂度）
  - webServer: 自动启动 pnpm dev
  - timeout: 30 秒
  - retries: 1
- [ ] 创建 e2e/helpers/auth.ts — 测试辅助函数：
  - createTestUser(page, email, password) — 注册测试用户
  - loginAs(page, email, password) — 登录
  - logout(page) — 登出
- [ ] git commit "feat(e2e): playwright config and helpers"

### 15.2 认证流程测试
- [ ] 创建 e2e/auth.spec.ts：
  - 测试注册新账户（填表 → 提交 → 重定向到 dashboard）
  - 测试登录已有账户
  - 测试登出
  - 测试未登录访问 /dashboard 被重定向到 /sign-in
  - 测试错误密码显示错误提示
- [ ] git commit "feat(e2e): auth flow tests"

### 15.3 Dashboard 功能测试
- [ ] 创建 e2e/dashboard.spec.ts：
  - 测试 dashboard 各 tab 切换（General / Security / Activity / Usage）
  - 测试修改用户名
  - 测试 sidebar 导航跳转
- [ ] 创建 e2e/pricing.spec.ts：
  - 测试定价页面加载
  - 测试套餐卡片显示
- [ ] git commit "feat(e2e): dashboard and pricing tests"

### 15.4 新功能页面测试
- [ ] 创建 e2e/forgot-password.spec.ts：
  - 测试忘记密码页面加载
  - 测试提交邮箱（不验证邮件发送，只验证 UI 流程）
- [ ] 创建 e2e/admin.spec.ts：
  - 测试非 admin 用户访问 /admin 被重定向
  - 测试 admin 用户能看到数据看板
  - 测试用户列表分页
  - 测试活动日志加载
- [ ] 创建 e2e/billing.spec.ts：
  - 测试 billing 页面加载
  - 测试套餐信息展示
- [ ] 创建 e2e/notifications.spec.ts：
  - 测试通知页面加载
  - 测试标记已读
- [ ] 创建 e2e/integrations.spec.ts：
  - 测试集成市场页面加载
  - 测试插件卡片展示
- [ ] git commit "feat(e2e): new feature page tests"

### 15.5 E2E 验证
- [ ] 运行 npx playwright test --reporter=list 确认测试能执行（部分测试可能因数据库空状态失败，但不能有语法错误或配置错误）
- [ ] git commit "fix(e2e): resolve any test issues"

---

## Phase 16: AI 智能助手（teammate-ai-assistant）

### 16.1 AI 助手核心逻辑
- [ ] 创建 lib/ai-assistant/types.ts：
  - Conversation, Message（role, content, timestamp）, AssistantCapability
  - AnalysisRequest, AnalysisResult
  - StreamChunk 类型（用于 SSE 流式输出）
- [ ] 创建 lib/ai-assistant/conversation-manager.ts：
  - createConversation(userId, teamId) — 创建新对话
  - addMessage(conversationId, role, content) — 添加消息
  - getConversationHistory(conversationId, limit) — 获取对话历史
  - listConversations(userId) — 列出用户的所有对话
  - deleteConversation(conversationId) — 删除对话
  - 注意：对话历史存在内存中（Map），不需要新建数据库表。生产环境可以迁移到 Redis/DB，当前是 MVP。
- [ ] 创建 lib/ai-assistant/system-prompts.ts：
  - ASSISTANT_SYSTEM_PROMPT: 通用 SaaS 助手提示词（帮助用户理解平台功能、分析数据、回答问题）
  - ANALYSIS_SYSTEM_PROMPT: 数据分析专用提示词
  - 提示词中包含平台功能描述，让 AI 能回答"如何修改密码"、"怎么看账单"等问题
- [ ] git commit "feat(ai-assistant): core logic"

### 16.2 AI 助手 API
- [ ] 创建 app/api/ai/assistant/route.ts — 对话 API：
  - POST: 发送消息并获取 AI 回复（流式 SSE 响应）
  - 使用 openai SDK 调 DeepSeek（已有配置）
  - 请求前检查 quota（复用 lib/ai/rate-limiter.ts）
  - 请求后记录用量（复用 lib/ai/usage-tracker.ts）
  - **环境变量降级**：DEEPSEEK_API_KEY 为空时返回 503
- [ ] 创建 app/api/ai/assistant/conversations/route.ts：
  - GET: 列出对话
  - POST: 创建新对话
  - DELETE: 删除对话
- [ ] 创建 app/api/ai/analyze/route.ts — 数据分析 API：
  - POST: 接收分析请求（如"本月用量趋势如何"），查询相关数据，让 AI 生成分析报告
  - 流式返回分析结果
- [ ] git commit "feat(ai-assistant): API routes"

### 16.3 AI 助手页面
- [ ] 创建 app/(dashboard)/dashboard/ai-assistant/page.tsx：
  - 左侧：对话列表（可新建/删除对话）
  - 右侧：聊天界面（消息气泡、流式打字效果）
  - 底部：输入框 + 发送按钮
  - 顶部：模型显示（DeepSeek Chat）+ token 用量提示
- [ ] 创建 components/ai-assistant/ChatMessage.tsx — 消息气泡（区分用户/AI，AI 消息支持 Markdown 渲染）
- [ ] 创建 components/ai-assistant/ChatInput.tsx — 输入框（支持 Enter 发送、Shift+Enter 换行、发送中禁用）
- [ ] 创建 components/ai-assistant/ConversationList.tsx — 对话列表侧边栏
- [ ] 创建 components/ai-assistant/StreamingText.tsx — 流式文本显示组件（逐字出现效果）
- [ ] git commit "feat(ai-assistant): chat UI page"

### 16.4 AI 助手验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] Smoke test：端口 3006，验证 /dashboard/ai-assistant 不返回 500
- [ ] git commit "fix(ai-assistant): resolve any build errors"

---

## Phase 17: 实时协作功能（teammate-realtime）

### 17.1 实时状态核心
- [ ] 创建 lib/realtime/types.ts：
  - PresenceStatus: online, away, offline
  - UserPresence: userId, status, lastSeen, currentPage
  - RealtimeEvent: presence_update, notification_new, team_activity
- [ ] 创建 lib/realtime/presence-manager.ts：
  - 使用内存 Map 管理在线状态（MVP 阶段不需要 Redis）
  - updatePresence(userId, status, currentPage) — 更新用户状态
  - getTeamPresence(teamId) — 获取团队在线成员
  - getOnlineCount(teamId) — 在线人数
  - heartbeat(userId) — 心跳，超过 60 秒无心跳标记为 offline
  - cleanupStale() — 清理过期状态
- [ ] 创建 lib/realtime/event-bus.ts：
  - 简单的发布订阅模式（内存实现）
  - subscribe(channel, callback) — 订阅频道
  - publish(channel, event) — 发布事件
  - unsubscribe(channel, callback) — 取消订阅
  - 频道命名：team:{teamId}:presence, team:{teamId}:notifications, team:{teamId}:activity
- [ ] git commit "feat(realtime): presence manager and event bus"

### 17.2 实时 API
- [ ] 创建 app/api/realtime/presence/route.ts：
  - POST: 更新自己的在线状态 + 当前页面
  - GET: 获取团队成员在线状态列表
- [ ] 创建 app/api/realtime/events/route.ts — SSE 端点：
  - GET: 返回 Server-Sent Events 流
  - 客户端连接后订阅团队频道
  - 推送事件：成员上线/下线、新通知、团队活动
  - 连接断开时自动取消订阅和清理
- [ ] 创建 app/api/realtime/heartbeat/route.ts：
  - POST: 客户端每 30 秒发一次心跳
- [ ] git commit "feat(realtime): SSE and presence API"

### 17.3 实时 UI 组件
- [ ] 创建 components/realtime/OnlineIndicator.tsx — 在线状态圆点（绿色=在线，黄色=离开，灰色=离线）
- [ ] 创建 components/realtime/TeamPresence.tsx — 团队在线成员列表（头像 + 状态 + 当前页面）
- [ ] 创建 components/realtime/useRealtimeEvents.ts — React hook：
  - 建立 SSE 连接到 /api/realtime/events
  - 自动重连（断线后 3 秒重试）
  - 定时发送心跳（30 秒）
  - 返回 { events, isConnected, onlineMembers }
- [ ] 创建 components/realtime/RealtimeProvider.tsx — Context Provider：
  - 包裹整个 dashboard，提供实时状态上下文
  - 子组件通过 useRealtime() hook 消费
- [ ] git commit "feat(realtime): UI components and hooks"

### 17.4 实时验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] Smoke test：端口 3007，验证 /api/realtime/presence 不返回 500
- [ ] git commit "fix(realtime): resolve any build errors"

---

## Phase 18: CI/CD + 部署配置（teammate-devops）

### 18.1 GitHub Actions
- [ ] 创建 .github/workflows/ci.yml：
  - 触发：push to main, pull_request to main
  - Jobs:
    - lint-and-type-check: npx tsc --noEmit
    - build: pnpm build
    - e2e-test: 安装 playwright → pnpm build → npx playwright test（允许失败，设 continue-on-error: true，因为完整 E2E 需要数据库）
  - Node 22, pnpm 缓存
- [ ] 创建 .github/workflows/deploy-preview.yml：
  - 触发：pull_request
  - 使用 Vercel CLI 部署 preview
  - 输出 preview URL 到 PR comment（用 TODO 标记 Vercel token 配置）
- [ ] git commit "feat(devops): GitHub Actions CI pipeline"

### 18.2 Docker 配置
- [ ] 创建 Dockerfile：
  - Multi-stage build（deps → build → runner）
  - 基于 node:22-alpine
  - 使用 pnpm 安装依赖
  - standalone output mode
  - 暴露 3000 端口
- [ ] 创建 docker-compose.yml：
  - 服务：app（Next.js）+ postgres（PostgreSQL 16）
  - 环境变量通过 .env 文件注入
  - postgres 数据持久化到 volume
  - app 依赖 postgres 服务健康检查
- [ ] 创建 docker/.dockerignore
- [ ] git commit "feat(devops): Docker and docker-compose"

### 18.3 Vercel 部署配置
- [ ] 创建 vercel.json：
  - framework: nextjs
  - buildCommand: pnpm build
  - installCommand: pnpm install
  - 环境变量映射（从 Vercel Dashboard 设置，文件只做说明）
- [ ] 更新 next.config.ts — 添加 output: 'standalone'（如果还没有）
- [ ] 创建 scripts/setup-env.sh — 环境变量初始化脚本（交互式引导用户设置所有必要的 env vars）
- [ ] git commit "feat(devops): Vercel config and setup script"

### 18.4 DevOps 验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] 运行 docker build -t saas-starter . （如果 docker 可用，否则跳过）
- [ ] git commit "fix(devops): resolve any build errors"

---

## Phase 19: 最终集成（Lead Agent 负责）

### 19.1 Phase 3 Schema 合并（如果有新表）
- [ ] 检查 Phase 15-18 是否有新的 schema 文件需要合并（AI 助手用内存存储，不需要新表）
- [ ] 如有需要，合并到 schema.ts 并运行 pnpm db:generate && pnpm db:migrate

### 19.2 导航更新
- [ ] Dashboard 侧边栏添加：AI Assistant 导航项
- [ ] 确认 Phase 2 添加的导航项（Billing / Notifications / Integrations）仍然正常
- [ ] Admin 侧边栏确认 Roles / Compliance 正常

### 19.3 全局验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] 全量 Smoke Test（端口 3010），验证所有路由不返回 500：
  - http://localhost:3010（首页）
  - http://localhost:3010/sign-in（登录页）
  - http://localhost:3010/pricing（定价页）
  - http://localhost:3010/admin（管理后台）
  - http://localhost:3010/admin/roles（角色管理）
  - http://localhost:3010/admin/compliance（合规管理）
  - http://localhost:3010/dashboard/billing（计费页面）
  - http://localhost:3010/dashboard/notifications（通知中心）
  - http://localhost:3010/dashboard/integrations（集成市场）
  - http://localhost:3010/dashboard/usage（用量页面）
  - http://localhost:3010/dashboard/ai-assistant（AI 助手）
  - http://localhost:3010/forgot-password（忘记密码）
  - http://localhost:3010/api/realtime/presence（实时状态 API）
- [ ] 修复所有 500 错误
- [ ] 运行 npx playwright test --reporter=list（记录结果，允许部分失败）
- [ ] git commit "feat: phase 2+3 integration complete - all modules verified"
- [ ] 不要创建 COMPLETE 文件，继续 Phase 20

---

## Phase 20: 第四轮初始化（Lead 负责）

### 20.1 安装新依赖
- [ ] pnpm add next-auth @auth/drizzle-adapter arctic
- [ ] pnpm add swagger-ui-react @types/swagger-ui-react
- [ ] pnpm add recharts（如尚未安装则跳过）
- [ ] pnpm add gray-matter next-mdx-remote rehype-highlight rehype-slug remark-gfm
- [ ] pnpm add framer-motion

### 20.2 创建目录结构
- [ ] mkdir -p lib/oauth/providers
- [ ] mkdir -p lib/api-gateway
- [ ] mkdir -p lib/analytics
- [ ] mkdir -p lib/feature-flags
- [ ] mkdir -p app/(dashboard)/dashboard/analytics
- [ ] mkdir -p app/(dashboard)/dashboard/feature-flags
- [ ] mkdir -p app/api/v1
- [ ] mkdir -p app/api/api-keys
- [ ] mkdir -p app/api/analytics
- [ ] mkdir -p app/api/feature-flags
- [ ] mkdir -p app/docs
- [ ] mkdir -p content/docs
- [ ] mkdir -p components/landing
- [ ] mkdir -p lib/db（已存在）

### 20.3 提交
- [ ] git commit "chore: phase 4 setup - OAuth, API Gateway, Analytics, Feature Flags, Docs, Landing"

---

## Phase 21: OAuth/SSO 社交登录 + 2FA（teammate-oauth，Opus）

### 21.1 OAuth Provider 抽象层
- [ ] 创建 lib/oauth/types.ts：OAuthProvider 接口（authorize, callback, getProfile）
- [ ] 创建 lib/oauth/providers/google.ts：Google OAuth provider（使用 arctic 库）
- [ ] 创建 lib/oauth/providers/github.ts：GitHub OAuth provider（使用 arctic 库）
- [ ] 创建 lib/oauth/factory.ts：根据 provider 名称返回对应实例
- [ ] 环境变量降级：GOOGLE_CLIENT_ID / GITHUB_CLIENT_ID 为空时，对应 provider 不可用但不报错

### 21.2 OAuth API 路由
- [ ] 创建 app/api/auth/oauth/[provider]/route.ts：发起 OAuth 重定向
- [ ] 创建 app/api/auth/oauth/[provider]/callback/route.ts：处理回调，创建/关联用户
- [ ] 处理新用户自动注册（创建 user + 默认 team）
- [ ] 处理已有用户关联（同 email 自动关联）

### 21.3 TOTP 二因素认证
- [ ] 创建 lib/db/oauth-schema.ts：twoFactorSecrets 表（userId, secret, enabled, backupCodes）、oauthAccounts 表（userId, provider, providerAccountId）
- [ ] 创建 lib/oauth/totp.ts：generateSecret, generateQRCode, verifyToken
- [ ] 创建 app/api/auth/2fa/setup/route.ts：生成 secret + QR code
- [ ] 创建 app/api/auth/2fa/verify/route.ts：验证 TOTP token
- [ ] 创建 app/api/auth/2fa/disable/route.ts：关闭 2FA

### 21.4 UI 页面
- [ ] 创建 app/(dashboard)/dashboard/security/page.tsx：安全设置页面（关联社交账号 + 2FA 开关）
- [ ] 修改登录页面添加"使用 Google/GitHub 登录"按钮（在 app/(login)/login.tsx 中添加，不改动已有逻辑）

### 21.5 验证
- [ ] npx tsc --noEmit
- [ ] pnpm build
- [ ] Smoke test：端口 3011，验证 /dashboard/security 不返回 500

---

## Phase 22: Public API Gateway（teammate-api-gateway，Opus）

### 22.1 API Key 管理
- [ ] 创建 lib/db/api-gateway-schema.ts：apiKeys 表（id, teamId, name, keyHash, prefix, permissions, rateLimit, lastUsedAt, expiresAt）、apiRequestLogs 表（id, apiKeyId, method, path, statusCode, latencyMs, timestamp）
- [ ] 创建 lib/api-gateway/key-manager.ts：generateApiKey, hashKey, validateKey, revokeKey
- [ ] 创建 lib/api-gateway/rate-limiter.ts：基于 sliding window 的 API 限流（内存存储）
- [ ] 创建 lib/api-gateway/middleware.ts：API 认证中间件（从 header 提取 key → 验证 → 注入 team context）

### 22.2 Versioned API 路由
- [ ] 创建 app/api/v1/teams/route.ts：GET 获取团队信息
- [ ] 创建 app/api/v1/members/route.ts：GET 列出成员，POST 邀请成员
- [ ] 创建 app/api/v1/activity/route.ts：GET 获取活动日志
- [ ] 创建 app/api/v1/usage/route.ts：GET 获取 AI 用量统计
- [ ] 所有 v1 路由使用统一的 API 中间件（认证 + 限流 + 日志）

### 22.3 OpenAPI 文档
- [ ] 创建 lib/api-gateway/openapi-spec.ts：OpenAPI 3.0 JSON spec（描述所有 v1 端点）
- [ ] 创建 app/api/v1/docs/route.ts：返回 OpenAPI JSON
- [ ] 创建 app/(dashboard)/dashboard/api-keys/page.tsx：API Key 管理页面（创建/查看/吊销 key）
- [ ] 创建 app/(dashboard)/dashboard/api-docs/page.tsx：嵌入 Swagger UI 展示 API 文档

### 22.4 验证
- [ ] npx tsc --noEmit
- [ ] pnpm build
- [ ] Smoke test：端口 3012，验证 /dashboard/api-keys 和 /api/v1/docs 不返回 500

---

## Phase 23: Analytics 数据分析平台（teammate-analytics，Sonnet）

### 23.1 事件追踪
- [ ] 创建 lib/db/analytics-schema.ts：analyticsEvents 表（id, teamId, userId, eventName, eventData, sessionId, pageUrl, referrer, userAgent, timestamp）、funnels 表（id, teamId, name, steps, createdAt）
- [ ] 创建 lib/analytics/tracker.ts：trackEvent（server-side）, batchInsert
- [ ] 创建 lib/analytics/client-tracker.ts：前端埋点 hook useTrackEvent
- [ ] 创建 app/api/analytics/track/route.ts：接收客户端埋点事件

### 23.2 数据聚合查询
- [ ] 创建 lib/analytics/queries.ts：
  - getEventsByDateRange：按日期范围查询事件
  - getTopEvents：热门事件排行
  - getPageViews：页面浏览量统计
  - getUserRetention：用户留存率（Day 1/7/30）
  - getFunnelConversion：漏斗转化率计算

### 23.3 Dashboard 页面
- [ ] 创建 app/(dashboard)/dashboard/analytics/page.tsx：分析总览
  - 实时事件流（最近 24h 事件时间线）
  - 页面浏览量折线图（recharts）
  - 热门事件 Top 10 柱状图
  - 用户留存曲线
- [ ] 创建 app/(dashboard)/dashboard/analytics/funnels/page.tsx：漏斗分析
  - 创建/编辑漏斗（定义步骤）
  - 漏斗可视化（步骤间转化率）

### 23.4 验证
- [ ] npx tsc --noEmit
- [ ] pnpm build
- [ ] Smoke test：端口 3013，验证 /dashboard/analytics 不返回 500

---

## Phase 24: Feature Flags 功能开关系统（teammate-feature-flags，Sonnet）

### 24.1 Flag 引擎
- [ ] 创建 lib/db/feature-flags-schema.ts：featureFlags 表（id, key, name, description, type: boolean|percentage|userList|teamList, enabled, rolloutPercentage, targetUserIds, targetTeamIds, createdAt, updatedAt）
- [ ] 创建 lib/feature-flags/engine.ts：
  - evaluateFlag(flagKey, context: {userId, teamId})：返回 boolean
  - 支持 4 种策略：全局开关、百分比灰度、指定用户、指定团队
  - 内存缓存 flags（TTL 60s），避免每次查 DB
- [ ] 创建 lib/feature-flags/react.ts：
  - FeatureFlagProvider（React Context）
  - useFeatureFlag(key) hook
  - FeatureGate 组件（条件渲染）

### 24.2 管理 API
- [ ] 创建 app/api/feature-flags/route.ts：GET 列出所有 flags，POST 创建 flag
- [ ] 创建 app/api/feature-flags/[id]/route.ts：PUT 更新 flag，DELETE 删除 flag
- [ ] 创建 app/api/feature-flags/evaluate/route.ts：POST 批量评估 flags（供前端 Provider 调用）

### 24.3 管理页面
- [ ] 创建 app/(dashboard)/dashboard/feature-flags/page.tsx：Flag 管理列表
  - 创建新 flag（名称、key、类型、初始状态）
  - 每个 flag 有 toggle 开关
  - 编辑 flag 详情（百分比滑块、用户/团队选择器）
  - 删除 flag（带确认弹窗）

### 24.4 验证
- [ ] npx tsc --noEmit
- [ ] pnpm build
- [ ] Smoke test：端口 3014，验证 /dashboard/feature-flags 不返回 500

---

## Phase 25: Documentation 文档站（teammate-docs，Sonnet）

### 25.1 MDX 基础设施
- [ ] 创建 lib/docs/mdx.ts：MDX 编译配置（gray-matter 解析 frontmatter，next-mdx-remote 渲染）
- [ ] 创建 lib/docs/sidebar.ts：从 content/docs/ 目录结构自动生成侧边栏导航树
- [ ] 创建 lib/docs/search.ts：简单的全文搜索（遍历所有 MDX 文件的 frontmatter + 内容）

### 25.2 文档内容
- [ ] 创建 content/docs/getting-started.mdx：快速开始指南
- [ ] 创建 content/docs/authentication.mdx：认证系统说明
- [ ] 创建 content/docs/billing.mdx：计费系统说明
- [ ] 创建 content/docs/api-reference.mdx：API 参考（链接到 Swagger UI）
- [ ] 创建 content/docs/deployment.mdx：部署指南（Vercel + Docker）
- [ ] 每个 MDX 文件包含 frontmatter：title, description, order

### 25.3 文档页面
- [ ] 创建 app/docs/layout.tsx：文档布局（左侧边栏导航 + 右侧内容 + 目录 TOC）
- [ ] 创建 app/docs/[[...slug]]/page.tsx：动态路由渲染 MDX
- [ ] 创建 components/docs/Sidebar.tsx：侧边栏组件（支持折叠）
- [ ] 创建 components/docs/TOC.tsx：页内目录（从 headings 提取）
- [ ] 创建 components/docs/SearchDialog.tsx：搜索弹窗（Ctrl+K 触发）
- [ ] 创建 components/docs/CodeBlock.tsx：代码高亮组件（rehype-highlight）

### 25.4 验证
- [ ] npx tsc --noEmit
- [ ] pnpm build
- [ ] Smoke test：端口 3015，验证 /docs 和 /docs/getting-started 不返回 500

---

## Phase 26: Landing Page 重新设计（teammate-landing，Sonnet）

### 26.1 组件创建
- [ ] 创建 components/landing/Hero.tsx：首屏英雄区（大标题 + 副标题 + CTA 按钮 + 产品截图/插图）
- [ ] 创建 components/landing/Features.tsx：功能展示网格（6 个功能卡片，icon + 标题 + 描述）
- [ ] 创建 components/landing/Testimonials.tsx：用户评价轮播（3-5 条 mock 评价）
- [ ] 创建 components/landing/FAQ.tsx：常见问题折叠面板（Accordion 组件）
- [ ] 创建 components/landing/CTA.tsx：底部行动号召区（深色背景 + 标题 + 按钮）
- [ ] 创建 components/landing/Stats.tsx：数据统计展示（3-4 个关键指标动画计数）
- [ ] 所有组件使用 framer-motion 做入场动画（scroll-triggered）

### 26.2 页面整合
- [ ] 修改 app/(marketing)/page.tsx（或新建），整合所有 landing 组件
- [ ] 确保响应式布局（mobile-first）
- [ ] 深色/浅色模式适配

### 26.3 验证
- [ ] npx tsc --noEmit
- [ ] pnpm build
- [ ] Smoke test：端口 3016，验证首页 / 不返回 500

---

## Phase 27: 最终集成验证（Lead 负责）

### 27.1 Schema 合并
- [ ] 将 oauth-schema.ts、api-gateway-schema.ts、analytics-schema.ts、feature-flags-schema.ts 中的表定义合并到 lib/db/schema.ts
- [ ] 运行 pnpm db:generate && pnpm db:migrate

### 27.2 导航更新
- [ ] Dashboard 侧边栏添加：Analytics、Feature Flags、API Keys、AI Assistant、Security 导航项
- [ ] 确认已有导航项（Billing / Notifications / Integrations / Usage）正常
- [ ] 顶部导航或 Footer 添加 Docs 链接

### 27.3 Landing Page 集成
- [ ] 确认首页使用新的 Landing Page 组件
- [ ] 确认 Pricing 页面仍然正常

### 27.4 全局验证
- [ ] 运行 npx tsc --noEmit
- [ ] 运行 pnpm build
- [ ] 全量 Smoke Test（端口 3010），验证所有路由不返回 500：
  - http://localhost:3010（首页 - 新 Landing Page）
  - http://localhost:3010/sign-in（登录页 - 含社交登录按钮）
  - http://localhost:3010/pricing（定价页）
  - http://localhost:3010/docs（文档站）
  - http://localhost:3010/docs/getting-started（文档内页）
  - http://localhost:3010/admin（管理后台）
  - http://localhost:3010/admin/roles（角色管理）
  - http://localhost:3010/admin/compliance（合规管理）
  - http://localhost:3010/dashboard/billing（计费页面）
  - http://localhost:3010/dashboard/notifications（通知中心）
  - http://localhost:3010/dashboard/integrations（集成市场）
  - http://localhost:3010/dashboard/usage（用量页面）
  - http://localhost:3010/dashboard/ai-assistant（AI 助手）
  - http://localhost:3010/dashboard/analytics（数据分析）
  - http://localhost:3010/dashboard/feature-flags（功能开关）
  - http://localhost:3010/dashboard/api-keys（API Key 管理）
  - http://localhost:3010/dashboard/security（安全设置）
  - http://localhost:3010/dashboard/api-docs（API 文档）
  - http://localhost:3010/forgot-password（忘记密码）
  - http://localhost:3010/api/realtime/presence（实时状态 API）
  - http://localhost:3010/api/v1/docs（OpenAPI spec）
- [ ] 修复所有 500 错误
- [ ] 运行 npx playwright test --reporter=list（记录结果，允许部分失败）
- [ ] git commit "feat: all 15 modules integration complete - full SaaS platform verified"
- [ ] echo 'done' > COMPLETE && git add COMPLETE && git commit -m 'chore: mark all phases complete'
- [ ] 输出 COMPLETE
