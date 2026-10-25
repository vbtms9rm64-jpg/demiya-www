# The existing hosted zone — not created here. Moving nameservers is not
# required: Route 53 ALIAS records can target CloudFront natively, which is
# what makes the apex work without a CNAME.

data "aws_route53_zone" "site" {
  name         = "${var.route53_zone_name}."
  private_zone = false
}

locals {
  # Apex and www both point at the distribution; the CloudFront function
  # redirects whichever is not canonical.
  site_hosts = {
    apex = var.domain_name
    www  = local.www_host
  }
}

resource "aws_route53_record" "ipv4" {
  for_each = local.site_hosts

  zone_id = data.aws_route53_zone.site.zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "ipv6" {
  for_each = local.site_hosts

  zone_id = data.aws_route53_zone.site.zone_id
  name    = each.value
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
