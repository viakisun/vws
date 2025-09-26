# VWS 완전 설정 가이드 🚀

이 가이드는 VWS (Workstream Svelte) 프로젝트를 처음부터 완전히 설정하는 방법을 단계별로 설명합니다.

## 📋 목차

1. [프로젝트 클론 및 초기 설정](#1-프로젝트-클론-및-초기-설정)
2. [로컬 개발 환경 설정](#2-로컬-개발-환경-설정)
3. [AWS 계정 및 서비스 설정](#3-aws-계정-및-서비스-설정)
4. [GitHub Actions CI/CD 설정](#4-github-actions-cicd-설정)
5. [EC2 인스턴스 설정](#5-ec2-인스턴스-설정)
6. [도메인 및 SSL 설정](#6-도메인-및-ssl-설정)
7. [최종 배포 및 확인](#7-최종-배포-및-확인)
8. [문제 해결](#8-문제-해결)

---

## 1. 프로젝트 클론 및 초기 설정

### 1.1. 프로젝트 클론

```bash
# GitHub에서 프로젝트 클론
git clone https://github.com/viakisun/vws.git
cd vws

# main 브랜치로 이동
git checkout main
```

### 1.2. Node.js 및 pnpm 설치

#### Node.js 설치 (v20 이상 필요)

- [Node.js 공식 사이트](https://nodejs.org/)에서 LTS 버전 다운로드 및 설치
- 설치 확인: `node --version` (v20.x.x 이상이어야 함)

#### pnpm 설치

```bash
# pnpm 전역 설치
npm install -g pnpm

# 설치 확인
pnpm --version
```

### 1.3. 의존성 설치

```bash
# 프로젝트 의존성 설치
pnpm install

# 설치 확인
pnpm list
```

---

## 2. 로컬 개발 환경 설정

### 2.1. 환경 변수 설정

```bash
# .env 파일 생성
cp env.example .env

# .env 파일 편집 (필요에 따라 수정)
nano .env
```

### 2.2. 로컬 개발 서버 실행

```bash
# 개발 서버 시작
pnpm dev

# 브라우저에서 http://localhost:5173 접속 확인
```

### 2.3. 코드 품질 도구 확인

```bash
# 코드 포맷팅 확인
pnpm format:check

# ESLint 검사
pnpm lint:ci

# TypeScript 타입 체크
pnpm typecheck

# 빌드 테스트
pnpm build
```

---

## 3. AWS 계정 및 서비스 설정

### 3.1. AWS 계정 생성 및 로그인

1. [AWS 콘솔](https://aws.amazon.com/console/) 접속
2. 계정이 없다면 새 계정 생성
3. AWS 콘솔에 로그인

### 3.2. IAM 사용자 생성 (GitHub Actions용)

#### 3.2.1. IAM 콘솔 접속

1. AWS 콘솔에서 "IAM" 검색 후 선택
2. 좌측 메뉴에서 "사용자" 클릭
3. "사용자 생성" 버튼 클릭

#### 3.2.2. 사용자 정보 입력

- **사용자 이름**: `vws-github-actions`
- **AWS 자격 증명 유형**: "액세스 키 - 프로그래매틱 액세스" 선택
- "다음" 클릭

#### 3.2.3. 권한 설정

- "기존 정책 직접 연결" 선택
- 다음 정책들을 검색하여 추가:
  - `AmazonEC2FullAccess`
  - `AmazonEC2ContainerRegistryFullAccess`
  - `AmazonRoute53FullAccess`
  - `AmazonECS_FullAccess`

#### 3.2.4. 액세스 키 생성

- "액세스 키 만들기" 클릭
- **중요**: CSV 파일 다운로드 (나중에 다시 볼 수 없음)
- Access Key ID와 Secret Access Key를 안전한 곳에 저장

### 3.3. Route53 호스팅 영역 설정

#### 3.3.1. 도메인 확인

- `viahub.dev` 도메인이 Route53에서 관리되고 있는지 확인
- 없다면 도메인 등록 또는 네임서버 변경 필요

#### 3.3.2. 호스팅 영역 확인

1. Route53 콘솔에서 "호스팅 영역" 클릭
2. `viahub.dev` 호스팅 영역이 있는지 확인
3. 없다면 "호스팅 영역 생성" 클릭하여 생성

---

## 4. GitHub Actions CI/CD 설정

### 4.1. GitHub Secrets 설정

#### 4.1.1. 저장소 Secrets 페이지 접속

1. GitHub 저장소 페이지에서 "Settings" 탭 클릭
2. 좌측 메뉴에서 "Secrets and variables" → "Actions" 클릭
3. "New repository secret" 버튼 클릭

#### 4.1.2. 필요한 Secrets 추가

다음 시크릿들을 각각 추가:

| Secret 이름             | 값                             | 설명                    |
| ----------------------- | ------------------------------ | ----------------------- |
| `AWS_ACCESS_KEY_ID`     | IAM 사용자의 Access Key ID     | AWS 액세스 키           |
| `AWS_SECRET_ACCESS_KEY` | IAM 사용자의 Secret Access Key | AWS 시크릿 키           |
| `EC2_HOST`              | EC2 퍼블릭 IP                  | EC2 인스턴스 IP         |
| `EC2_USER`              | `ec2-user`                     | EC2 SSH 사용자명        |
| `EC2_SSH_KEY`           | SSH 프라이빗 키 내용           | EC2 SSH 키              |
| `SLACK_WEBHOOK_URL`     | Slack 웹훅 URL                 | Slack 알림용 (선택사항) |

#### 4.1.3. SSH 키 생성 및 설정

```bash
# SSH 키 쌍 생성 (로컬에서 실행)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/vws-ec2-key

# 공개키는 EC2 키 페어로 등록
# 프라이빗키 내용을 EC2_SSH_KEY 시크릿에 저장
cat ~/.ssh/vws-ec2-key
```

---

## 5. EC2 인스턴스 설정

### 5.1. EC2 인스턴스 생성

#### 5.1.1. EC2 콘솔 접속

1. AWS 콘솔에서 "EC2" 검색 후 선택
2. "인스턴스 시작" 버튼 클릭

#### 5.1.2. AMI 선택

- **Amazon Linux 2023 AMI** 선택 (무료 티어 사용 가능)
- 아키텍처: "64-bit (x86)"

#### 5.1.3. 인스턴스 유형 선택

- **t3.micro** 선택 (프리 티어)
- 더 나은 성능을 원하면 `t3.small` 또는 `t3.medium` 고려

#### 5.1.4. 키 페어 설정

- **"새 키 페어 생성"** 선택
- 키 페어 이름: `vws-ec2-key`
- **".pem"** 형식으로 다운로드
- 다운로드한 파일을 안전한 곳에 저장

#### 5.1.5. 네트워크 설정 (보안 그룹)

- **"새 보안 그룹 생성"** 선택
- 보안 그룹 이름: `vws-security-group`
- **인바운드 보안 그룹 규칙 추가**:

| 유형       | 프로토콜 | 포트 범위 | 소스      | 설명        |
| ---------- | -------- | --------- | --------- | ----------- |
| SSH        | TCP      | 22        | 내 IP     | SSH 접속    |
| HTTP       | TCP      | 80        | 0.0.0.0/0 | 웹 접속     |
| HTTPS      | TCP      | 443       | 0.0.0.0/0 | HTTPS 접속  |
| Custom TCP | TCP      | 3000      | 0.0.0.0/0 | VWS 앱 포트 |

#### 5.1.6. 스토리지 구성

- 기본 설정 (8GB gp2) 유지

#### 5.1.7. 인스턴스 시작

- 모든 설정 검토 후 "인스턴스 시작" 클릭
- 인스턴스가 "실행 중" 상태가 될 때까지 대기

### 5.2. IAM 역할 연결

#### 5.2.1. 기존 IAM 역할 확인

1. IAM 콘솔에서 "역할" 클릭
2. `ec2-certbot-route53-role` 역할이 있는지 확인
3. 없다면 다음 단계로 새 역할 생성

#### 5.2.2. IAM 역할 생성 (필요한 경우)

1. "역할 생성" 클릭
2. **신뢰할 수 있는 엔터티 유형**: "AWS 서비스" 선택
3. **사용 사례**: "EC2" 선택
4. **권한 정책 추가**:
   - `AmazonEC2ContainerRegistryReadOnly`
   - `AmazonRoute53FullAccess`
   - `AmazonEC2FullAccess`

#### 5.2.3. EC2에 IAM 역할 연결

1. EC2 콘솔에서 생성한 인스턴스 선택
2. "작업" → "보안" → "IAM 역할 수정" 클릭
3. `ec2-certbot-route53-role` 선택
4. "업데이트" 클릭

### 5.3. EC2 환경 설정

#### 5.3.1. SSH 접속

```bash
# 키 파일 권한 설정 (Mac/Linux)
chmod 400 ~/Downloads/vws-ec2-key.pem

# SSH 접속 (YOUR_EC2_IP를 실제 IP로 변경)
ssh -i ~/Downloads/vws-ec2-key.pem ec2-user@YOUR_EC2_IP
```

#### 5.3.2. 시스템 업데이트

```bash
# 시스템 업데이트
sudo yum update -y
```

#### 5.3.3. Docker 설치

```bash
# Docker 설치
sudo yum install -y docker

# Docker 서비스 시작 및 활성화
sudo systemctl start docker
sudo systemctl enable docker

# 현재 사용자를 docker 그룹에 추가
sudo usermod -a -G docker ec2-user

# 그룹 권한 적용
newgrp docker

# Docker 설치 확인
docker --version
```

#### 5.3.4. AWS CLI 설치

```bash
# AWS CLI 설치
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws/

# AWS CLI 설치 확인
aws --version
```

#### 5.3.5. IAM 역할 확인

```bash
# IAM 역할이 제대로 연결되었는지 확인
aws sts get-caller-identity
```

성공하면 다음과 같이 표시됩니다:

```json
{
  "UserId": "AROAXXXXXXXXXXXXXXX:ec2-user",
  "Account": "123456789012",
  "Arn": "arn:aws:sts::123456789012:assumed-role/ec2-certbot-route53-role/ec2-user"
}
```

#### 5.3.6. Nginx 설치

```bash
# Nginx 설치
sudo yum install -y nginx

# Nginx 서비스 시작 및 활성화
sudo systemctl start nginx
sudo systemctl enable nginx

# Nginx 설치 확인
sudo nginx -t
```

---

## 6. 도메인 및 SSL 설정

### 6.1. Route53 도메인 설정

#### 6.1.1. 도메인 설정 스크립트 다운로드 (로컬에서 실행)

```bash
# 스크립트 다운로드
curl -O https://raw.githubusercontent.com/viakisun/vws/main/scripts/setup-domain.sh
chmod +x setup-domain.sh
```

#### 6.1.2. EC2 IP 확인

```bash
# EC2에서 퍼블릭 IP 확인
curl -s http://169.254.169.254/latest/meta-data/public-ipv4
```

#### 6.1.3. 도메인 설정 실행 (로컬에서 실행)

```bash
# EC2_IP를 실제 IP로 변경하여 실행
./setup-domain.sh EC2_IP
```

### 6.2. SSL 인증서 설정

#### 6.2.1. Certbot 설치 (EC2에서 실행)

```bash
# Certbot 설치
sudo yum install -y certbot python3-certbot-nginx
```

#### 6.2.2. Nginx 설정 (EC2에서 실행)

```bash
# Nginx 설정 파일 생성
sudo tee /etc/nginx/conf.d/vws.conf > /dev/null <<EOF
server {
    listen 80;
    server_name ws.viahub.dev;

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

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl reload nginx
```

#### 6.2.3. SSL 인증서 발급 (EC2에서 실행)

```bash
# SSL 인증서 발급 (your-email@example.com을 실제 이메일로 변경)
sudo certbot --nginx -d ws.viahub.dev --non-interactive --agree-tos --email your-email@example.com
```

#### 6.2.4. 자동 갱신 설정 (EC2에서 실행)

```bash
# cronie 설치
sudo yum install -y cronie

# cron 서비스 시작 및 활성화
sudo systemctl start crond
sudo systemctl enable crond

# 자동 갱신 설정
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

# 설정 확인
sudo crontab -l
```

---

## 7. 최종 배포 및 확인

### 7.1. 수동 배포 테스트

#### 7.1.1. ECR 로그인 테스트 (EC2에서 실행)

```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 711678334703.dkr.ecr.ap-northeast-2.amazonaws.com
```

#### 7.1.2. VWS 앱 컨테이너 실행 (EC2에서 실행)

```bash
# 기존 컨테이너 정리
docker stop vws-app || true
docker rm vws-app || true

# 최신 이미지 다운로드
docker pull 711678334703.dkr.ecr.ap-northeast-2.amazonaws.com/vws-app:latest

# VWS 앱 컨테이너 실행
docker run -d \
  --name vws-app \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  711678334703.dkr.ecr.ap-northeast-2.amazonaws.com/vws-app:latest

# 컨테이너 상태 확인
docker ps

# 컨테이너 로그 확인
docker logs vws-app
```

### 7.2. 웹 접속 확인

#### 7.2.1. 로컬 접속 테스트

```bash
# EC2에서 로컬 접속 테스트
curl http://localhost:3000
```

#### 7.2.2. 도메인 접속 테스트

- 웹 브라우저에서 `https://ws.viahub.dev` 접속
- VWS 애플리케이션이 정상적으로 로드되는지 확인

### 7.3. 자동 배포 테스트

#### 7.3.1. GitHub에 코드 푸시

```bash
# 로컬에서 간단한 변경사항 만들기
echo "# Test deployment" >> README.md

# 변경사항 커밋 및 푸시
git add .
git commit -m "test: test automatic deployment"
git push origin main
```

#### 7.3.2. GitHub Actions 확인

1. GitHub 저장소 페이지에서 "Actions" 탭 클릭
2. 실행 중인 워크플로우 확인
3. 각 단계별 로그 확인

#### 7.3.3. 배포 완료 확인

- 모든 워크플로우가 성공적으로 완료되는지 확인
- `https://ws.viahub.dev`에서 최신 변경사항이 반영되었는지 확인

---

## 8. 문제 해결

### 8.1. 일반적인 문제들

#### 8.1.1. SSH 접속 실패

```bash
# 키 파일 권한 확인
ls -la ~/.ssh/vws-ec2-key.pem

# 권한 수정 (필요한 경우)
chmod 400 ~/.ssh/vws-ec2-key.pem

# 연결 테스트
ssh -i ~/.ssh/vws-ec2-key.pem ec2-user@YOUR_EC2_IP -v
```

#### 8.1.2. Docker 컨테이너 실행 실패

```bash
# 컨테이너 로그 확인
docker logs vws-app

# 포트 충돌 확인
sudo netstat -tlnp | grep 3000

# 컨테이너 재시작
docker restart vws-app
```

#### 8.1.3. SSL 인증서 발급 실패

```bash
# DNS 전파 확인
nslookup ws.viahub.dev

# Nginx 설정 확인
sudo nginx -t

# Certbot 로그 확인
sudo journalctl -u certbot
```

#### 8.1.4. GitHub Actions 실패

1. GitHub 저장소 "Actions" 탭에서 실패한 워크플로우 클릭
2. 실패한 단계의 로그 확인
3. 일반적인 원인들:
   - AWS 자격 증명 문제
   - 권한 부족
   - 네트워크 연결 문제

### 8.2. 로그 확인 명령어

#### 8.2.1. EC2 시스템 로그

```bash
# 시스템 로그 확인
sudo journalctl -f

# Docker 로그 확인
docker logs -f vws-app

# Nginx 로그 확인
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### 8.2.2. AWS 서비스 상태 확인

```bash
# ECR 리포지토리 확인
aws ecr describe-repositories --region ap-northeast-2

# Route53 레코드 확인
aws route53 list-resource-record-sets --hosted-zone-id YOUR_HOSTED_ZONE_ID
```

### 8.3. 성능 최적화

#### 8.3.1. EC2 인스턴스 모니터링

```bash
# 시스템 리소스 사용량 확인
top
htop  # 설치되어 있다면

# 디스크 사용량 확인
df -h

# 메모리 사용량 확인
free -h
```

#### 8.3.2. Docker 최적화

```bash
# 사용하지 않는 Docker 리소스 정리
docker system prune -a

# 컨테이너 리소스 제한 설정 (필요한 경우)
docker run -d \
  --name vws-app \
  --restart unless-stopped \
  --memory="512m" \
  --cpus="0.5" \
  -p 3000:3000 \
  -e NODE_ENV=production \
  711678334703.dkr.ecr.ap-northeast-2.amazonaws.com/vws-app:latest
```

---

## 9. 유지보수 및 모니터링

### 9.1. 정기 점검 사항

#### 9.1.1. 주간 점검

- [ ] 애플리케이션 접속 상태 확인
- [ ] SSL 인증서 만료일 확인
- [ ] EC2 인스턴스 상태 확인
- [ ] GitHub Actions 실행 상태 확인

#### 9.1.2. 월간 점검

- [ ] AWS 비용 확인
- [ ] 보안 그룹 규칙 검토
- [ ] 백업 상태 확인
- [ ] 로그 파일 정리

### 9.2. 업데이트 절차

#### 9.2.1. 애플리케이션 업데이트

```bash
# 로컬에서 코드 수정 후
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main

# GitHub Actions가 자동으로 배포 수행
```

#### 9.2.2. 서버 업데이트

```bash
# EC2에서 시스템 업데이트
sudo yum update -y

# Docker 재시작
sudo systemctl restart docker

# Nginx 재시작
sudo systemctl restart nginx
```

---

## 10. 보안 체크리스트

### 10.1. AWS 보안

- [ ] IAM 사용자 최소 권한 원칙 적용
- [ ] 보안 그룹 규칙 최소화
- [ ] 정기적인 액세스 키 로테이션
- [ ] CloudTrail 로깅 활성화

### 10.2. 애플리케이션 보안

- [ ] HTTPS 강제 사용
- [ ] 환경 변수 보안 관리
- [ ] 정기적인 의존성 업데이트
- [ ] 보안 스캔 실행

---

## 📞 지원 및 도움말

### 문제 발생 시

1. **GitHub Issues**: 저장소의 Issues 탭에서 문제 보고
2. **로그 확인**: 위의 로그 확인 명령어 사용
3. **AWS 지원**: AWS 콘솔에서 지원 티켓 생성

### 추가 리소스

- [AWS 공식 문서](https://docs.aws.amazon.com/)
- [Docker 공식 문서](https://docs.docker.com/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [SvelteKit 문서](https://kit.svelte.dev/)

---

**🎉 축하합니다! VWS 애플리케이션이 완전히 설정되었습니다!**

이제 `https://ws.viahub.dev`에서 VWS 애플리케이션에 접속할 수 있으며, 코드 변경 시 자동으로 배포됩니다.
