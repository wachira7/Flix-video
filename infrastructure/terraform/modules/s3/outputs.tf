//terraform/modules/s3/outputs.tf

output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.storage.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.storage.arn
}

output "bucket_region" {
  description = "Region of the S3 bucket"
  value       = aws_s3_bucket.storage.region
}

output "iam_user_name" {
  description = "Name of the IAM user"
  value       = aws_iam_user.app_user.name
}

output "iam_user_arn" {
  description = "ARN of the IAM user"
  value       = aws_iam_user.app_user.arn
}

# output "access_key_id" {
#   description = "Access key ID for the IAM user"
#   value       = aws_iam_access_key.app_user.id
#   sensitive   = true
# }

# output "secret_access_key" {
#   description = "Secret access key for the IAM user"
#   value       = aws_iam_access_key.app_user.secret
#   sensitive   = true
# }