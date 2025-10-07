# EC2 배포 설정 가이드

## 1. EC2 인스턴스 준비

### 필요한 소프트웨어 설치

```bash
# Docker 설치
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# AWS CLI 설치
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Docker Compose 설치 (선택사항)
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### AWS 자격 증명 설정

```bash
aws configure
# AWS Access Key ID: [입력]
# AWS Secret Access Key: [입력]
# Default region name: ap-northeast-2
# Default output format: json
```

## 2. GitHub Actions 자동 배포 설정

### 필요한 GitHub Secrets 추가:

- `EC2_HOST`: EC2 인스턴스의 공용 IP 또는 도메인
- `EC2_USER`: SSH 사용자명 (보통 `ec2-user`)
- `EC2_SSH_KEY`: EC2 인스턴스 접근용 SSH 프라이빗 키

### SSH 키 생성 및 설정:

```bash
# 로컬에서 SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "vws-deploy"

# EC2에 공개 키 복사
ssh-copy-id -i ~/.ssh/id_rsa.pub ec2-user@YOUR_EC2_IP
```

## 3. 배포 방법

### 방법 A: GitHub Actions 자동 배포 (권장)

1. GitHub Secrets 설정 완료
2. `main` 브랜치에 푸시하거나 수동으로 워크플로우 실행
3. 자동으로 EC2에 배포됨

### 방법 B: 수동 배포

```bash
# EC2에 접속
ssh ec2-user@YOUR_EC2_IP

# 배포 스크립트 실행
curl -O https://raw.githubusercontent.com/viakisun/vws/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 방법 C: Docker Compose 사용

```bash
# EC2에 접속
ssh ec2-user@YOUR_EC2_IP

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 711678334703.dkr.ecr.ap-northeast-2.amazonaws.com

# Docker Compose로 배포
curl -O https://raw.githubusercontent.com/viakisun/vws/main/docker-compose.production.yml
docker-compose -f docker-compose.production.yml up -d
```

## 4. 보안 그룹 설정

EC2 보안 그룹에서 다음 포트를 열어야 합니다:

- **포트 22**: SSH 접근용
- **포트 80**: 웹 애플리케이션용
- **포트 443**: HTTPS용 (SSL 인증서 설정 시)

## 5. 모니터링 및 로그

### 컨테이너 상태 확인

```bash
docker ps
docker logs vws-app
```

### 애플리케이션 헬스 체크

```bash
curl http://localhost:3000/health
```

## 6. 자동 업데이트 설정

GitHub Actions를 사용하면 `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다.

## 7. 트러블슈팅

### 일반적인 문제들:

1. **ECR 접근 권한**: IAM 역할 또는 사용자에게 ECR 권한 확인
2. **포트 충돌**: 기존 서비스와 포트 충돌 확인
3. **메모리 부족**: EC2 인스턴스 타입 확인
4. **네트워크 문제**: 보안 그룹 설정 확인
