你是技术负责人（Lead Agent），这是第二轮增强，要在已有基础上完成 5 个高级模块：多租户 RBAC、完整计费、通知系统、插件市场、GDPR 合规。

## 首要步骤：检查进度
1. 读取 CLAUDE.md 和 TODO-phase2.md（注意是 phase2 文件）
2. 运行 git log --oneline -30 查看已有 commit
3. 检查 TODO-phase2.md 中哪些 checkbox 已经打勾 [x]
4. 如果是首次执行，从 Phase 7 开始
5. 如果是断点续跑，跳过已完成的步骤继续
6. 如果所有 Phase 都已完成但 COMPLETE 文件不存在，直接跑 Phase 13 的验证步骤

## 你的核心原则
1. 你自己只做 Phase 7（初始化）和 Phase 13（集成验证），不要自己写业务代码
2. 所有业务开发委派给 teammate
3. 如果某个 teammate 报错或卡住，帮它诊断并给出修复方案
4. 所有 teammate 完成后才开始 Phase 13 集成
5. 最终 pnpm build 必须成功 + smoke test 通过才能输出 COMPLETE

## Smoke Test 规范
端口分配：
- teammate-rbac: PORT=3001
- teammate-billing: PORT=3002
- teammate-notifications: PORT=3003
- teammate-plugins: PORT=3004
- teammate-compliance: PORT=3005
- Phase 13 集成验证: PORT=3010

标准流程：启动 dev server 指定端口 → 等就绪 → curl 验证路由 → kill 进程 + taskkill 兜底。
判断标准：200/302/307/401 = 通过，500 = 修复。

## Phase 7: 你先做
0. 运行 git config core.longpaths true
1. 删除旧的 COMPLETE 文件（如果存在）：rm -f COMPLETE
2. 读取已有代码关键文件：
   - lib/db/schema.ts（了解当前所有表结构）
   - lib/rbac/ 或 lib/billing/ 等目录（如果已有部分代码）
   - lib/ai/types.ts（了解现有 AI 用量类型，billing 模块需要复用）
   - lib/payments/types.ts（了解现有支付类型，billing 模块需要复用）
3. 安装新增依赖（teammate 禁止自行安装）：
   pnpm add uuid @types/uuid csv-stringify archiver @types/archiver
4. 创建 TODO-phase2.md 中列出的所有目录结构
5. git commit "chore: phase 2 setup"

## 然后分配 5 个 teammate（Opus 做复杂模块，Sonnet 做标准模块）

### teammate-rbac（多租户 + RBAC 权限体系）— 用 Opus 模型
指令：执行 TODO-phase2.md 中的 Phase 8。你负责创建完整的 RBAC 权限系统。
关键原则：
1. 先读懂已有的 lib/db/schema.ts 中 users/teams/teamMembers 表结构
2. 先读懂已有的 lib/db/admin-auth.ts 和 admin-queries.ts 的权限检查逻辑
3. **禁止修改 lib/db/schema.ts**，将新表定义写在 lib/db/rbac-schema.ts 中
4. **禁止修改 lib/db/admin-auth.ts**，RBAC 逻辑放在 lib/rbac/ 中，原有 admin 白名单机制保持不动
5. 新建的角色管理页面放在 app/(admin)/admin/roles/，不要碰已有的 admin 页面
6. 不要自行 pnpm add
7. 完成后运行 npx tsc --noEmit 和 pnpm build
8. Smoke test：端口 3001，验证 /admin/roles 不返回 500

### teammate-billing（完整计费系统）— 用 Opus 模型
指令：执行 TODO-phase2.md 中的 Phase 9。你负责创建完整的计费系统。
关键原则：
1. 先读懂 lib/ai/billing.ts 和 lib/ai/usage-tracker.ts（已有的 AI 用量计费逻辑）
2. 先读懂 lib/payments/types.ts 和 lib/payments/providers/（已有的支付抽象层）
3. **禁止修改 lib/db/schema.ts**，新表写在 lib/db/billing-schema.ts
4. **禁止修改 lib/ai/ 下的文件**，billing 模块可以 import 和复用它们的类型和函数
5. **禁止修改 lib/payments/ 下的已有文件**，billing 模块可以 import 它们
6. **环境变量降级**：Stripe 不可用时返回 mock 数据
7. Dashboard 页面在 app/(dashboard)/dashboard/billing/，不要碰其他 dashboard 页面
8. 不要自行 pnpm add
9. 完成后运行 npx tsc --noEmit 和 pnpm build
10. Smoke test：端口 3002，验证 /dashboard/billing 不返回 500

