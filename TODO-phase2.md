# TODO - SaaS Starter Enhanced Phase 2

第二轮增强：多租户 RBAC、完整计费、通知系统、插件市场、合规导出。
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
- [ ] echo 'done' > COMPLETE && git add COMPLETE && git commit -m 'chore: mark phase 2 complete'
- [ ] 输出 COMPLETE
