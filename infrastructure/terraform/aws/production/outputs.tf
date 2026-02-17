//infrastructure/terraform/aws/production/outputs.tf

output "bucket_name" {
  description = "S3 bucket name"
  value       = module.storage.bucket_name
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.storage.bucket_arn
}

output "iam_user_name" {
  description = "IAM user name"
  value       = module.storage.iam_user_name
}

# output "access_key_id" {
#   description = "Access key ID (sensitive)"
#   value       = module.storage.access_key_id
#   sensitive   = true
# }

# output "secret_access_key" {
#   description = "Secret access key (sensitive)"
#   value       = module.storage.secret_access_key
#   sensitive   = true
# }