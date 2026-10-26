# Marketing site infrastructure — demiya.restaurant

Terraform for the static Astro marketing site: S3 origin, CloudFront, ACM,
Route 53, and a GitHub Actions deploy role.

This replaces the compromised WordPress instance described in
`../../ffiver/wordpress/INCIDENT-RESTORE-HARDEN.md`. There is no PHP, no
database, and no server to patch — which removes the entire class of attack
that took the old site down, and the certbot renewal that silently failed for
two months with it.

> **This directory is written to move.** `demiya-www/` is laid out as the root
> of its own repo — `infra/` and `.github/` keep their relative paths, so
> splitting it out is a straight `mv`. The workflow in
> `../.github/workflows/deploy.yml` is inert until then.

## Architecture

```
GitHub Actions ──OIDC──> IAM role
      │
      └── aws s3 sync ──> S3 bucket (private, OAC-only)
                                │
                                ▼
                          CloudFront  <── ACM cert (us-east-1)
                                │              auto-renewing
                                ▼
                          Route 53 ALIAS
                     demiya.restaurant + www
```

**Why ALIAS works at the apex.** A CNAME at a zone apex is invalid, and Route 53
ALIAS records can only target AWS resources — but CloudFront *is* one. So the
apex resolves natively and the domain stays on Route 53. No nameserver move, no
registrar change, and `soux.io` is untouched.

## Files

| File | Contents |
|------|----------|
| `versions.tf` | Provider pins; the `us_east_1` alias used only for ACM |
| `variables.tf` | Inputs and derived locals |
| `s3.tf` | Private origin bucket, encryption, versioning, lifecycle, OAC policy |
| `acm.tf` | DNS-validated certificate + Route 53 validation records |
| `cloudfront.tf` | OAC, viewer-request function, distribution, cache behaviors |
| `dns.tf` | A/AAAA ALIAS records for apex and www |
| `iam-github.tf` | GitHub OIDC provider and the scoped deploy role |
| `outputs.tf` | Values the deploy workflow needs |
| `functions/router.js.tftpl` | Canonical-host redirect + directory index resolution |

## Apply

```bash
cp terraform.tfvars.example terraform.tfvars   # edit
terraform init
terraform plan
terraform apply
```

The first apply takes ~10–20 minutes — CloudFront distribution creation is slow.
ACM validation is automatic because the validation records are created in the
same run.

## Then wire up the deploy

`terraform output github_actions_env` prints what the workflow needs. Set these
as GitHub Actions **repository variables** (not secrets — none are sensitive):

| Variable | Source |
|----------|--------|
| `AWS_ROLE_ARN` | `terraform output deploy_role_arn` |
| `AWS_REGION` | `us-west-2` |
| `S3_BUCKET` | `terraform output bucket_name` |
| `CLOUDFRONT_DISTRIBUTION` | `terraform output distribution_id` |

No GitHub **secrets** are needed. Site content is static (`src/data/`).

## Verify before DNS points at it

`terraform output distribution_domain_name` gives the CloudFront hostname. The
site is reachable there as soon as the first deploy runs, so you can review the
whole thing before the Route 53 records matter.

Note that the router function 301-redirects any host that is not
`canonical_host` — including the CloudFront hostname. To review on the
`*.cloudfront.net` URL before cutover, either check the S3 objects directly or
temporarily set `canonical_host` to the distribution domain.

## Design notes

**The bucket is never public.** Origin Access Control signs CloudFront's
requests with SigV4, and the bucket policy trusts exactly one distribution ARN.
The legacy S3 website endpoint is deliberately unused — it is public and cannot
terminate TLS.

**The certificate is pinned to us-east-1.** CloudFront reads certificates from
that region only, regardless of where the rest of the stack lives. This is the
most commonly hit trap in this architecture.

**403 maps to the 404 page.** Behind OAC the bucket grants `GetObject` alone, so
a missing key returns `AccessDenied` rather than `NoSuchKey`. Both codes map to
`/404.html`.

**Directory URLs need the function.** Astro builds `about/index.html`, and
`default_root_object` only applies to `/`. Without the viewer-request rewrite,
`/about/` 403s.

**Deploys use OIDC, not access keys.** The trust policy pins assumption to one
repo and one branch. There is no long-lived credential to leak or rotate — worth
noting given the IAM user key currently sitting in `/root/.aws/credentials` for
the soux.io certbot.

## Cost

At this traffic: a few dollars a month at most. S3 storage for a four-page site
is cents, CloudFront has a standing free tier that this will not exhaust, Route 53
is the usual per-zone charge, and ACM certificates are free. Compare ~$7/mo for
the Lightsail instance, plus the patching burden this removes.

## State

Remote, in `s3://soux-tfstate/demiya-www/terraform.tfstate` (versioned,
encrypted, private), locked with S3's native lockfile. The bucket is created
once by `bootstrap/create-state-bucket.sh`, not by Terraform. To recover from a
bad write, restore an earlier object version of the state file.

## What this does not cover

- **The old instance.** Decommission per the incident runbook, and keep the
  forensic snapshot.
