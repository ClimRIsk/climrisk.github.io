#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ClimRisk — One-Shot AWS Fargate Deployment
# Runs: ECR push → ECS task definition → EventBridge 6-hour cron
#
# Prerequisites:
#   aws cli v2 installed and configured (aws configure)
#   docker installed and running
#   jq installed (brew install jq)
#
# Usage:
#   export AWS_ACCOUNT_ID=123456789012
#   export AWS_REGION=us-east-1
#   export S3_BUCKET=climrisk-data
#   bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ACCOUNT="${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID}"
REGION="${AWS_REGION:-us-east-1}"
BUCKET="${S3_BUCKET:-climrisk-data}"
REPO="climrisk-pipeline"
CLUSTER="climrisk"
TASK_FAMILY="climrisk-6h"
RULE_NAME="climrisk-every-6h"
CPU="4096"      # 4 vCPU
MEMORY="16384"  # 16 GB (use 32768 for large batch runs)

ECR="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"
IMAGE="${ECR}/${REPO}:latest"

echo "═══════════════════════════════════════════════════"
echo " ClimRisk Fargate Deploy"
echo " Account : ${ACCOUNT}"
echo " Region  : ${REGION}"
echo " Bucket  : ${BUCKET}"
echo " Image   : ${IMAGE}"
echo "═══════════════════════════════════════════════════"

# ── 1. S3 bucket ──────────────────────────────────────────────────────────────
echo "→ Ensuring S3 bucket: ${BUCKET}"
aws s3api head-bucket --bucket "${BUCKET}" 2>/dev/null \
  || aws s3api create-bucket --bucket "${BUCKET}" --region "${REGION}" \
       $( [[ "${REGION}" != "us-east-1" ]] && echo "--create-bucket-configuration LocationConstraint=${REGION}" )

# ── 2. ECR repository ─────────────────────────────────────────────────────────
echo "→ Ensuring ECR repo: ${REPO}"
aws ecr describe-repositories --repository-names "${REPO}" --region "${REGION}" 2>/dev/null \
  || aws ecr create-repository --repository-name "${REPO}" --region "${REGION}"

# ── 3. Build & push Docker image ──────────────────────────────────────────────
echo "→ Docker build & push"
aws ecr get-login-password --region "${REGION}" \
  | docker login --username AWS --password-stdin "${ECR}"
docker build -t "${REPO}" .
docker tag "${REPO}:latest" "${IMAGE}"
docker push "${IMAGE}"

# ── 4. IAM execution role (idempotent) ────────────────────────────────────────
ROLE_NAME="climrisk-fargate-exec"
echo "→ Ensuring IAM role: ${ROLE_NAME}"
ROLE_ARN=$(aws iam get-role --role-name "${ROLE_NAME}" \
             --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [[ -z "${ROLE_ARN}" ]]; then
  ROLE_ARN=$(aws iam create-role \
    --role-name "${ROLE_NAME}" \
    --assume-role-policy-document '{
      "Version":"2012-10-17",
      "Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},
                    "Action":"sts:AssumeRole"}]}' \
    --query 'Role.Arn' --output text)
  aws iam attach-role-policy --role-name "${ROLE_NAME}" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
  aws iam attach-role-policy --role-name "${ROLE_NAME}" \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
  # If you want SNS alerts:
  # aws iam attach-role-policy --role-name "${ROLE_NAME}" \
  #   --policy-arn arn:aws:iam::aws:policy/AmazonSNSFullAccess
fi
echo "   Role ARN: ${ROLE_ARN}"

# ── 5. ECS cluster ────────────────────────────────────────────────────────────
echo "→ Ensuring ECS cluster: ${CLUSTER}"
aws ecs describe-clusters --clusters "${CLUSTER}" --region "${REGION}" \
  --query 'clusters[?status==`ACTIVE`].clusterName' --output text | grep -q "${CLUSTER}" \
  || aws ecs create-cluster --cluster-name "${CLUSTER}" --region "${REGION}"

