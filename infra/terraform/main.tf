# Infrastructure as code for the learning magazine (Phase 0).
#
# Environments:
#   local       pnpm dev (no cloud resources)
#   preview     a Vercel preview deployment per pull request, with its own Neon branch
#   production  Vercel production (functions in bom1, Mumbai) + Neon Postgres in aws-ap-south-1 (Mumbai)
#
# Nothing here has been applied. Applying it requires the creator's approval
# (CLAUDE.md: nothing is deployed to production without it) and two tokens:
#   export VERCEL_API_TOKEN=...   NEON_API_KEY=...
#   terraform init && terraform plan
# State must be kept in a private remote backend; see the backend block below.

terraform {
  required_version = ">= 1.6"
  required_providers {
    vercel = { source = "vercel/vercel", version = "~> 3.0" }
    neon   = { source = "kislerdm/neon", version = "~> 0.9" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
  # backend "s3" {}  # Choose before first apply: state contains secrets.
}

provider "vercel" {
  team = var.vercel_team
}

provider "neon" {}

# ---------- Database (Phase 3 onwards; provisioned now so the region is fixed from day one) ----------

resource "neon_project" "main" {
  name                      = "learning-magazine"
  region_id                 = "aws-ap-south-1" # Mumbai: data residency (docs/11)
  pg_version                = 17
  history_retention_seconds = 604800 # 7 days of point-in-time restore

  branch {
    name          = "production"
    database_name = "magazine"
    role_name     = "magazine"
  }
}

resource "neon_branch" "preview" {
  project_id = neon_project.main.id
  parent_id  = neon_project.main.default_branch_id
  name       = "preview"
}

resource "neon_endpoint" "preview" {
  project_id = neon_project.main.id
  branch_id  = neon_branch.preview.id
  type       = "read_write"
}

locals {
  preview_database_url = "postgresql://${neon_project.main.database_user}:${neon_project.main.database_password}@${neon_endpoint.preview.host}/${neon_project.main.database_name}?sslmode=require"
}

# ---------- Web app ----------

resource "vercel_project" "web" {
  name           = "learning-magazine"
  framework      = "nextjs"
  root_directory = "apps/web"
  resource_config = {
    function_default_regions = ["bom1"] # Mumbai
  }
  install_command = "pnpm install --frozen-lockfile"
  # Database migrations run before every build, so the schema always matches the code being deployed.
  build_command   = "pnpm --filter @lm/web cms:migrate && pnpm --filter @lm/web build"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = "main"
  }
}

resource "vercel_project_environment_variable" "database_url_production" {
  project_id = vercel_project.web.id
  key        = "DATABASE_URI"
  value      = neon_project.main.connection_uri
  target     = ["production"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "database_url_preview" {
  project_id = vercel_project.web.id
  key        = "DATABASE_URI"
  value      = local.preview_database_url
  target     = ["preview"]
  sensitive  = true
}

resource "random_password" "payload_secret" {
  length  = 48
  special = false
}

resource "vercel_project_environment_variable" "payload_secret" {
  project_id = vercel_project.web.id
  key        = "PAYLOAD_SECRET"
  value      = random_password.payload_secret.result
  target     = ["production", "preview"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "app_origin" {
  project_id = vercel_project.web.id
  key        = "APP_ORIGIN"
  value      = var.app_origin
  target     = ["production"]
}

# The scheduler sends this with each call to /api/cron/* (daily 30-day purge of classroom sessions).
resource "random_password" "cron_secret" {
  length  = 40
  special = false
}

resource "vercel_project_environment_variable" "cron_secret" {
  project_id = vercel_project.web.id
  key        = "CRON_SECRET"
  value      = random_password.cron_secret.result
  target     = ["production", "preview"]
  sensitive  = true
}

# One-time token for creating the creator account and its first passkey. Read it with
# `terraform output -raw creator_setup_token`, use it once, then remove the variable in Vercel.
resource "random_password" "creator_setup_token" {
  length  = 32
  special = false
}

resource "vercel_project_environment_variable" "creator_setup_token" {
  project_id = vercel_project.web.id
  key        = "CREATOR_SETUP_TOKEN"
  value      = random_password.creator_setup_token.result
  target     = ["production"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "anthropic_api_key" {
  count      = var.anthropic_api_key == "" ? 0 : 1
  project_id = vercel_project.web.id
  key        = "ANTHROPIC_API_KEY"
  value      = var.anthropic_api_key
  target     = ["production"]
  sensitive  = true
}
