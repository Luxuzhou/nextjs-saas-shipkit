#!/bin/bash
# SaaS Starter Enhanced - Agent Teams 过夜构建启动脚本
# 使用方式：cd D:/Projects/saas-starter-enhanced && bash start.sh

export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

echo "=========================================="
echo "  SaaS Starter Enhanced - Agent Teams"
echo "  启动时间: $(date)"
echo "=========================================="
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
  echo "[警告] .env 文件不存在！请先创建 .env 并填入以下变量："
  echo "  POSTGRES_URL=postgresql://..."
  echo "  STRIPE_SECRET_KEY=sk_test_..."
  echo "  STRIPE_WEBHOOK_SECRET=whsec_..."
  echo "  BASE_URL=http://localhost:3000"
  echo "  AUTH_SECRET=$(openssl rand -base64 32)"
  echo ""
  echo "可选（新增功能需要）："
  echo "  RESEND_API_KEY=re_..."
  echo "  LEMON_SQUEEZY_API_KEY=..."
  echo "  DEEPSEEK_API_KEY=sk-..."
  echo ""
  echo "退出。请配置好 .env 后重新运行。"
  exit 1
fi

echo "✓ .env 文件存在"
echo "预计运行 4-6 小时"
echo "完成标志：输出 COMPLETE"
echo ""

claude --dangerously-skip-permissions -p "
你是技术负责人（Lead Agent），今晚要在已有的 Next.js SaaS Starter 基础上完成 5 个增强模块。

## 你的核心原则
1. 你自己只做 Phase 0（初始化）和 Phase 6（集成验证），不要自己写业务代码
2. 所有业务开发委派给 teammate
3. 如果某个 teammate 报错或卡住，帮它诊断并给出修复方案
4. 所有 teammate 完成后才开始 Phase 6 集成
5. 最终 pnpm build 必须成功才能输出 COMPLETE

## Phase 0: 你先做
1. 读取 CLAUDE.md 和 TODO.md 了解项目全貌
2. 读取已有代码的关键文件：
   - lib/db/schema.ts（了解已有数据模型）
   - lib/payments/stripe.ts（了解已有支付实现）
   - lib/auth/session.ts（了解已有 auth 实现）
   - app/(login)/actions.ts（了解已有 Server Actions）
   - middleware.ts（了解已有中间件）
3. 运行 pnpm install
4. 统一安装所有新增依赖（重要：teammate 禁止自行 pnpm add）：
   pnpm add recharts date-fns resend @react-email/components @react-email/render @lemonsqueezy/lemonsqueezy.js next-intl openai @tanstack/react-table
5. 用 npx shadcn@latest add 安装需要的 UI 组件
6. 创建 TODO.md 中列出的所有目录结构
7. 创建 .env（如果不存在，用占位值）
8. git commit 初始化

## 然后分配 5 个 teammate（Opus 做复杂模块，Sonnet 做标准模块）

### teammate-payments（多支付抽象层）— 用 Opus 模型
指令：执行 TODO.md 中的 Phase 3。你负责将已有的 Stripe 集成重构为 Provider 模式，并新增 Lemon Squeezy Provider。
关键原则：
1. 先读懂已有的 lib/payments/stripe.ts 和 lib/payments/actions.ts 的所有代码
2. 不要删除或修改原 lib/payments/stripe.ts，创建新的 providers/stripe.ts 包装它
3. Lemon Squeezy 不确定的 API 调用写好类型签名，内部标 TODO，不要瞎猜
4. Pricing 页面适配是低优先级，如果改动导致已有 Stripe 流程报错立即回退
5. 不要自行 pnpm add，依赖已统一安装
6. 完成后运行 npx tsc --noEmit 和 pnpm build

### teammate-admin（管理后台）— 用 Sonnet 模型
指令：执行 TODO.md 中的 Phase 1。你负责创建完整的管理后台，包括数据看板（带 recharts 图表）、用户管理、活动日志、订阅管理。
关键原则：
1. Admin 权限用邮箱白名单方式（ADMIN_EMAILS 常量），不要改动已有 schema 添加 isAdmin 字段
2. 严格只创建和编辑 CLAUDE.md 中你的专属文件
3. 完成后运行 npx tsc --noEmit 和 pnpm build

### teammate-email（邮件系统 + Auth 增强）— 用 Sonnet 模型
指令：执行 TODO.md 中的 Phase 2。你负责搭建 Resend 邮件系统、创建 React Email 模板、实现忘记密码完整流程。
关键原则：
1. 你有例外权限修改 actions.ts（添加发送邮件调用）
2. **禁止修改 lib/db/schema.ts**，将新表定义写在 lib/db/email-schema.ts 中
3. 不要自行 pnpm add，依赖已统一安装
4. 完成后运行 npx tsc --noEmit 和 pnpm build

### teammate-i18n（国际化）— 用 Sonnet 模型
指令：执行 TODO.md 中的 Phase 4。你负责搭建 next-intl 国际化系统。
关键原则：
1. **禁止修改根 middleware.ts**，将 intl 中间件配置导出到 lib/i18n/middleware.ts
2. **禁止修改已有页面**，只对你新建的文件使用翻译函数
3. 不要自行 pnpm add，依赖已统一安装
4. 完成后运行 npx tsc --noEmit 和 pnpm build

### teammate-ai（AI 用量追踪）— 用 Sonnet 模型
指令：执行 TODO.md 中的 Phase 5。你负责创建 AI 用量追踪和计费系统。
关键原则：
1. **禁止修改 lib/db/schema.ts**，将新表定义写在 lib/db/ai-schema.ts 中
2. 修改 dashboard/layout.tsx 时只添加 Usage 导航项，不要改动其他导航
3. 示例 AI 聊天端点用 openai SDK 调 DeepSeek（baseURL: https://api.deepseek.com, model: deepseek-chat）
4. 不要自行 pnpm add，依赖已统一安装
5. 完成后运行 npx tsc --noEmit 和 pnpm build

## Phase 6: 集成验证（你负责）
等所有 teammate 完成后：
1. 合并 Schema：将 lib/db/email-schema.ts 和 lib/db/ai-schema.ts 中的表定义合并到 lib/db/schema.ts，然后运行 pnpm db:generate && pnpm db:migrate
2. 合并 Middleware：读取 lib/i18n/middleware.ts 导出的配置，修改根 middleware.ts 将 next-intl 与已有 auth session 刷新逻辑合并
3. 运行 npx tsc --noEmit 检查全局类型
4. 运行 pnpm build 检查构建
5. 有错误就定位并指派对应 teammate 修复
6. 确认导航互通（顶部导航 + 各侧边栏）
7. 反复修复直到 pnpm build 成功
8. 最终 git commit 并输出 COMPLETE

现在开始执行 Phase 0。
"
