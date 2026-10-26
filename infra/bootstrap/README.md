# Provisioning credentials — demiya-www

How to get a credential that can `terraform apply` this stack **without**
putting an admin key on a laptop.

Values used below, from the account this stack targets:

| | |
|---|---|
| Account | `619881442965` |
| Route 53 zone | `Z104840420AD06SUG7WVM` (`demiya.restaurant`) |
| Origin bucket | `demiya-www-origin` |

## The shape

```
you ──MFA──> sts:AssumeRole ──> terraform-demiya-www (role)
                                 └── terraform-policy.json   ← scoped, 1h creds
                                      can only create demiya-www-* roles,
                                      and only if they carry the boundary
                                                     │
                                                     ▼
                                       demiya-www-deploy  (GitHub OIDC)
                                        └── capped by permissions-boundary.json
```

Three separate identities, each useless for the others' jobs:

| Identity | Can do | Lifetime |
|---|---|---|
| Your CLI user | `sts:AssumeRole`, nothing else | long-lived key, worthless alone |
| `terraform-demiya-www` | provision *this* stack only | 1 hour, MFA-gated |
| `demiya-www-deploy` | `s3 sync` + invalidate | ~15 min, GitHub OIDC only |

**No admin credential exists at any point**, and nothing long-lived can do
anything on its own.

## Setup

### 1. The permissions boundary (create this first)

```bash
sed 's/ACCOUNT_ID/619881442965/g' permissions-boundary.json > /tmp/boundary.json
aws iam create-policy \
  --policy-name demiya-www-boundary \
  --policy-document file:///tmp/boundary.json \
  --description "Ceiling for roles created by the demiya-www stack"
```

### 2. The Terraform role

> **IAM groups cannot be principals in a trust policy.** There is no way to
> write `"Principal": {"AWS": ".../group/demiya-cli"}` — AWS rejects it. To
> make access group-based, the trust policy names the **account root**, which
> delegates the decision to identity policies; the group's `sts:AssumeRole`
> permission is then what actually grants it. Adding a second person later
> means adding them to the group, with no trust-policy edit.

```bash
cat > /tmp/trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::619881442965:root" },
    "Action": "sts:AssumeRole",
    "Condition": {
      "Bool": { "aws:MultiFactorAuthPresent": "true" },
      "NumericLessThan": { "aws:MultiFactorAuthAge": "3600" }
    }
  }]
}
EOF

aws iam create-role \
  --role-name terraform-demiya-www \
  --assume-role-policy-document file:///tmp/trust.json \
  --max-session-duration 3600

sed -e 's/ACCOUNT_ID/619881442965/g' \
    -e 's/ZONE_ID/Z104840420AD06SUG7WVM/g' \
    -e 's/BUCKET/demiya-www-origin/g' \
    terraform-policy.json > /tmp/tf.json

aws iam put-role-policy \
  --role-name terraform-demiya-www \
  --policy-name provision-demiya-www \
  --policy-document file:///tmp/tf.json
```

The MFA conditions are the point: a stolen access key cannot assume this role
without the second factor.

### 3. The CLI group and user

```bash
aws iam create-group --group-name demiya-cli
aws iam put-group-policy \
  --group-name demiya-cli \
  --policy-name assume-terraform-role \
  --policy-document file://cli-group-policy.json

aws iam create-user --user-name demiya-cli-kim
aws iam add-user-to-group --group-name demiya-cli --user-name demiya-cli-kim
```

`cli-group-policy.json` grants, in effect, one useful thing —
`sts:AssumeRole` on the Terraform role, and only with MFA present. Everything
else in it is self-service plumbing so the user can register their own MFA
device and rotate their own key, scoped to `${aws:username}` so nobody can
touch anyone else's.

The final `Deny` is the backstop: without MFA, the only permitted calls are
the ones needed to *enrol* MFA. A leaked key with no second factor can do
nothing at all.

**Attach no AWS managed policies.** Not `ReadOnlyAccess`, not
`IAMUserChangePassword` — the group policy already covers it, and managed
policies are account-wide in scope.

Then create the access key and set up MFA:

```bash
aws iam create-access-key --user-name demiya-cli-kim   # → ~/.aws/credentials
# Console → IAM → Users → demiya-cli-kim → Security credentials → assign MFA
```

### 4. The local profile

`~/.aws/config`:

```ini
[profile demiya-tf]
role_arn       = arn:aws:iam::619881442965:role/terraform-demiya-www
source_profile = demiya-cli
mfa_serial     = arn:aws:iam::619881442965:mfa/YOUR_MFA_DEVICE
region         = us-west-2
duration_seconds = 3600
```

`~/.aws/credentials` keeps `[demiya-cli]` with the assume-role-only key.

Then:

```bash
AWS_PROFILE=demiya-tf terraform -chdir=.. plan      # prompts for an MFA code
```

## Telling Terraform about the boundary

Already wired. Both roles read `var.role_permissions_boundary`, so set it in
`terraform.tfvars`:

```hcl
role_permissions_boundary = "arn:aws:iam::619881442965:policy/demiya-www-boundary"
```

It defaults to empty (no boundary), so the stack still applies with admin
credentials if you skip this bootstrap entirely. But with the scoped role,
leaving it empty means `iam:CreateRole` is **denied** — that Deny is the whole
point of the control.

Both roles are already named `demiya-www-*`, matching the prefix the policy
allows.

## Why there are no comments in the JSON

IAM policy documents accept only `Version`, `Id`, `Statement`, and a fixed set
of statement keys. A stray `Comment` field is rejected with
`MalformedPolicyDocument`, so the reasoning lives here instead. Don't add them
back to the `.json` files.

## Where it is genuinely not least-privilege

Two services do not support resource-level permissions on their create
actions, so those statements use `"Resource": "*"`:

- **CloudFront** — it is a global service; no ARN exists before creation
- **ACM `RequestCertificate`** — same

A compromise of the Terraform role could therefore create CloudFront
distributions or request certificates elsewhere in the account. The region
lock and the hour-long, MFA-gated session are what bound that. If it matters
more than it does here, the fix is a separate AWS account for the marketing
site, which removes the shared blast radius entirely.

## Blast radius

| Compromised | They get |
|---|---|
| CLI user key alone | Nothing — needs MFA to assume anything |
| CLI key **+** MFA device | 1 hour of this stack, in two regions |
| GitHub Actions OIDC | Write to one bucket, invalidate one distribution. No IAM, no other service. |
| `certbot` user (existing) | Route 53 record writes on one zone |

The worst case — full compromise of the Terraform role — damages or deletes
the marketing site. It cannot touch the Soux platform, cannot create users or
roles outside the `demiya-www-*` prefix, and cannot grant itself anything the
boundary does not already allow.

## After the first apply

- `aws iam get-role --role-name demiya-www-deploy --query 'Role.PermissionsBoundary'`
  → confirm the boundary actually attached
- Enable CloudTrail if it is not already on — this is the only record of what
  the role did
- Rotate the CLI user's key periodically; it is the one long-lived secret left
