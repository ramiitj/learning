output "vercel_project_id" {
  value = vercel_project.web.id
}

output "database_region" {
  value = neon_project.main.region_id
}
