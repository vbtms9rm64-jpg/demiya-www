terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.68.0" # pinned exact
    }
  }

  # Remote state. Bucket created once by bootstrap/create-state-bucket.sh (versioned,
  # encrypted, private). use_lockfile is S3-native locking — no DynamoDB table.
  backend "s3" {
    bucket       = "soux-tfstate"
    key          = "demiya-www/terraform.tfstate"
    region       = "us-west-2"
    use_lockfile = true
    encrypt      = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# CloudFront reads ACM certificates ONLY from us-east-1, regardless of where
# the rest of the stack lives. This aliased provider exists solely for the
# certificate; everything else uses the default provider.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = var.tags
  }
}
