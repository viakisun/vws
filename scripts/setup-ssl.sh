#!/bin/bash

# SSL 인증서 자동 설정 스크립트 (Let's Encrypt)
set -e

DOMAIN="ws.viahub.dev"
EMAIL="admin@viahub.dev"  # 실제 이메일로 변경하세요

echo "🔒 SSL 인증서 설정 시작..."
echo "도메인: ${DOMAIN}"

# 1. Certbot 설치
echo "📦 Certbot 설치 중..."
sudo yum update -y
sudo yum install -y epel-release
sudo yum install -y certbot python3-certbot-nginx

# 2. Nginx 설치 (아직 설치되지 않은 경우)
if ! command -v nginx &> /dev/null; then
    echo "📦 Nginx 설치 중..."
    sudo yum install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# 3. Nginx 기본 설정
echo "⚙️ Nginx 설정 중..."
sudo tee /etc/nginx/conf.d/vws.conf > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    # HTTP에서 HTTPS로 리다이렉트
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    
    # SSL 설정 (Certbot이 자동으로 설정)
    
    # 보안 헤더
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # VWS 앱 프록시
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
    
    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 4. Nginx 설정 테스트
echo "🧪 Nginx 설정 테스트 중..."
sudo nginx -t

# 5. Nginx 재시작
echo "🔄 Nginx 재시작 중..."
sudo systemctl restart nginx

# 6. SSL 인증서 발급
echo "🔐 SSL 인증서 발급 중..."
sudo certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email ${EMAIL}

# 7. 자동 갱신 설정
echo "🔄 자동 갱신 설정 중..."
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

echo "🎉 SSL 설정이 완료되었습니다!"
echo "도메인: https://${DOMAIN}"
echo ""
echo "✅ 다음 기능이 활성화되었습니다:"
echo "- HTTPS 자동 리다이렉트"
echo "- SSL 인증서 자동 갱신"
echo "- 보안 헤더 설정"
echo "- 정적 파일 캐싱"
