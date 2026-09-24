variable "github_repo" {
  description = "GitHub repository (owner/name) that Vercel deploys from."
  type        = string
  default     = "ramiitj/learning"
}

variable "vercel_team" {
  description = "Vercel team slug or id, if the project belongs to a team."
  type        = string
  default     = null
}
