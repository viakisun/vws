# 환경 설정 가이드

VWS (VIA Workstream) 프로젝트의 로컬 개발 환경 및 프로덕션 배포를 위한 환경 설정 가이드입니다.

---

## 목차

1. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
2. [프로덕션 배포 설정](#프로덕션-배포-설정)
3. [환경변수 전체 목록](#환경변수-전체-목록)
4. [트러블슈팅](#트러블슈팅)

---

## 로컬 개발 환경 설정

### 1. 사전 요구사항

#### Node.js 설치

- **권장 버전**: Node.js 20.x 이상
- **설치 방법**:

  ```bash
  # Homebrew (macOS)
  brew install node@20

  # nvm 사용
  nvm install 20
  nvm use 20
  ```

#### PostgreSQL 접근

- VWS는 AWS RDS PostgreSQL을 사용합니다
- 로컬 PostgreSQL 설치는 필요하지 않습니다
- RDS 접근 권한이 필요합니다

### 2. 프로젝트 설정

#### 저장소 클론 및 의존성 설치

```bash
# 저장소 클론
git clone <repository-url>
cd vws

# 의존성 설치
npm ci
```

#### 환경변수 파일 생성

```bash
# .env.example을 복사하여 .env 파일 생성
cp env.example .env
```

### 3. Google OAuth 설정

VWS는 Google OAuth를 통한 인증을 사용합니다.

#### 3.1. Google Cloud Console 설정

1. **Google Cloud Console 접속**
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - 프로젝트 선택 또는 새 프로젝트 생성

2. **OAuth 동의 화면 구성**
   - 왼쪽 메뉴 → "API 및 서비스" → "OAuth 동의 화면"
   - 사용자 유형 선택: "내부" (조직 내부용) 또는 "외부"
   - 앱 정보 입력:
     - 앱 이름: "VIA Workstream"
     - 사용자 지원 이메일
     - 개발자 연락처 정보
   - 범위 추가:
     - `openid`
     - `profile`
     - `email`

3. **OAuth 2.0 클라이언트 ID 만들기**
   - 왼쪽 메뉴 → "API 및 서비스" → "사용자 인증 정보"
   - "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"
   - 애플리케이션 유형: "웹 애플리케이션"
   - 이름: "VWS Local Development"
   - 승인된 리디렉션 URI 추가:
     - 로컬: `http://localhost:5173/api/auth/callback/google`
     - 프로덕션: `https://your-domain.com/api/auth/callback/google`
   - "만들기" 클릭

4. **클라이언트 ID와 비밀번호 복사**
   - 생성된 클라이언트 ID와 클라이언트 보안 비밀 복사
   - `.env` 파일에 저장:
     ```bash
     GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your-client-secret
     GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/callback/google
     ```

#### 3.2. 허용 도메인 설정

`.env` 파일에 로그인을 허용할 이메일 도메인 설정:

```bash
# 단일 도메인
ALLOWED_DOMAINS=viasofts.com

# 여러 도메인 (쉼표로 구분)
ALLOWED_DOMAINS=viasofts.com,example.com
```

특정 사용자만 관리자 권한 부여:

```bash
ADMIN_EMAILS=admin@viasofts.com,manager@viasofts.com
```

### 4. AWS RDS 연결 설정

#### 4.1. RDS 정보 확인

AWS Console에서 RDS 인스턴스 정보 확인:

- 엔드포인트(Endpoint)
- 포트(Port)
- 데이터베이스 이름
- 마스터 사용자 이름
- 마스터 암호

#### 4.2. .env 파일 설정

```bash
# AWS RDS 데이터베이스 연결 정보
AWS_DB_HOST=db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com
AWS_DB_PORT=5432
AWS_DB_NAME=postgres
AWS_DB_USER=postgres
AWS_DB_PASSWORD=your-database-password
```

**중요**: `.env` 파일은 절대 Git에 커밋하지 마세요!

#### 4.3. 보안 그룹 설정

로컬에서 RDS에 접근하려면 RDS 보안 그룹에 로컬 IP 추가 필요:

1. AWS Console → RDS → 데이터베이스 인스턴스 선택
2. "연결 및 보안" 탭 → 보안 그룹 클릭
3. "인바운드 규칙 편집"
4. "규칙 추가":
   - 유형: PostgreSQL
   - 포트: 5432
   - 소스: 내 IP (또는 특정 IP/CIDR)

### 5. AWS S3 설정

VWS는 증빙 서류 파일 업로드를 위해 AWS S3를 사용합니다.

#### 5.1. S3 버킷 생성

1. **AWS Console → S3 → "버킷 만들기"**
   - 버킷 이름: `workstream-via` (또는 원하는 이름)
   - 리전: `ap-northeast-2` (서울)
   - 퍼블릭 액세스 차단: 모두 체크 (권장)
   - 버전 관리: 선택사항
   - 버킷 생성

#### 5.2. CORS 설정

S3 버킷에서 직접 업로드를 위해 CORS 설정 필요:

1. S3 버킷 선택 → "권한" 탭
2. "CORS(Cross-Origin Resource Sharing)" 편집
3. 다음 JSON 입력:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:5173", "https://ws.viahub.dev"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

#### 5.3. IAM 사용자 생성 및 권한 설정

1. **IAM 사용자 생성**
   - AWS Console → IAM → "사용자" → "사용자 추가"
   - 사용자 이름: `vws-s3-uploader`
   - 액세스 유형: "프로그래밍 방식 액세스"

2. **권한 설정**
   - "기존 정책 직접 연결"
   - 다음 정책 생성 또는 선택:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::workstream-via/*", "arn:aws:s3:::workstream-via"]
    }
  ]
}
```

3. **액세스 키 저장**
   - 생성된 "액세스 키 ID"와 "비밀 액세스 키" 복사
   - `.env` 파일에 저장:

```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=workstream-via
AWS_S3_REGION=ap-northeast-2
```

#### 5.4. 파일 업로드 설정

```bash
# 파일 업로드 제한 설정
MAX_FILE_SIZE_MB=100
ALLOWED_FILE_TYPES=.pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.hwp
```

### 6. OCR 엔진 설정 (CRM 문서 인식)

VWS는 CRM 고객 등록을 위한 OCR 기능을 제공합니다. 두 가지 OCR 엔진을 선택할 수 있습니다.

#### 6.1. 지원되는 OCR 엔진

**1. OpenAI GPT-4 Vision (권장, 기본값)**

- **장점**:
  - 한국어 문서 인식 정확도 매우 우수
  - JSON Schema Strict Mode로 구조화된 데이터 추출
  - 사업자등록증, 통장사본 인식에 최적화
- **단점**:
  - 이미지당 약 $0.01-0.02 비용
  - OpenAI API 키 필요
- **사용 예**: 정확한 고객 정보 추출이 중요한 경우

**2. AWS Textract**

- **장점**:
  - AWS 프리 티어 제공 (월 1,000페이지 무료)
  - AWS 통합 환경에서 사용 편리
  - 비용 효율적
- **단점**:
  - 한국어 인식 정확도가 OpenAI보다 낮음
  - 추가 파싱 로직 필요
- **사용 예**: 대량 문서 처리, 비용 절감이 중요한 경우

#### 6.2. OpenAI Vision 설정 (권장)

`.env` 파일에 추가:

```bash
# OCR 엔진 선택 (기본값: openai)
OCR_ENGINE=openai

# OpenAI API 키 (필수)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**OpenAI API 키 발급 방법**:

1. [OpenAI Platform](https://platform.openai.com/) 접속
2. 계정 생성 또는 로그인
3. "API keys" 페이지 이동
4. "Create new secret key" 클릭
5. 키 이름 입력 (예: "VWS OCR") 및 생성
6. 생성된 키를 복사하여 `.env` 저장 (다시 확인 불가!)

#### 6.3. AWS Textract 설정 (선택 사항)

```bash
# OCR 엔진 선택
OCR_ENGINE=textract

# AWS 자격 증명 (S3 설정과 동일)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-northeast-2
```

**AWS Textract IAM 권한 추가**:

기존 S3 IAM 사용자에 다음 권한 추가:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["textract:DetectDocumentText", "textract:AnalyzeDocument"],
      "Resource": "*"
    }
  ]
}
```

#### 6.4. OCR 엔진 전환

런타임에 OCR 엔진을 전환할 수 있습니다:

- **환경 변수로 전환**: `.env` 파일의 `OCR_ENGINE` 변경 후 서버 재시작
- **API 파라미터로 전환**: 클라이언트에서 엔진 선택 가능

  ```typescript
  // OpenAI 사용
  fetch('/api/crm/ocr?engine=openai', ...)

  // Textract 사용
  fetch('/api/crm/ocr?engine=textract', ...)
  ```

#### 6.5. 비용 및 성능 비교

| 항목            | OpenAI GPT-4 Vision | AWS Textract              |
| --------------- | ------------------- | ------------------------- |
| 한국어 정확도   | ★★★★★               | ★★★☆☆                     |
| 비용 (이미지당) | $0.01-0.02          | $0.0015 (프리 티어: 무료) |
| 처리 속도       | 5-10초              | 2-5초                     |
| 구조화된 추출   | JSON Schema         | Text + 파싱               |
| 추천 사용처     | 정확도 중요         | 대량 처리, 비용 절감      |

#### 6.6. 추출 가능한 필드

**사업자등록증**:

- 상호/법인명
- 사업자등록번호 (000-00-00000)
- 대표자명
- 개업일자
- 사업장 소재지
- 업태/종목
- 법인 여부

**통장사본**:

- 은행명
- 계좌번호
- 예금주명

### 7. JWT 시크릿 설정

세션 관리를 위한 JWT 시크릿 생성:

```bash
# 안전한 랜덤 문자열 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

생성된 문자열을 `.env`에 저장:

```bash
JWT_SECRET=your-generated-secret-here
```

### 8. 개발 서버 실행

모든 설정이 완료되면 개발 서버를 실행합니다:

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 프로덕션 배포 설정

### 1. GitHub Secrets 설정

프로덕션 배포를 위해 GitHub Secrets에 환경변수를 등록해야 합니다.

#### 1.1. GitHub Secrets 등록 방법

1. GitHub 저장소 → "Settings" → "Secrets and variables" → "Actions"
2. "New repository secret" 클릭
3. 각 환경변수를 개별적으로 등록

#### 1.2. 필수 GitHub Secrets

**데이터베이스**:

- `AWS_DB_HOST`
- `AWS_DB_PORT`
- `AWS_DB_NAME`
- `AWS_DB_USER`
- `AWS_DB_PASSWORD`

**Google OAuth**:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (프로덕션 URL)
- `ALLOWED_DOMAINS`
- `ADMIN_EMAILS`

**JWT**:

- `JWT_SECRET`

**AWS S3**:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET_NAME`
- `AWS_S3_REGION`

**OCR (선택 사항)**:

- `OCR_ENGINE` (기본값: `openai`)
- `OPENAI_API_KEY` (OpenAI Vision 사용 시 필수)
- AWS Textract 사용 시 위 AWS 자격 증명 재사용

**파일 업로드**:

- `MAX_FILE_SIZE_MB`
- `ALLOWED_FILE_TYPES`

**기타**:

- `NODE_ENV=production`

### 2. CI/CD 파이프라인과 환경변수 연결

VWS는 GitHub Actions를 사용한 자동 배포를 지원합니다.

#### 2.1. GitHub Actions 워크플로우

`.github/workflows/ci-cd.yml` 파일에서 환경변수 설정:

```yaml
env:
  AWS_DB_HOST: ${{ secrets.AWS_DB_HOST }}
  AWS_DB_PORT: ${{ secrets.AWS_DB_PORT }}
  AWS_DB_NAME: ${{ secrets.AWS_DB_NAME }}
  AWS_DB_USER: ${{ secrets.AWS_DB_USER }}
  AWS_DB_PASSWORD: ${{ secrets.AWS_DB_PASSWORD }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
  GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
  # ... 기타 환경변수
```

#### 2.2. Docker 컨테이너로 환경변수 주입

GitHub Actions에서 Docker 실행 시 환경변수 전달:

```bash
docker run -d \
  -e AWS_DB_HOST=${{ secrets.AWS_DB_HOST }} \
  -e AWS_DB_PORT=${{ secrets.AWS_DB_PORT }} \
  -e JWT_SECRET=${{ secrets.JWT_SECRET }} \
  # ... 기타 환경변수
  -p 3000:3000 \
  your-image:tag
```

### 3. Nginx 설정 자동화

#### 3.1. 파일 업로드 설정

대용량 파일 업로드를 위한 Nginx 설정이 CI/CD에서 자동으로 적용됩니다:

```nginx
# /etc/nginx/conf.d/01-s3-cors.conf
client_max_body_size 100M;
client_body_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

#### 3.2. GitHub Actions에서 자동 적용

`.github/workflows/ci-cd.yml`의 배포 단계에서 자동으로 설정:

```yaml
- name: Configure Nginx for S3
  run: |
    # Nginx 설정 생성
    # Nginx 재시작
```

---

## 환경변수 전체 목록

### 필수 환경변수

| 변수명                  | 설명                       | 예시                                          |
| ----------------------- | -------------------------- | --------------------------------------------- |
| `AWS_DB_HOST`           | RDS 엔드포인트             | `db-viahub.xxx.rds.amazonaws.com`             |
| `AWS_DB_PORT`           | RDS 포트                   | `5432`                                        |
| `AWS_DB_NAME`           | 데이터베이스 이름          | `postgres`                                    |
| `AWS_DB_USER`           | 데이터베이스 사용자        | `postgres`                                    |
| `AWS_DB_PASSWORD`       | 데이터베이스 비밀번호      | `your-password`                               |
| `JWT_SECRET`            | JWT 토큰 시크릿            | `64-character-hex-string`                     |
| `GOOGLE_CLIENT_ID`      | Google OAuth 클라이언트 ID | `xxx.apps.googleusercontent.com`              |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth 비밀번호      | `GOCSPX-xxx`                                  |
| `GOOGLE_REDIRECT_URI`   | OAuth 리디렉션 URI         | `https://domain.com/api/auth/callback/google` |
| `ALLOWED_DOMAINS`       | 허용 이메일 도메인         | `viasofts.com`                                |
| `ADMIN_EMAILS`          | 관리자 이메일              | `admin@viasofts.com`                          |
| `AWS_ACCESS_KEY_ID`     | AWS 액세스 키              | `AKIA...`                                     |
| `AWS_SECRET_ACCESS_KEY` | AWS 시크릿 키              | `...`                                         |
| `AWS_S3_BUCKET_NAME`    | S3 버킷 이름               | `workstream-via`                              |
| `AWS_S3_REGION`         | S3 리전                    | `ap-northeast-2`                              |
| `OPENAI_API_KEY`        | OpenAI API 키 (OCR용)      | `sk-...` (선택, OCR 엔진이 OpenAI인 경우)     |

### 선택 환경변수 (기본값 있음)

| 변수명               | 설명                | 기본값                                            |
| -------------------- | ------------------- | ------------------------------------------------- |
| `NODE_ENV`           | 환경 모드           | `development`                                     |
| `MAX_FILE_SIZE_MB`   | 최대 파일 크기 (MB) | `100`                                             |
| `ALLOWED_FILE_TYPES` | 허용 파일 형식      | `.pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.hwp` |
| `OCR_ENGINE`         | OCR 엔진 선택       | `openai` (`openai` \| `textract`)                 |
| `LOG_LEVEL`          | 로그 레벨           | `info`                                            |

---

## 트러블슈팅

### 1. Google OAuth 로그인 실패

**증상**: "Error 400: redirect_uri_mismatch"

**원인**: Google Cloud Console의 승인된 리디렉션 URI가 일치하지 않음

**해결**:

1. Google Cloud Console → OAuth 2.0 클라이언트 ID 확인
2. 승인된 리디렉션 URI에 다음 추가:
   - `http://localhost:5173/api/auth/callback/google` (로컬)
   - `https://your-domain.com/api/auth/callback/google` (프로덕션)
3. `.env`의 `GOOGLE_REDIRECT_URI` 확인

---

### 2. 데이터베이스 연결 실패

**증상**: "Connection timed out" 또는 "ECONNREFUSED"

**가능한 원인**:

1. RDS 보안 그룹에 IP가 허용되지 않음
2. 잘못된 데이터베이스 자격 증명
3. RDS가 시작되지 않음

**해결**:

1. AWS Console → RDS → 보안 그룹 → 인바운드 규칙에 IP 추가
2. `.env` 파일의 데이터베이스 정보 확인
3. RDS 인스턴스 상태 확인

---

### 3. JWT 토큰 에러

**증상**: "JsonWebTokenError: invalid signature"

**원인**: `JWT_SECRET`이 변경되었거나 일치하지 않음

**해결**:

1. 브라우저 쿠키 삭제
2. 다시 로그인
3. 프로덕션 환경에서는 GitHub Secrets의 `JWT_SECRET` 확인

---

### 4. S3 파일 업로드 실패

**증상**: "403 Forbidden" 또는 "SignatureDoesNotMatch"

**가능한 원인**:

1. IAM 권한 부족
2. 잘못된 AWS 자격 증명
3. CORS 설정 문제

**해결**:

1. IAM 사용자에 S3 권한 확인 (PutObject, GetObject, DeleteObject)
2. `.env`의 `AWS_ACCESS_KEY_ID`와 `AWS_SECRET_ACCESS_KEY` 확인
3. S3 버킷 CORS 설정 확인
4. 개발 서버 재시작 (환경변수 변경 후)

---

### 5. 파일 크기 제한 에러

**증상**: "413 Payload Too Large"

**원인**: Nginx 또는 애플리케이션의 파일 크기 제한

**해결**:

1. `.env`에서 `MAX_FILE_SIZE_MB` 확인 및 증가
2. Nginx 설정 확인:
   ```bash
   # Nginx 설정 파일 확인
   grep client_max_body_size /etc/nginx/conf.d/*.conf
   ```
3. Nginx 재시작:
   ```bash
   sudo systemctl restart nginx
   ```

---

### 6. 환경변수가 적용되지 않음

**증상**: 환경변수를 변경했는데 적용되지 않음

**원인**: 개발 서버가 재시작되지 않음

**해결**:

1. 개발 서버 중지 (Ctrl+C)
2. 개발 서버 재시작: `npm run dev`
3. 프로덕션 환경: Docker 컨테이너 재시작

---

## 추가 정보

- [S3 설정 가이드](./S3_SETUP_GUIDE.md) - S3 상세 설정 가이드
- [RBAC 구현 계획](./RBAC_IMPLEMENTATION_PLAN.md) - 권한 시스템 문서
- [CI/CD 파이프라인](./ci-cd/CI_CD_PIPELINE.md) - 배포 자동화 문서

---

**문제가 해결되지 않으면 개발팀에 문의하세요.**
