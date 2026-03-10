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
4. 安装公共依赖：pnpm add recharts date-fns
5. 用 npx shadcn@latest add 安装需要的 UI 组件
6. 创建 TODO.md 中列出的所有目录结构
7. 创建 .env（如果不存在，用占位值）
8. git commit 初始化

## 然后分配 5 个 teammate（全部用 Sonnet 模型）

### teammate-admin（管理后台）
指令：执行 TODO.md 中的 Phase 1。你负责创建完整的管理后台，包括数据看板（带 recharts 图表）、用户管理、活动日志、订阅管理。严格只创建和编辑 CLAUDE.md 中你的专属文件。完成后运行 npx tsc --noEmit 和 pnpm build 确认无错误。

### teammate-email（邮件系统 + Auth 增强）
指令：执行 TODO.md 中的 Phase 2。你负责搭建 Resend 邮件系统、创建 React Email 模板、实现忘记密码完整流程。你有例外权限修改 actions.ts 和 schema.ts（添加邮件相关内容），但不要改动其他已有文件的逻辑。修改 schema.ts 后运行 pnpm db:generate。完成后运行 npx tsc --noEmit 和 pnpm build。

### teammate-payments（多支付抽象层）
指令：执行 TODO.md 中的 Phase 3。你负责将已有的 Stripe 集成重构为 Provider 模式，并新增 Lemon Squeezy Provider。这是最有技术深度的模块——定义好 PaymentProvider interface，然后让 Stripe 和 Lemon Squeezy 都实现它，通过 factory 模式切换。修改 pricing 页面适配新接口。完成后运行 npx tsc --noEmit 和 pnpm build。

### teammate-i18n（国际化）
指令：执行 TODO.md 中的 Phase 4。你负责搭建 next-intl 国际化系统。重要策略：先搭基础设施（config、middleware、翻译文件），再做 LocaleSwitcher 组件，最后才碰已有页面。修改 middleware.ts 时务必保留已有的 auth session 刷新逻辑，合并两个中间件而不是替换。如果时间紧张，已有页面的国际化可以只做 Landing Page 和登录页。完成后运行 npx tsc --noEmit 和 pnpm build。

### teammate-ai（AI 用量追踪）
指令：执行 TODO.md 中的 Phase 5。你负责创建 AI 用量追踪和计费系统。包括 schema（aiUsageLogs + aiQuotas 表）、用量追踪核心逻辑、速率限制、一个示例 AI 聊天端点（用 openai SDK 调 DeepSeek：baseURL https://api.deepseek.com, model deepseek-chat）、以及用量 Dashboard 页面（带 recharts 图表）。修改 schema.ts 后运行 pnpm db:generate。修改 dashboard/layout.tsx 时只添加 Usage 导航项，不要改动其他导航。完成后运行 npx tsc --noEmit 和 pnpm build。

## Phase 6: 集成验证（你负责）
等所有 teammate 完成后：
1. 运行 npx tsc --noEmit 检查全局类型
2. 运行 pnpm build 检查构建
3. 有错误就定位并指派对应 teammate 修复
4. 确认导航互通（顶部导航 + 各侧边栏）
5. 确认 middleware 同时支持 auth 和 i18n
6. 最终 pnpm build 成功后 git commit 并输出 COMPLETE

现在开始执行 Phase 0。
"
