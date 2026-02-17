//terraform/modules/s3/main.tf

# S3 bucket for avatar storage
resource "aws_s3_bucket" "storage" {
  bucket = var.bucket_name

  tags = {
    Name        = var.bucket_name
    Environment = var.environment
    Project     = "FlixVideo"
    ManagedBy   = "Terraform"
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "storage" {
  bucket = aws_s3_bucket.storage.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket versioning
resource "aws_s3_bucket_versioning" "storage" {
  bucket = aws_s3_bucket.storage.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS configuration
resource "aws_s3_bucket_cors_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Lifecycle rule for old avatars
resource "aws_s3_bucket_lifecycle_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id

  rule {
    id     = "delete-old-avatars"
    status = "Enabled"

    filter {
      prefix = "avatars/"
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# IAM user for application
resource "aws_iam_user" "app_user" {
  name = var.iam_user_name

  tags = {
    Environment = var.environment
    Project     = "FlixVideo"
    ManagedBy   = "Terraform"
  }
}

# IAM policy for S3 access
resource "aws_iam_user_policy" "app_s3_policy" {
  name = "${var.iam_user_name}-s3-policy"
  user = aws_iam_user.app_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.storage.arn,
          "${aws_s3_bucket.storage.arn}/*"
        ]
      }
    ]
  })
}

# # Access key for the IAM user (stored in state - be careful!)
# resource "aws_iam_access_key" "app_user" {
#   user = aws_iam_user.app_user.name
# }