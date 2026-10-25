output "bucket_name" {
  description = "Origin bucket — the aws s3 sync target."
  value       = aws_s3_bucket.site.id
}

output "distribution_id" {
  description = "CloudFront distribution ID — the invalidation target."
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_domain_name" {
  description = "CloudFront hostname. Use it to verify the site before DNS resolves to it."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "deploy_role_arn" {
  description = "Set as the role-to-assume in the GitHub Actions workflow."
  value       = aws_iam_role.deploy.arn
}

output "certificate_arn" {
  description = "ACM certificate (us-east-1). Renews automatically."
  value       = aws_acm_certificate_validation.site.certificate_arn
}

output "contact_form_endpoint" {
  description = "Lambda Function URL for the contact form. Set as PUBLIC_CONTACT_ENDPOINT in the Astro build."
  value       = aws_lambda_function_url.contact.function_url
}

output "github_actions_env" {
  description = "Values to paste into the deploy workflow."
  value = {
    AWS_REGION              = var.aws_region
    AWS_ROLE_ARN            = aws_iam_role.deploy.arn
    S3_BUCKET               = aws_s3_bucket.site.id
    CLOUDFRONT_DISTRIBUTION = aws_cloudfront_distribution.site.id
  }
}