### teammate-notifications（通知 + Webhook 系统）— 用 Sonnet 模型
指令：执行 TODO-phase2.md 中的 Phase 10。你负责创建通知中心和 Webhook 系统。
关键原则：
1. 先读懂 lib/email/send.ts（已有的邮件发送封装），通知的邮件渠道可以复用它
2. **禁止修改 lib/db/schema.ts**，新表写在 lib/db/notifications-schema.ts
3. **禁止修改 lib/email/ 下的已有文件**，可以 import 复用
4. **环境变量降级**：邮件通知在 RESEND_API_KEY 为空时跳过
5. Dashboard 页面在 app/(dashboard)/dashboard/notifications/
6. NotificationBell 组件创建在 components/notifications/，不要自行添加到导航栏，Lead 在集成阶段处理
7. 不要自行 pnpm add
8. 完成后运行 npx tsc --noEmit 和 pnpm build
9. Smoke test：端口 3003，验证 /dashboard/notifications 不返回 500

### teammate-plugins（插件/集成市场）— 用 Sonnet 模型
指令：执行 TODO-phase2.md 中的 Phase 11。你负责创建插件系统和集成市场。
关键原则：
1. **禁止修改 lib/db/schema.ts**，新表写在 lib/db/plugins-schema.ts
2. 插件系统是独立的，不依赖其他新模块
3. 内置插件（Slack/GitHub/Zapier）写好类型和接口，实际集成代码用 TODO 标记
4. configSchema 使用 JSON Schema 格式，页面根据 schema 动态生成表单
5. Dashboard 页面在 app/(dashboard)/dashboard/integrations/
6. 不要自行 pnpm add
7. 完成后运行 npx tsc --noEmit 和 pnpm build
8. Smoke test：端口 3004，验证 /dashboard/integrations 不返回 500

### teammate-compliance（数据导出 + 审计 + GDPR）— 用 Sonnet 模型
指令：执行 TODO-phase2.md 中的 Phase 12。你负责创建合规系统。
关键原则：
1. 先读懂已有的 activityLogs 表结构（lib/db/schema.ts），新的 auditLogs 是更详细的版本，两者共存
2. **禁止修改 lib/db/schema.ts**，新表写在 lib/db/compliance-schema.ts
3. 数据导出生成 CSV 格式文件，保存到项目根目录 exports/ 文件夹（确保该目录在 .gitignore 中）
4. Admin 页面在 app/(admin)/admin/compliance/，不要碰已有的 admin 页面
5. 不要自行 pnpm add
6. 完成后运行 npx tsc --noEmit 和 pnpm build
7. Smoke test：端口 3005，验证 /admin/compliance 不返回 500

## Phase 13: 集成验证（你负责）
等所有 teammate 完成后：
1. 合并 Schema：将 rbac-schema.ts、billing-schema.ts、notifications-schema.ts、plugins-schema.ts、compliance-schema.ts 中的表定义合并到 lib/db/schema.ts，然后运行 pnpm db:generate && pnpm db:migrate
2. 更新 Dashboard 侧边栏（app/(dashboard)/dashboard/layout.tsx）：添加 Billing、Notifications、Integrations 导航项
3. 更新 Admin 侧边栏（app/(admin)/admin/layout.tsx）：添加 Roles、Compliance 导航项
4. 运行 npx tsc --noEmit
5. 运行 pnpm build
6. 有错误就定位并指派对应 teammate 修复
7. 反复修复直到 pnpm build 成功
8. 全量 Smoke Test（端口 3010）：
   - http://localhost:3010（首页）
   - http://localhost:3010/admin（管理后台）
   - http://localhost:3010/admin/roles（角色管理）
   - http://localhost:3010/admin/compliance（合规管理）
   - http://localhost:3010/dashboard/billing（计费页面）
   - http://localhost:3010/dashboard/notifications（通知中心）
   - http://localhost:3010/dashboard/integrations（集成市场）
   - http://localhost:3010/dashboard/usage（用量页面 — 确认未被破坏）
   如果有 500 错误，修复后重新验证。
9. Phase 2 验证通过后：
   - git commit 'feat: phase 2 integration complete - all modules verified'
   - 不要创建 COMPLETE 文件，继续 Phase 14

## Phase 14: 你继续做（第三轮初始化）
1. 安装新依赖：pnpm add -D playwright @playwright/test && npx playwright install chromium
2. 创建 TODO-phase2.md 中 Phase 14 列出的目录结构
3. git commit "chore: phase 3 setup"
4. 分配 4 个 teammate（Phase 15-18）

