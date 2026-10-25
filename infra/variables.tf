variable "aws_region" {
  description = "Region for the S3 origin bucket and IAM. The ACM certificate is pinned to us-east-1 regardless (CloudFront requirement)."
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "Apex domain served by the distribution."
  type        = string
  default     = "demiya.restaurant"
}

variable "route53_zone_name" {
  description = "Name of the existing Route 53 public hosted zone. Usually the same as domain_name."
  type        = string
  default     = "demiya.restaurant"
}

variable "canonical_host" {
  description = <<-EOT
    The one hostname that serves content. The other alias 301-redirects to it,
    so the site is not indexed at two addresses. Set to the apex or the www
    host; it must be one of [domain_name, "www.<domain_name>"].
  EOT
  type        = string
  default     = "demiya.restaurant"
}

variable "bucket_name" {
  description = "Origin bucket name. Must be globally unique."
  type        = string
  default     = "demiya-www-origin"
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 (NA + EU) is ample for a Bay Area restaurant site."
  type        = string
  default     = "PriceClass_100"
}

variable "github_repository" {
  description = "owner/repo allowed to assume the deploy role via OIDC."
  type        = string
  default     = "vbtms9rm64-jpg/demiya-www"
}

variable "github_deploy_ref" {
  description = "Git ref permitted to deploy. Keep this pinned to one branch."
  type        = string
  default     = "refs/heads/main"
}

variable "create_github_oidc_provider" {
  description = <<-EOT
    Create the GitHub Actions OIDC provider in this account. An AWS account can
    hold only one provider per URL, so set this to false if another stack in the
    same account already created it.
  EOT
  type        = bool
  default     = true
}

variable "ses_identity" {
  description = <<-EOT
    The verified SES identity the contact form sends as — either a domain
    ("demiya.restaurant") or a single address. Must already be verified in SES
    in `aws_region`, and SES must be out of sandbox to reach arbitrary
    recipients.
  EOT
  type        = string
  default     = "demiya.restaurant"
}

variable "contact_from_address" {
  description = "Envelope From for contact-form mail. Must fall under ses_identity."
  type        = string
  default     = "website@demiya.restaurant"
}

variable "contact_to_address" {
  description = "Where contact-form submissions are delivered."
  type        = string
  default     = "hello@demiya.restaurant"
}

variable "contact_max_concurrency" {
  description = <<-EOT
    Reserved concurrency for the contact handler. Function URLs have no
    built-in throttling and the endpoint is public, so this caps how much a
    flood can cost you.
  EOT
  type        = number
  default     = 5
}

variable "tags" {
  description = "Tags applied to every taggable resource."
  type        = map(string)
  default = {
    Project   = "soux"
    Component = "demiya-www"
    ManagedBy = "terraform"
  }
}

locals {
  www_host = "www.${var.domain_name}"

  # Both hostnames are served by the distribution; the function redirects
  # whichever one is not canonical.
  aliases = [var.domain_name, local.www_host]
}
