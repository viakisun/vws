# 🚀 새로운 EC2 + ws.viahub.dev 설정 가이드

## 📋 개요

이 가이드는 새로운 EC2 인스턴스에 VWS 애플리케이션을 배포하고 `ws.viahub.dev` 도메인으로 설정하는 완전한 과정을 설명합니다.

## 🎯 목표

- ✅ 저렴한 EC2 인스턴스 설정
- ✅ `ws.viahub.dev` 도메인 연결
- ✅ Route53 DNS 설정
- ✅ SSL 인증서 자동 설정
- ✅ 자동 배포 파이프라인

## 🛠️ 1단계: EC2 인스턴스 생성

### 권장 인스턴스 타입
```
t3.micro (프리 티어)
- 1 vCPU, 1GB RAM
- 월 $0 (프리 티어)

t3.small (권장)
- 2 vCPU, 2GB RAM  
- 월 ~$15

t3.medium (고성능)
- 2 vCPU, 4GB RAM
- 월 ~$30
```

### 보안 그룹 설정
```
인바운드 규칙:
- SSH (22): 내 IP만
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
```

### 키 페어 설정
- 새 키 페어 생성 또는 기존 키 사용
- `.pem` 파일을 안전한 곳에 저장

## 🌐 2단계: Route53 도메인 설정

### 호스팅 영역 확인
```bash
# viahub.dev 호스팅 영역이 존재하는지 확인
aws route53 list-hosted-zones --query "HostedZones[?Name=='viahub.dev.']"
```

### DNS A 레코드 생성
```bash
# 스크립트 실행
chmod +x scripts/setup-domain.sh
./scripts/setup-domain.sh
```

또는 수동으로:
```bash
# 1. 호스팅 영역 ID 확인
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='viahub.dev.'].Id" --output text | sed 's|/hostedzone/||')

# 2. DNS 변경 배치 생성
cat > dns-change.json << EOF
{
    "Comment": "Create A record for ws.viahub.dev",
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "ws.viahub.dev",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [{"Value": "YOUR_EC2_IP"}]
            }
        }
    ]
}
EOF

# 3. DNS 레코드 생성
aws route53 change-resource-record-sets \
    --hosted-zone-id "${HOSTED_ZONE_ID}" \
    --change-batch file://dns-change.json
```

## 🖥️ 3단계: EC2 초기 설정

### EC2에 접속
```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
```

### 완전 자동 설정 스크립트 실행
```bash
# 스크립트 다운로드 및 실행
curl -O https://raw.githubusercontent.com/viakisun/vws/main/scripts/setup-ec2-complete.sh
chmod +x setup-ec2-complete.sh
./setup-ec2-complete.sh
```

이 스크립트는 다음을 자동으로 설치합니다:
- Docker & Docker Compose
- AWS CLI
- Nginx (리버스 프록시)
- Certbot (SSL 인증서)
- VWS 앱 컨테이너

## 🔒 4단계: SSL 인증서 설정

### Let's Encrypt 인증서 발급
```bash
# SSL 설정 스크립트 실행
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh
```

또는 수동으로:
```bash
# SSL 인증서 발급
sudo certbot --nginx -d ws.viahub.dev --non-interactive --agree-tos --email admin@viahub.dev

# 자동 갱신 설정
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 🚀 5단계: GitHub Actions 자동 배포 설정

### GitHub Secrets 추가
```
EC2_HOST: EC2 인스턴스의 퍼블릭 IP
EC2_USER: ec2-user
EC2_SSH_KEY: SSH 프라이빗 키 내용
AWS_ACCESS_KEY_ID: AWS 액세스 키
AWS_SECRET_ACCESS_KEY: AWS 시크릿 키
SLACK_WEBHOOK_URL: Slack 알림용 (선택사항)
```

### SSH 키 설정
```bash
# 로컬에서 SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "vws-deploy"

# EC2에 공개 키 복사
ssh-copy-id -i ~/.ssh/id_rsa.pub ec2-user@YOUR_EC2_IP

# GitHub Secrets에 프라이빗 키 추가
cat ~/.ssh/id_rsa
```

## 📊 6단계: 배포 테스트

### 수동 배포 테스트
```bash
# EC2에 접속
ssh ec2-user@YOUR_EC2_IP

# 수동 배포 실행
curl -O https://raw.githubusercontent.com/viakisun/vws/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 자동 배포 테스트
```bash
# main 브랜치에 푸시하면 자동 배포
git add .
git commit -m "test: trigger automatic deployment"
git push origin main
```

## 🔍 7단계: 모니터링 및 확인

### 서비스 상태 확인
```bash
# 컨테이너 상태
docker ps

# Nginx 상태
sudo systemctl status nginx

# SSL 인증서 상태
sudo certbot certificates

# 애플리케이션 로그
docker logs vws-app
```

### 도메인 연결 테스트
```bash
# DNS 전파 확인
nslookup ws.viahub.dev

# HTTPS 연결 테스트
curl -I https://ws.viahub.dev

# 웹 브라우저에서 접속
# https://ws.viahub.dev
```

## 💰 비용 최적화

### 월 예상 비용
```
EC2 t3.micro (프리 티어): $0
Route53 호스팅 영역: $0.50
SSL 인증서 (Let's Encrypt): $0
총 비용: ~$0.50/월
```

### 추가 최적화
- CloudFront CDN 사용 (선택사항)
- S3 정적 파일 호스팅 (선택사항)
- RDS 데이터베이스 (필요시)

## 🛠️ 트러블슈팅

### 일반적인 문제들

#### DNS 전파 지연
```bash
# DNS 전파 확인
dig ws.viahub.dev
nslookup ws.viahub.dev 8.8.8.8
```

#### SSL 인증서 문제
```bash
# 인증서 갱신
sudo certbot renew --dry-run
sudo certbot renew
```

#### 컨테이너 시작 실패
```bash
# 로그 확인
docker logs vws-app

# 컨테이너 재시작
docker restart vws-app
```

#### Nginx 설정 문제
```bash
# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

## 📞 지원

문제가 발생하면:
1. GitHub Issues에 문제 보고
2. 로그 파일 확인
3. AWS CloudWatch 모니터링 사용

---

🎉 **축하합니다!** `ws.viahub.dev` 도메인으로 VWS 애플리케이션이 성공적으로 배포되었습니다!