### teammate-e2e（E2E 测试套件）— 用 Sonnet 模型
指令：执行 TODO-phase2.md 中的 Phase 15。你负责用 Playwright 写全站 E2E 测试。
关键原则：
1. 先读懂项目的路由结构（app/ 目录下的所有 page.tsx）
2. 测试文件全部放在 e2e/ 目录下
3. 不要修改任何业务代码，只写测试
4. 部分测试因数据库状态可能失败是预期的，但测试代码本身不能有语法错误
5. playwright.config.ts 中 webServer 使用 pnpm dev
6. 不要自行 pnpm add
7. 完成后运行 npx tsc --noEmit 和 pnpm build（确认测试文件不影响构建）
8. 运行 npx playwright test --reporter=list 验证测试能执行

### teammate-ai-assistant（AI 智能助手）— 用 Opus 模型
指令：执行 TODO-phase2.md 中的 Phase 16。你负责创建带流式输出的 AI 聊天助手。
关键原则：
1. 先读懂 lib/ai/（已有的 usage-tracker、rate-limiter、billing），对话 API 中要复用它们
2. 先读懂 app/api/ai/chat/route.ts（已有的 chat 端点），了解 DeepSeek 调用方式
3. **禁止修改 lib/ai/ 下的已有文件**，可以 import 复用
4. 对话历史用内存 Map 存储（不需要新建数据库表）
5. 流式响应用标准 Web Streams API（ReadableStream + TextEncoder），不要用第三方库
6. **环境变量降级**：DEEPSEEK_API_KEY 为空时返回 503
7. 页面在 app/(dashboard)/dashboard/ai-assistant/
8. 不要自行 pnpm add
9. 完成后运行 npx tsc --noEmit 和 pnpm build
10. Smoke test：端口 3006，验证 /dashboard/ai-assistant 不返回 500

### teammate-realtime（实时协作功能）— 用 Sonnet 模型
指令：执行 TODO-phase2.md 中的 Phase 17。你负责创建实时在线状态和事件推送系统。
关键原则：
1. 使用 Server-Sent Events（SSE），不要用 WebSocket（Next.js App Router 原生支持 SSE，不支持 WS）
2. 在线状态用内存 Map 管理（不需要新建数据库表）
3. 事件总线用内存发布订阅模式
4. API 路由在 app/api/realtime/
5. UI 组件在 components/realtime/，不要自行添加到任何 layout，Lead 在集成阶段处理
6. useRealtimeEvents hook 要处理 SSE 自动重连
7. 不要自行 pnpm add
8. 完成后运行 npx tsc --noEmit 和 pnpm build
9. Smoke test：端口 3007，验证 /api/realtime/presence 不返回 500

### teammate-devops（CI/CD + 部署）— 用 Sonnet 模型
指令：执行 TODO-phase2.md 中的 Phase 18。你负责创建 GitHub Actions、Docker、Vercel 部署配置。
关键原则：
1. GitHub Actions CI 流水线必须包含 tsc + build 两个 job
2. E2E test job 设 continue-on-error: true（因为需要数据库）
3. Dockerfile 使用 multi-stage build + standalone output
4. docker-compose.yml 包含 app + postgres 两个服务
5. 不要修改 next.config.ts 除了添加 output: 'standalone'
6. Vercel 部署配置用 vercel.json
7. 不要自行 pnpm add
8. 完成后运行 npx tsc --noEmit 和 pnpm build
9. 如果 docker 命令可用，运行 docker build 验证；不可用则跳过

## Phase 19: 最终集成（你负责）
等所有 Phase 15-18 的 teammate 完成后：
1. 检查是否有新 schema 需要合并（AI 助手和实时协作用内存存储，通常不需要）
2. Dashboard 侧边栏添加 AI Assistant 导航项
3. 运行 npx tsc --noEmit
4. 运行 pnpm build
5. 全量 Smoke Test（端口 3010），验证所有路由不返回 500：
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
   - http://localhost:3010/api/realtime/presence（实时状态）
6. 修复所有 500 错误
7. 运行 npx playwright test --reporter=list（记录结果，允许部分失败）
8. git commit 'feat: phase 2+3 integration complete - all modules verified'
9. echo 'done' > COMPLETE && git add COMPLETE && git commit -m 'chore: mark phase 2+3 complete'
10. 输出 COMPLETE

现在开始：先检查进度，再决定从哪里开始执行。
