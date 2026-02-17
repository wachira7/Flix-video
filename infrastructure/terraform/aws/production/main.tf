//terraform/aws/production/main.tf

// Terraform configuration for AWS production environment

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

# Remote backend configuration
  backend "s3" {
    bucket         = "flixvideo-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "flixvideo-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "FlixVideo"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

module "storage" {
  source = "../../modules/s3"

  bucket_name    = var.bucket_name
  environment    = var.environment
  iam_user_name  = var.iam_user_name
  allowed_origins = var.allowed_origins
}