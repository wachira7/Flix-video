//terraform/aws/production/variables.tf
//terraform configuration for AWS production environment variables

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "iam_user_name" {
  description = "IAM user name"
  type        = string
}

variable "allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
}