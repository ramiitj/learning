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

variable "app_origin" {
  description = "The site's public origin, e.g. https://learn.example.in. Passkeys and the MCP connector are bound to it."
  type        = string
}

variable "anthropic_api_key" {
  description = "Claude API key for the agent pipeline. Leave empty to run without agents."
  type        = string
  default     = ""
  sensitive   = true
}
