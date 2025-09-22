#!/bin/bash

# VWS 앱 EC2 배포 스크립트

set -e

echo "🚀 VWS 앱 배포 시작..."

# 환경 변수 설정
export ECR_REGISTRY="your-account-id.dkr.ecr.ap-northeast-2.amazonaws.com"
export DATABASE_URL="postgresql://username:password@your-db-host:5432/workstream"

# ECR 로그인
echo "📦 ECR 로그인 중..."
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin $ECR_REGISTRY

# 최신 이미지 풀
echo "⬇️ 최신 이미지 다운로드 중..."
docker pull $ECR_REGISTRY/vws-app:latest

# 기존 컨테이너 중지 및 제거
echo "🛑 기존 컨테이너 중지 중..."
docker-compose -f docker-compose.prod.yml down || true

# 새 컨테이너 시작
echo "🔄 새 컨테이너 시작 중..."
docker-compose -f docker-compose.prod.yml up -d

# 헬스 체크
echo "🏥 헬스 체크 중..."
sleep 30
curl -f http://localhost/health || {
    echo "❌ 헬스 체크 실패"
    exit 1
}

echo "✅ 배포 완료!"
echo "🌐 앱이 http://your-ec2-ip 에서 실행 중입니다"
