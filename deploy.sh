#!/bin/bash

# VWS 앱 EC2 배포 스크립트
set -e

# 설정 변수
ECR_REGISTRY="711678334703.dkr.ecr.ap-northeast-2.amazonaws.com"
ECR_REPOSITORY="vws-app"
CONTAINER_NAME="vws-app"
PORT="80"

echo "🚀 VWS 앱 배포 시작..."

# 1. ECR 로그인
echo "📝 ECR 로그인 중..."
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin $ECR_REGISTRY

# 2. 기존 컨테이너 중지 및 제거
echo "🛑 기존 컨테이너 중지 및 제거 중..."
docker stop $CONTAINER_NAME || true
docker rm $CONTAINER_NAME || true

# 3. 최신 이미지 다운로드
echo "⬇️ 최신 Docker 이미지 다운로드 중..."
docker pull $ECR_REGISTRY/$ECR_REPOSITORY:latest

# 4. 새 컨테이너 실행
echo "▶️ 새 컨테이너 실행 중..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $PORT:3000 \
  -e NODE_ENV=production \
  $ECR_REGISTRY/$ECR_REPOSITORY:latest

# 5. 배포 완료 확인
echo "✅ 배포 완료 확인 중..."
sleep 10

if docker ps | grep -q $CONTAINER_NAME; then
    echo "🎉 배포가 성공적으로 완료되었습니다!"
    echo "📊 컨테이너 상태:"
    docker ps | grep $CONTAINER_NAME
    echo ""
    echo "🌐 애플리케이션 URL: http://$(curl -s ifconfig.me):$PORT"
else
    echo "❌ 배포에 실패했습니다. 로그를 확인하세요:"
    docker logs $CONTAINER_NAME
    exit 1
fi
