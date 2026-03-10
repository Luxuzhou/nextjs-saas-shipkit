#!/usr/bin/env bash
# Interactive environment setup script for SaaS Starter Enhanced
# Usage: bash scripts/setup-env.sh

set -euo pipefail

ENV_FILE=".env"
ENV_EXAMPLE_FILE=".env.example"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}  SaaS Starter Enhanced - Env Setup${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_section() {
  echo -e "\n${YELLOW}--- $1 ---${NC}"
}

prompt_var() {
  local var_name="$1"
  local description="$2"
  local default_val="${3:-}"
  local current_val=""

  # Check if already set in .env
  if [ -f "$ENV_FILE" ]; then
    current_val=$(grep "^${var_name}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- || true)
  fi

  if [ -n "$current_val" ] && [ "$current_val" != "" ]; then
    echo -e "  ${GREEN}${var_name}${NC} is already set (${current_val:0:20}...)"
    read -rp "  Override? [y/N]: " override
    if [[ ! "$override" =~ ^[Yy]$ ]]; then
      return
    fi
  fi

  local prompt_text="  Enter ${description}"
  if [ -n "$default_val" ]; then
    prompt_text="${prompt_text} [default: ${default_val}]"
  fi
  prompt_text="${prompt_text}: "

  read -rp "$prompt_text" value
  value="${value:-$default_val}"

  if [ -n "$value" ]; then
    set_env_var "$var_name" "$value"
    echo -e "  ${GREEN}✓ ${var_name} set${NC}"
  else
    echo -e "  ${YELLOW}⚠ ${var_name} skipped (empty)${NC}"
  fi
}

set_env_var() {
  local key="$1"
  local value="$2"

  if [ -f "$ENV_FILE" ] && grep -q "^${key}=" "$ENV_FILE"; then
    # Update existing
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
      sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    fi
  else
    # Append new
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

check_prerequisites() {
  print_section "Checking Prerequisites"

  local missing=0

  if ! command -v node &> /dev/null; then
    echo -e "  ${RED}✗ Node.js not found. Install from https://nodejs.org${NC}"
    missing=1
  else
    echo -e "  ${GREEN}✓ Node.js $(node --version)${NC}"
  fi

  if ! command -v pnpm &> /dev/null; then
    echo -e "  ${RED}✗ pnpm not found. Run: corepack enable && corepack prepare pnpm@10 --activate${NC}"
    missing=1
  else
    echo -e "  ${GREEN}✓ pnpm $(pnpm --version)${NC}"
  fi

  if ! command -v psql &> /dev/null; then
    echo -e "  ${YELLOW}⚠ psql not found (optional, needed for local DB setup)${NC}"
  else
    echo -e "  ${GREEN}✓ psql $(psql --version)${NC}"
  fi

  if [ "$missing" -eq 1 ]; then
    echo -e "\n${RED}Please install missing prerequisites before continuing.${NC}"
    exit 1
  fi
}

create_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    echo -e "\n${YELLOW}Creating new .env file...${NC}"
    cat > "$ENV_FILE" << 'ENVEOF'
# Core
POSTGRES_URL=
BASE_URL=http://localhost:3000
AUTH_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# Email (Resend)
RESEND_API_KEY=

# Payment Provider
PAYMENT_PROVIDER=stripe
LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_WEBHOOK_SECRET=

# Alipay
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_NOTIFY_URL=

# WeChat Pay
WECHAT_PAY_APP_ID=
WECHAT_PAY_MCH_ID=
WECHAT_PAY_API_KEY=
WECHAT_PAY_CERT_SERIAL=
WECHAT_PAY_PRIVATE_KEY=

# AI
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=
ENVEOF
    echo -e "${GREEN}✓ .env file created${NC}"
  else
    echo -e "\n${GREEN}✓ .env file already exists${NC}"
  fi
}

generate_secret() {
  # Generate a random 32-byte hex string
  if command -v openssl &> /dev/null; then
    openssl rand -hex 32
  else
    # Fallback using /dev/urandom
    head -c 32 /dev/urandom | xxd -p | head -c 64
  fi
}

setup_core() {
  print_section "Core Configuration"

  prompt_var "POSTGRES_URL" "PostgreSQL connection URL" "postgresql://postgres:postgres@localhost:5432/saas_starter"

  # Auto-generate AUTH_SECRET if not set
  local current_secret=""
  if [ -f "$ENV_FILE" ]; then
    current_secret=$(grep "^AUTH_SECRET=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- || true)
  fi
  if [ -z "$current_secret" ]; then
    local generated
    generated=$(generate_secret)
    set_env_var "AUTH_SECRET" "$generated"
    echo -e "  ${GREEN}✓ AUTH_SECRET auto-generated${NC}"
  else
    echo -e "  ${GREEN}✓ AUTH_SECRET already set${NC}"
  fi

  prompt_var "BASE_URL" "Application base URL" "http://localhost:3000"
}

setup_stripe() {
  print_section "Stripe Configuration"
  echo -e "  Get your keys from: ${BLUE}https://dashboard.stripe.com/apikeys${NC}"

  prompt_var "STRIPE_SECRET_KEY" "Stripe secret key (sk_test_...)"
  prompt_var "STRIPE_WEBHOOK_SECRET" "Stripe webhook secret (whsec_...)"
}

setup_email() {
  print_section "Email Configuration (Resend)"
  echo -e "  Get your API key from: ${BLUE}https://resend.com/api-keys${NC}"

  prompt_var "RESEND_API_KEY" "Resend API key (re_...)"
}

setup_ai() {
  print_section "AI Configuration (DeepSeek)"
  echo -e "  Get your API key from: ${BLUE}https://platform.deepseek.com/api_keys${NC}"

  prompt_var "DEEPSEEK_API_KEY" "DeepSeek API key"
  prompt_var "DEEPSEEK_BASE_URL" "DeepSeek base URL" "https://api.deepseek.com"
}

setup_oauth() {
  print_section "OAuth Configuration (Optional)"
  echo -e "  ${YELLOW}Skip this section if you don't need social login.${NC}"

  read -rp "  Configure Google OAuth? [y/N]: " setup_google
  if [[ "$setup_google" =~ ^[Yy]$ ]]; then
    echo -e "  Create credentials at: ${BLUE}https://console.cloud.google.com/apis/credentials${NC}"
    prompt_var "GOOGLE_CLIENT_ID" "Google Client ID"
    prompt_var "GOOGLE_CLIENT_SECRET" "Google Client Secret"
  fi

  read -rp "  Configure GitHub OAuth? [y/N]: " setup_github
  if [[ "$setup_github" =~ ^[Yy]$ ]]; then
    echo -e "  Create app at: ${BLUE}https://github.com/settings/developers${NC}"
    prompt_var "GITHUB_CLIENT_ID" "GitHub Client ID"
    prompt_var "GITHUB_CLIENT_SECRET" "GitHub Client Secret"
  fi

  # Auto-generate NEXTAUTH_SECRET
  local current_nextauth=""
  if [ -f "$ENV_FILE" ]; then
    current_nextauth=$(grep "^NEXTAUTH_SECRET=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- || true)
  fi
  if [ -z "$current_nextauth" ]; then
    local generated
    generated=$(generate_secret)
    set_env_var "NEXTAUTH_SECRET" "$generated"
    echo -e "  ${GREEN}✓ NEXTAUTH_SECRET auto-generated${NC}"
  fi
}

run_migrations() {
  print_section "Database Setup"

  read -rp "  Run database migrations now? [y/N]: " run_migrate
  if [[ "$run_migrate" =~ ^[Yy]$ ]]; then
    echo -e "  Running migrations..."
    if pnpm db:migrate 2>&1; then
      echo -e "  ${GREEN}✓ Migrations completed${NC}"
    else
      echo -e "  ${RED}✗ Migration failed. Check your POSTGRES_URL and try again.${NC}"
    fi
  else
    echo -e "  ${YELLOW}⚠ Skipped. Run 'pnpm db:migrate' when ready.${NC}"
  fi
}

print_summary() {
  print_section "Setup Complete"
  echo -e "  ${GREEN}✓ Environment file configured: ${ENV_FILE}${NC}"
  echo -e "\n  Next steps:"
  echo -e "  1. ${BLUE}pnpm install${NC}       - Install dependencies"
  echo -e "  2. ${BLUE}pnpm db:migrate${NC}    - Run database migrations"
  echo -e "  3. ${BLUE}pnpm dev${NC}           - Start development server"
  echo -e "\n  For Docker deployment:"
  echo -e "  ${BLUE}docker compose up -d${NC}  - Start app + database"
  echo -e "\n${GREEN}Happy building!${NC}\n"
}

# Main flow
print_header
check_prerequisites
create_env_file
setup_core
setup_stripe
setup_email
setup_ai

read -rp "Configure OAuth (Google/GitHub)? [y/N]: " do_oauth
if [[ "$do_oauth" =~ ^[Yy]$ ]]; then
  setup_oauth
fi

run_migrations
print_summary
