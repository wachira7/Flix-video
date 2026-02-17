#terraform/aws/production/terraform.tfvars
// Terraform variable values for AWS production environment

aws_region    = "us-east-1"
environment   = "production"
bucket_name   = "flixvideo-storage-prod"
iam_user_name = "flixvideo-app"

allowed_origins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://flixvideo.vercel.app",  # Your future production domain
]