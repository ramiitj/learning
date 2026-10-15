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

variable "creator_setup_enabled" {
  description = "Create CREATOR_SETUP_TOKEN for the one-time creator setup. Set to false after the creator's passkey exists: the next apply deletes the token and the Vercel variable."
  type        = bool
  default     = true
}

variable "alert_webhook_url" {
  description = "Optional webhook that receives short error alerts with no learner data (ALERT_WEBHOOK_URL). Leave empty for no alerts."
  type        = string
  default     = ""
  sensitive   = true

  validation {
    condition     = var.alert_webhook_url == "" || startswith(var.alert_webhook_url, "https://")
    error_message = "alert_webhook_url must be an https URL, or empty."
  }
}