# ── 6. ECS Task Definition ────────────────────────────────────────────────────
echo "→ Registering ECS task definition: ${TASK_FAMILY}"
TASK_DEF=$(cat <<JSON
{
  "family": "${TASK_FAMILY}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "${CPU}",
  "memory": "${MEMORY}",
  "executionRoleArn": "${ROLE_ARN}",
  "taskRoleArn": "${ROLE_ARN}",
  "containerDefinitions": [{
    "name": "pipeline",
    "image": "${IMAGE}",
    "essential": true,
    "environment": [
      {"name": "S3_BUCKET",     "value": "${BUCKET}"},
      {"name": "AWS_REGION",    "value": "${REGION}"},
      {"name": "SCENARIO",      "value": "cp"},
      {"name": "ASSET_FILE",    "value": ""}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group":         "/ecs/climrisk",
        "awslogs-region":        "${REGION}",
        "awslogs-stream-prefix": "pipeline",
        "awslogs-create-group":  "true"
      }
    }
  }]
}
JSON
)
TASK_ARN=$(aws ecs register-task-definition \
  --cli-input-json "${TASK_DEF}" \
  --region "${REGION}" \
  --query 'taskDefinition.taskDefinitionArn' --output text)
echo "   Task ARN: ${TASK_ARN}"

# ── 7. EventBridge IAM role for ECS ──────────────────────────────────────────
EB_ROLE="climrisk-eventbridge-ecs"
EB_ROLE_ARN=$(aws iam get-role --role-name "${EB_ROLE}" \
              --query 'Role.Arn' --output text 2>/dev/null || echo "")
if [[ -z "${EB_ROLE_ARN}" ]]; then
  EB_ROLE_ARN=$(aws iam create-role \
    --role-name "${EB_ROLE}" \
    --assume-role-policy-document '{
      "Version":"2012-10-17",
      "Statement":[{"Effect":"Allow","Principal":{"Service":"events.amazonaws.com"},
                    "Action":"sts:AssumeRole"}]}' \
    --query 'Role.Arn' --output text)
  aws iam put-role-policy --role-name "${EB_ROLE}" \
    --policy-name AllowRunTask \
    --policy-document "{
      \"Version\":\"2012-10-17\",
      \"Statement\":[{
        \"Effect\":\"Allow\",
        \"Action\":[\"ecs:RunTask\"],
        \"Resource\":\"arn:aws:ecs:${REGION}:${ACCOUNT}:task-definition/${TASK_FAMILY}:*\"
      },{
        \"Effect\":\"Allow\",
        \"Action\":[\"iam:PassRole\"],
        \"Resource\":\"${ROLE_ARN}\"
      }]
    }"
fi
echo "   EventBridge Role ARN: ${EB_ROLE_ARN}"

# ── 8. Fetch default VPC subnet (for awsvpc networking) ──────────────────────
SUBNET=$(aws ec2 describe-subnets \
  --filters "Name=defaultForAz,Values=true" \
  --query 'Subnets[0].SubnetId' --output text --region "${REGION}")
SG=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=default" \
  --query 'SecurityGroups[0].GroupId' --output text --region "${REGION}")
echo "   Subnet: ${SUBNET}  SG: ${SG}"

# ── 9. EventBridge rule — every 6 hours ──────────────────────────────────────
echo "→ Creating EventBridge rule: ${RULE_NAME}"
RULE_ARN=$(aws events put-rule \
  --name "${RULE_NAME}" \
  --schedule-expression "cron(0 0/6 * * ? *)" \
  --state ENABLED \
  --description "ClimRisk 6-hour pipeline trigger" \
  --region "${REGION}" \
  --query 'RuleArn' --output text)

NETWORK_CFG="{
  \"awsvpcConfiguration\": {
    \"subnets\": [\"${SUBNET}\"],
    \"securityGroups\": [\"${SG}\"],
    \"assignPublicIp\": \"ENABLED\"
  }
}"

aws events put-targets \
  --rule "${RULE_NAME}" \
  --region "${REGION}" \
  --targets "[{
    \"Id\": \"1\",
    \"Arn\": \"arn:aws:ecs:${REGION}:${ACCOUNT}:cluster/${CLUSTER}\",
    \"RoleArn\": \"${EB_ROLE_ARN}\",
    \"EcsParameters\": {
      \"TaskDefinitionArn\": \"${TASK_ARN}\",
      \"TaskCount\": 1,
      \"LaunchType\": \"FARGATE\",
      \"NetworkConfiguration\": ${NETWORK_CFG}
    }
  }]"

echo ""
echo "✅  Deployment complete"
echo "   EventBridge rule : ${RULE_ARN}"
echo "   Next runs        : every 6 hours (cron 0 0/6 * * ? *)"
echo "   Logs             : CloudWatch /ecs/climrisk"
echo "   Output           : s3://${BUCKET}/climrisk/<asset_id>/"
echo ""
echo "Trigger a manual test run:"
echo "  aws ecs run-task --cluster ${CLUSTER} --task-definition ${TASK_FAMILY} \\"
echo "    --launch-type FARGATE --count 1 --region ${REGION} \\"
echo "    --network-configuration '${NETWORK_CFG}'"
