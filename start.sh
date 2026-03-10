#!/bin/bash
# SaaS Starter Enhanced - Agent Teams 过夜构建启动脚本
# 使用方式：cd D:/Projects/saas-starter-enhanced && bash start.sh
# 特性：Ralph Loop 自动重启 + Smoke Test 路由验证 + 端口隔离

export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

echo "=========================================="
echo "  SaaS Starter Enhanced - Agent Teams"
echo "  启动时间: $(date)"
echo "  模式: Ralph Loop（自动重启直到完成）"
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
echo "完成标志：COMPLETE 文件出现在项目根目录"
echo ""

# 清理残留的 Node 开发服务器（防止端口占用）
cleanup_dev_servers() {
  echo "清理残留的开发服务器进程..."
  # Windows: taskkill 关闭 node 进程中监听特定端口的
  for port in 3001 3002 3003 3004 3005 3010; do
    # 尝试通过 netstat 找到占用端口的 PID 并 kill
    local pid=$(netstat -ano 2>/dev/null | grep ":${port}" | grep "LISTENING" | awk '{print $5}' | head -1)
    if [ -n "$pid" ] && [ "$pid" != "0" ]; then
      taskkill //F //PID "$pid" 2>/dev/null || kill "$pid" 2>/dev/null
      echo "  已清理端口 ${port} 上的进程 (PID: ${pid})"
    fi
  done
}

MAX_LOOPS=5
LOOP_COUNT=0

while [ $LOOP_COUNT -lt $MAX_LOOPS ]; do
  LOOP_COUNT=$((LOOP_COUNT + 1))
  echo ""
  echo "=========================================="
  echo "  第 ${LOOP_COUNT}/${MAX_LOOPS} 轮执行"
  echo "  开始时间: $(date)"
  echo "=========================================="
  echo ""

  # 检查是否已经完成（上一轮可能已成功）
  if [ -f COMPLETE ]; then
    echo "检测到 COMPLETE 文件，任务已完成！"
    break
  fi

  # 每轮开始前清理残留进程
  cleanup_dev_servers

claude --dangerously-skip-permissions -p "
你是技术负责人（Lead Agent），今晚要在已有的 Next.js SaaS Starter 基础上完成 5 个增强模块。

## 首要步骤：检查进度
1. 读取 CLAUDE.md 和 TODO.md
2. 运行 git log --oneline -20 查看已有 commit
3. 检查 TODO.md 中哪些 checkbox 已经打勾 [x]
4. 如果是首次执行（没有增强相关 commit），从 Phase 0 开始
5. 如果是断点续跑（有部分 commit），跳过已完成的步骤，从未完成处继续
6. 如果所有 Phase 都已完成但 COMPLETE 文件不存在，直接跑 Phase 6 的验证步骤

## 你的核心原则
1. 你自己只做 Phase 0（初始化）和 Phase 6（集成验证），不要自己写业务代码
2. 所有业务开发委派给 teammate
3. 如果某个 teammate 报错或卡住，帮它诊断并给出修复方案
4. 所有 teammate 完成后才开始 Phase 6 集成
5. 最终 pnpm build 必须成功 + smoke test 通过才能输出 COMPLETE

## Smoke Test 规范（重要 — 必须严格遵守端口分配）

每个 teammate 和 Lead 使用不同端口运行 dev server，避免并行时端口冲突：
- teammate-admin: PORT=3001
- teammate-email: PORT=3002
- teammate-payments: PORT=3003
- teammate-i18n: PORT=3004
- teammate-ai: PORT=3005
- Phase 6 集成验证: PORT=3010

