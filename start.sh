#!/bin/bash
# SaaS Starter Enhanced - Agent Teams 过夜构建启动脚本
# 使用方式：cd D:/Projects/saas-starter-enhanced && bash start.sh

export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

echo "=========================================="
echo "  SaaS Starter Enhanced - Agent Teams"
echo "  启动时间: $(date)"
echo "  模式: Ralph Loop（自动重启直到完成）"
echo "=========================================="
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
  echo "[警告] .env 文件不存在！退出。"
  exit 1
fi

# 检查 prompt 文件
if [ ! -f lead-prompt.md ]; then
  echo "[警告] lead-prompt.md 不存在！退出。"
  exit 1
fi

echo "✓ .env 文件存在"
echo "✓ lead-prompt.md 存在"
echo "完成标志：COMPLETE 文件出现在项目根目录"
echo ""

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

  # 检查是否已经完成
  if [ -f COMPLETE ]; then
    echo "检测到 COMPLETE 文件，任务已完成！"
    break
  fi

  # 清理残留 node 进程
  echo "清理残留进程..."
  taskkill //F //IM node.exe 2>/dev/null || true
  echo "清理完成"

  # 让 claude 自己读取 prompt 文件
  claude --dangerously-skip-permissions -p "读取项目根目录的 lead-prompt.md 文件，按照其中的指令执行所有任务。"

  echo ""
  echo "第 ${LOOP_COUNT} 轮执行结束，时间: $(date)"

  # 每轮结束后清理
  taskkill //F //IM node.exe 2>/dev/null || true

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
