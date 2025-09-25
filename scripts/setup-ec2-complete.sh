#!/bin/bash

# 완전 자동화된 EC2 설정 스크립트
set -e

DOMAIN="ws.viahub.dev"
ECR_REGISTRY="711678334703.dkr.ecr.ap-northeast-2.amazonaws.com"
ECR_REPOSITORY="vws-app"

echo "🚀 VWS EC2 완전 자동 설정 시작..."
echo "도메인: ${DOMAIN}"

# 1. 시스템 업데이트
echo "📦 시스템 업데이트 중..."
sudo yum update -y

# 2. Docker 설치
echo "🐳 Docker 설치 중..."
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# 3. AWS CLI 설치
echo "☁️ AWS CLI 설치 중..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws/

# 4. Docker Compose 설치
echo "🐙 Docker Compose 설치 중..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Nginx 설치
echo "🌐 Nginx 설치 중..."
sudo yum install -y epel-release
sudo yum install -y nginx

# 6. Certbot 설치
echo "🔒 Certbot 설치 중..."
sudo yum install -y certbot python3-certbot-nginx

# 7. AWS 자격 증명 설정 확인
echo "🔑 AWS 자격 증명 확인 중..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "⚠️ AWS 자격 증명이 설정되지 않았습니다."
    echo "다음 명령어로 설정하세요:"
    echo "aws configure"
    exit 1
fi

# 8. ECR 로그인
echo "🔐 ECR 로그인 중..."
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# 9. VWS 앱 컨테이너 실행
echo "🚀 VWS 앱 컨테이너 실행 중..."
docker stop vws-app || true
docker rm vws-app || true
docker pull ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
docker run -d \
    --name vws-app \
    --restart unless-stopped \
    -p 3000:3000 \
    -e NODE_ENV=production \
    ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

# 10. Nginx 설정
echo "⚙️ Nginx 설정 중..."
sudo tee /etc/nginx/conf.d/vws.conf > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 11. Nginx 시작
echo "🔄 Nginx 시작 중..."
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl reload nginx

# 12. 방화벽 설정
echo "🔥 방화벽 설정 중..."
sudo systemctl start firewalld
sudo systemctl enable firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

echo "🎉 EC2 설정이 완료되었습니다!"
echo ""
echo "✅ 설치된 구성 요소:"
echo "- Docker & Docker Compose"
echo "- AWS CLI"
echo "- Nginx (리버스 프록시)"
echo "- Certbot (SSL 인증서)"
echo "- VWS 앱 컨테이너"
echo ""
echo "🔧 다음 단계:"
echo "1. Route53에서 DNS A 레코드 설정"
echo "2. SSL 인증서 발급: sudo certbot --nginx -d ${DOMAIN}"
echo "3. 도메인 연결 테스트"
echo ""
echo "📊 현재 상태:"
echo "- VWS 앱: http://localhost:3000"
echo "- Nginx: http://$(curl -s ifconfig.me)"