Smoke test 标准流程（以 teammate-admin 端口 3001 为例）：
\`\`\`bash
# 1. 确保端口干净（Windows 兼容写法）
taskkill //F //PID \$(netstat -ano | grep ':3001' | grep 'LISTENING' | awk '{print \$5}' | head -1) 2>/dev/null || true

# 2. 启动 dev server（指定端口，后台运行）
PORT=3001 pnpm dev --port 3001 &
DEV_PID=\$!

# 3. 等待服务器就绪（最多 30 秒）
for i in \$(seq 1 30); do
  if curl -s -o /dev/null -w '%{http_code}' http://localhost:3001 2>/dev/null | grep -qE '200|302|307'; then
    break
  fi
  sleep 1
done

# 4. 验证路由（替换为你负责的路由）
SMOKE_RESULT=\$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/admin)
echo \"Smoke test /admin: HTTP \$SMOKE_RESULT\"

# 5. 强制关闭 dev server（确保进程不残留）
kill \$DEV_PID 2>/dev/null
# Windows 下 kill 可能不彻底，用 taskkill 兜底
taskkill //F //PID \$DEV_PID 2>/dev/null || true
# 等待进程退出
sleep 2
\`\`\`

判断标准：
- HTTP 200, 302, 307, 401 = 通过（302/307 是登录重定向，401 是未授权，均属正常）
- HTTP 500 = 失败，必须修复后重新验证
- HTTP 000 或连接拒绝 = 服务器未启动成功，检查端口和启动日志
- smoke test 失败不要跳过，要定位问题并修复

## Phase 0: 你先做
1. 读取已有代码的关键文件：
   - lib/db/schema.ts（了解已有数据模型）
   - lib/payments/stripe.ts（了解已有支付实现）
   - lib/auth/session.ts（了解已有 auth 实现）
   - app/(login)/actions.ts（了解已有 Server Actions）
   - middleware.ts（了解已有中间件）
2. 运行 pnpm install
3. 统一安装所有新增依赖（重要：teammate 禁止自行 pnpm add）：
   pnpm add recharts date-fns resend @react-email/components @react-email/render @lemonsqueezy/lemonsqueezy.js next-intl openai @tanstack/react-table
4. 用 npx shadcn@latest add 安装需要的 UI 组件
5. 创建 TODO.md 中列出的所有目录结构
6. 确认 .env 已存在（如果不存在，参考 .env.example 创建，但不要覆盖已有的 .env）
7. git commit 初始化

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
7. Smoke test：用端口 3003，验证 http://localhost:3003/api/payments/checkout 不返回 500

### teammate-admin（管理后台）— 用 Sonnet 模型
指令：执行 TODO.md 中的 Phase 1。你负责创建完整的管理后台，包括数据看板（带 recharts 图表）、用户管理、活动日志、订阅管理。
关键原则：
1. Admin 权限用邮箱白名单方式（ADMIN_EMAILS 常量），不要改动已有 schema 添加 isAdmin 字段
2. 严格只创建和编辑 CLAUDE.md 中你的专属文件
3. 完成后运行 npx tsc --noEmit 和 pnpm build
4. Smoke test：用端口 3001，验证 http://localhost:3001/admin 不返回 500

### teammate-email（邮件系统 + Auth 增强）— 用 Sonnet 模型
指令：执行 TODO.md 中的 Phase 2。你负责搭建 Resend 邮件系统、创建 React Email 模板、实现忘记密码完整流程。
关键原则：
1. 你有例外权限修改 actions.ts（添加发送邮件调用）和 login.tsx（添加忘记密码链接）
2. **禁止修改 lib/db/schema.ts**，将新表定义写在 lib/db/email-schema.ts 中
3. 不要自行 pnpm add，依赖已统一安装
4. 完成后运行 npx tsc --noEmit 和 pnpm build
5. Smoke test：用端口 3002，验证 http://localhost:3002/forgot-password 不返回 500

### teammate-i18n（国际化）— 用 Sonnet 模型
指令：执行 TODO.md 中的 Phase 4。你负责搭建 next-intl 国际化系统。
关键原则：
1. **禁止修改根 middleware.ts**，将 intl 中间件配置导出到 lib/i18n/middleware.ts
2. **禁止修改已有页面**，只对你新建的文件使用翻译函数
3. 不要自行 pnpm add，依赖已统一安装
4. 完成后运行 npx tsc --noEmit 和 pnpm build
5. Smoke test：用端口 3004，验证 http://localhost:3004 不返回 500

### teammate-ai（AI 用量追踪）— 用 Sonnet 模型
指令：执行 TODO.md 中的 Phase 5。你负责创建 AI 用量追踪和计费系统。
关键原则：
1. **禁止修改 lib/db/schema.ts**，将新表定义写在 lib/db/ai-schema.ts 中
2. 修改 dashboard/layout.tsx 时只添加 Usage 导航项，不要改动其他导航
3. 示例 AI 聊天端点用 openai SDK 调 DeepSeek（baseURL: https://api.deepseek.com, model: deepseek-chat）
4. 不要自行 pnpm add，依赖已统一安装
5. 完成后运行 npx tsc --noEmit 和 pnpm build
6. Smoke test：用端口 3005，验证 http://localhost:3005/dashboard/usage 不返回 500

## Phase 6: 集成验证（你负责）
等所有 teammate 完成后：
1. 合并 Schema：将 lib/db/email-schema.ts 和 lib/db/ai-schema.ts 中的表定义合并到 lib/db/schema.ts，然后运行 pnpm db:generate && pnpm db:migrate
2. 合并 Middleware：读取 lib/i18n/middleware.ts 导出的配置，修改根 middleware.ts 将 next-intl 与已有 auth session 刷新逻辑合并
3. 运行 npx tsc --noEmit 检查全局类型
4. 运行 pnpm build 检查构建
5. 有错误就定位并指派对应 teammate 修复
6. 确认导航互通（顶部导航 + 各侧边栏）
7. 反复修复直到 pnpm build 成功
8. 全量 Smoke Test（用端口 3010）：
   PORT=3010 pnpm dev --port 3010 启动后依次验证以下路由不返回 500：
   - http://localhost:3010（首页）
   - http://localhost:3010/sign-in（登录页）
   - http://localhost:3010/pricing（定价页）
   - http://localhost:3010/admin（管理后台）
   - http://localhost:3010/forgot-password（忘记密码）
   - http://localhost:3010/dashboard/usage（用量页面）
   验证完毕后关闭 dev server（kill + taskkill 兜底）。
   如果有 500 错误，修复后重新验证。
9. 所有验证通过后：
   - git commit 'feat: integration complete - all modules verified'
   - 在项目根目录创建 COMPLETE 文件：echo 'done' > COMPLETE
   - git add COMPLETE && git commit -m 'chore: mark project as complete'
   - 输出 COMPLETE

现在开始：先检查进度，再决定从哪里开始执行。
"

  echo ""
  echo "第 ${LOOP_COUNT} 轮执行结束，时间: $(date)"

  # 每轮结束后清理残留进程
  cleanup_dev_servers

  # 检查是否完成
  if [ -f COMPLETE ]; then
    echo ""
    echo "=========================================="
    echo "  任务完成！"
    echo "  总轮数: ${LOOP_COUNT}"
    echo "  完成时间: $(date)"
    echo "=========================================="
    break
  fi

  if [ $LOOP_COUNT -lt $MAX_LOOPS ]; then
    echo "未检测到 COMPLETE 文件，10 秒后自动重启下一轮..."
    sleep 10
  else
    echo ""
    echo "=========================================="
    echo "  已达最大轮数 ${MAX_LOOPS}，停止执行"
    echo "  请手动检查项目状态"
    echo "=========================================="
  fi
done
