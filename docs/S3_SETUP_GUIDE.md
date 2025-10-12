# S3 파일 업로드 설정 가이드

## 📋 개요

연구개발 증빙 관리 시스템에서 S3를 사용하여 파일 업로드/다운로드 기능을 제공합니다.

## ✅ 완료된 작업

### 1. 코드 구현

- ✅ S3 클라이언트 중앙화 (`src/lib/services/s3/`)
- ✅ Presigned URL 기반 업로드/다운로드 API
- ✅ 파일 검증 유틸리티
- ✅ 프론트엔드 업로드 컴포넌트
- ✅ 문서 관리 UI
- ✅ CI/CD 자동 배포 설정

### 2. CI/CD 통합

- ✅ Nginx 설정 자동화 (파일 크기 제한, 타임아웃)
- ✅ Docker 컨테이너 환경 변수 주입
- ✅ S3 관련 GitHub Secrets 추가

## 🔧 설정 단계

### 1. GitHub Secrets 추가

Repository Settings → Secrets and variables → Actions → New repository secret

다음 Secrets를 추가하세요:

```
AWS_S3_BUCKET_NAME=workstream-via
AWS_S3_REGION=ap-northeast-2
```

**주의**: `AWS_ACCESS_KEY_ID`와 `AWS_SECRET_ACCESS_KEY`는 이미 존재하는 경우 그대로 사용됩니다.

### 2. S3 CORS 설정

AWS Console → S3 → Bucket: `workstream-via` → 권한 → CORS 편집

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://ws.viahub.dev",
      "http://ws.viahub.dev",
      "http://ec2-15-165-161-212.ap-northeast-2.compute.amazonaws.com",
      "https://ec2-15-165-161-212.ap-northeast-2.compute.amazonaws.com"
    ],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3000
  }
]
```

### 3. IAM 권한 설정

현재 사용 중인 IAM 사용자에 다음 정책 추가:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3EvidenceFullAccess",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::workstream-via/*"
    },
    {
      "Sid": "S3BucketAccess",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::workstream-via"
    }
  ]
}
```

### 4. 데이터베이스 마이그레이션

```bash
# 로컬 개발 환경
psql $DATABASE_URL -f migrations/035_add_company_code.sql

# 또는 실제 DB 접속
psql "postgresql://postgres:password@db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com:5432/postgres" \
  -f migrations/035_add_company_code.sql
```

## 🚀 배포 프로세스

### 자동 배포 (CI/CD)

`main` 브랜치에 push하면 자동으로:

1. ✅ 코드 빌드 및 테스트
2. ✅ Docker 이미지 생성 및 ECR 업로드
3. ✅ EC2에 배포
4. ✅ Nginx 설정 자동 업데이트
   - `client_max_body_size 100M` (파일 크기 제한)
   - 타임아웃 600초
5. ✅ S3 환경 변수 자동 주입

### 수동 확인

배포 후 EC2에서 확인:

```bash
# Docker 컨테이너 환경 변수 확인
docker exec vws-app env | grep S3

# Nginx 설정 확인
cat /etc/nginx/conf.d/01-s3-cors.conf

# 애플리케이션 로그 확인
docker logs vws-app --tail 50
```

## 📁 S3 파일 구조

업로드된 파일은 다음 경로에 저장됩니다:

```
workstream-via/
  └── 1001/                          # 회사 코드
      └── projects/
          └── PROJ_2024_002/         # 프로젝트 코드
              └── evidence/
                  └── uuid-123/      # 증빙 ID
                      ├── 1728123456789_invoice.pdf
                      ├── 1728123567890_receipt.jpg
                      └── ...
```

## 🧪 테스트

### 로컬 개발 환경

```bash
# 1. 환경 변수 설정 (.env)
AWS_S3_BUCKET_NAME=workstream-via
AWS_S3_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# 2. 개발 서버 시작
npm run dev

# 3. 브라우저 테스트
# http://localhost:5173/research-development
# → 프로젝트 선택 → 증빙 관리 → 증빙 항목 클릭 → '증빙 서류' 탭
```

### 프로덕션 환경

```bash
# 1. 배포 완료 후 접속
# https://ws.viahub.dev/research-development

# 2. 파일 업로드 테스트
# - PDF, 이미지, 문서 파일 업로드
# - 다운로드 기능 확인
# - 삭제 기능 확인

# 3. 브라우저 콘솔 확인
# - CORS 오류 없음 확인
# - Network 탭에서 S3 Presigned URL 확인
```

## 🔒 보안 설정

### S3 버킷

- ✅ Private 설정 (퍼블릭 액세스 차단)
- ✅ Presigned URL 사용 (짧은 유효기간)
  - 업로드: 15분
  - 다운로드: 5분

### Nginx

- ✅ 파일 크기 제한: 100MB
- ✅ 업로드 타임아웃: 600초
- ✅ HTTPS 강제 (프로덕션)

### 파일 검증

- ✅ 클라이언트 사이드: 파일 타입, 크기 검증
- ✅ 서버 사이드: 파일 검증 및 Presigned URL 발급

## 📊 모니터링

### S3 사용량 확인

```bash
# AWS CLI로 버킷 크기 확인
aws s3 ls s3://workstream-via --recursive --summarize --human-readable
```

### Nginx 로그 확인

```bash
# EC2에 접속
ssh -i your-key.pem ec2-user@15.165.161.212

# 업로드 오류 확인
sudo tail -f /var/log/nginx/error.log | grep -i "client_max_body_size\|timeout"

# 액세스 로그 확인
sudo tail -f /var/log/nginx/access.log | grep -i "POST\|PUT"
```

## 🐛 문제 해결

### 1. 업로드 실패 (413 Error)

```bash
# Nginx client_max_body_size 확인
cat /etc/nginx/conf.d/01-s3-cors.conf

# 수동 업데이트 (필요시)
sudo vi /etc/nginx/conf.d/01-s3-cors.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 2. CORS 오류

- S3 CORS 설정 확인
- 브라우저 개발자 도구 → Network 탭 확인
- Origin 헤더 확인

### 3. 403 Forbidden

- IAM 권한 확인
- Presigned URL 만료 확인
- S3 버킷 정책 확인

### 4. 타임아웃

- Nginx 타임아웃 설정 확인 (`/etc/nginx/conf.d/01-s3-cors.conf`)
- 파일 크기 확인 (100MB 이하인지)
- 네트워크 속도 확인

## 📝 체크리스트

배포 전 확인:

- [ ] GitHub Secrets 설정 (`AWS_S3_BUCKET_NAME`, `AWS_S3_REGION`)
- [ ] S3 CORS 설정
- [ ] IAM S3 권한 추가
- [ ] 데이터베이스 마이그레이션 실행

배포 후 확인:

- [ ] Docker 컨테이너 환경 변수 확인
- [ ] Nginx 설정 파일 생성 확인
- [ ] 파일 업로드 테스트
- [ ] 파일 다운로드 테스트
- [ ] 파일 삭제 테스트
- [ ] S3 버킷에 파일 저장 확인

## 🔗 관련 문서

- [CI/CD 파이프라인](.github/workflows/ci-cd.yml)
- [S3 서비스 코드](src/lib/services/s3/)
- [API 문서](src/routes/api/research-development/evidence/)
- [프론트엔드 컴포넌트](src/lib/components/research-development/)
