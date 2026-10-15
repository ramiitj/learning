output "vercel_project_id" {
  value = vercel_project.web.id
}

output "database_region" {
  value = neon_project.main.region_id
}

output "creator_setup_token" {
  description = "One-time token for creating the creator account (null once creator_setup_enabled = false). Use once, then set creator_setup_enabled = false and apply."
  value       = one(random_password.creator_setup_token[*].result)
  sensitive   = true
}

output "neon_project_id" {
  description = "For the GitHub secret NEON_PROJECT_ID (.github/workflows/preview-db.yml)."
  value       = neon_project.main.id
}
