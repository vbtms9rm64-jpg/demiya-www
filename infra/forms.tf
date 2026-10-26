# Contact form handler. A Lambda Function URL rather than API Gateway — there
# is one route, and API Gateway would add cost and config for nothing.
#
# This is the only executable code in the stack. It lives entirely outside the
# S3/CloudFront path, so the site itself stays pure static assets.

data "archive_file" "contact" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/contact"
  output_path = "${path.module}/.build/contact.zip"
}

data "aws_iam_policy_document" "contact_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "contact" {
  name                 = "demiya-www-contact"
  permissions_boundary = var.role_permissions_boundary != "" ? var.role_permissions_boundary : null
  description          = "Contact form handler for ${var.domain_name}"
  assume_role_policy   = data.aws_iam_policy_document.contact_assume.json
}

data "aws_iam_policy_document" "contact" {
  statement {
    sid     = "SendContactEmail"
    effect  = "Allow"
    actions = ["ses:SendEmail"]

    # Scoped to the one verified identity this function is allowed to send as.
    resources = [
      "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/${var.ses_identity}",
    ]
  }

  statement {
    sid    = "Logs"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["${aws_cloudwatch_log_group.contact.arn}:*"]
  }
}

resource "aws_iam_role_policy" "contact" {
  name   = "demiya-www-contact"
  role   = aws_iam_role.contact.id
  policy = data.aws_iam_policy_document.contact.json
}

resource "aws_cloudwatch_log_group" "contact" {
  name              = "/aws/lambda/demiya-www-contact"
  retention_in_days = 30
}

resource "aws_lambda_function" "contact" {
  function_name = "demiya-www-contact"
  role          = aws_iam_role.contact.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  timeout       = 10
  memory_size   = 256

  filename         = data.archive_file.contact.output_path
  source_code_hash = data.archive_file.contact.output_base64sha256

  # Function URLs have no built-in throttling and the endpoint is public.
  # This caps the blast radius of a flood: excess requests are rejected
  # rather than billed.
  reserved_concurrent_executions = var.contact_max_concurrency

  environment {
    variables = {
      ALLOWED_ORIGIN = "https://${var.canonical_host}"
      FROM_ADDRESS   = var.contact_from_address
      TO_ADDRESS     = var.contact_to_address
    }
  }

  depends_on = [
    aws_iam_role_policy.contact,
    aws_cloudwatch_log_group.contact,
  ]
}

resource "aws_lambda_function_url" "contact" {
  function_name      = aws_lambda_function.contact.function_name
  authorization_type = "NONE"

  cors {
    allow_origins     = ["https://${var.canonical_host}"]
    allow_methods     = ["POST"]
    allow_headers     = ["content-type"]
    max_age           = 86400
    allow_credentials = false
  }
}

# The console adds this automatically when it creates a public function URL;
# the API (and so Terraform) does not, and without it the URL returns 403.
resource "aws_lambda_permission" "contact_url" {
  statement_id           = "AllowPublicFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.contact.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}
