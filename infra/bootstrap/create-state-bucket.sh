#!/usr/bin/env bash
# One-time: create the S3 bucket that holds Terraform state for Soux stacks.
#
# Not managed by Terraform on purpose — the backend has to exist before
# `terraform init` can use it. Run with the terraform-demiya-www role's
# credentials (see README.md); its policy allows exactly these calls on this
# one bucket. Safe to re-run: every step is idempotent.
set -euo pipefail

BUCKET="soux-tfstate"
REGION="us-west-2"

if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "bucket $BUCKET already exists — re-applying settings"
else
  aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" >/dev/null
  echo "created $BUCKET"
fi

aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-ownership-controls --bucket "$BUCKET" \
  --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]'

aws s3api put-bucket-encryption --bucket "$BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'

# Versioning is the whole point: every state write keeps the previous one,
# so a bad apply or a corrupted state can be rolled back.
aws s3api put-bucket-versioning --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyInsecureTransport",
    "Effect": "Deny",
    "Principal": "*",
    "Action": "s3:*",
    "Resource": ["arn:aws:s3:::$BUCKET", "arn:aws:s3:::$BUCKET/*"],
    "Condition": { "Bool": { "aws:SecureTransport": "false" } }
  }]
}
EOF
)"

echo "verify:"
aws s3api get-bucket-versioning --bucket "$BUCKET" --query Status --output text
aws s3api get-public-access-block --bucket "$BUCKET" \
  --query 'PublicAccessBlockConfiguration' --output text
