output "vercel_project_id" {
  value = vercel_project.web.id
}

output "database_region" {
  value = neon_project.main.region_id
}

output "creator_setup_token" {
  description = "One-time token for creating the creator account. Use once, then delete CREATOR_SETUP_TOKEN in Vercel."
  value       = random_password.creator_setup_token.result
  sensitive   = true
}
