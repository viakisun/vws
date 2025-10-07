# 엑셀 데이터를 SQL로 변환하는 방법

## 개요

자금일보 시스템에 엑셀 데이터를 업로드하는 방법을 안내합니다.

## 방법 1: 엑셀 수식으로 SQL 생성 (추천)

### 1단계: 엑셀 데이터 준비

#### 계좌 데이터 (Accounts 시트)

| 계좌명          | 계좌번호    | 은행코드 | 계좌타입 | 초기잔액 | 상태   | 설명   | 주계좌 | 생성일자   |
| --------------- | ----------- | -------- | -------- | -------- | ------ | ------ | ------ | ---------- |
| 하나은행 주거래 | 123-456-789 | HANA     | checking | 0        | active | 월급용 | TRUE   | 2024-01-01 |
| 전북은행 예금   | 987-654-321 | JEONBUK  | savings  | 0        | active | 예비금 | FALSE  | 2024-01-01 |

**은행코드 목록:**

- `HANA` - 하나은행
- `JEONBUK` - 전북은행
- `NH` - 농협은행
- `SHINHAN` - 신한은행
- `KB` - 국민은행
- `WOORI` - 우리은행
- `IBK` - 기업은행
- `SAEMAEUL` - 새마을금고

**계좌타입:**

- `checking` - 입출금 계좌
- `savings` - 저축예금
- `business` - 사업자 계좌
- `investment` - 투자 계좌
- `loan` - 대출 계좌

#### 거래 데이터 (Transactions 시트)

| 거래일시         | 계좌번호    | 카테고리명 | 거래유형 | 금액     | 설명          | 참조번호 | 메모       | 태그          | 상태      |
| ---------------- | ----------- | ---------- | -------- | -------- | ------------- | -------- | ---------- | ------------- | --------- |
| 2024-01-05 14:30 | 123-456-789 | 매출       | income   | 15000000 | 프로젝트 매출 | PRJ-001  | 1차 대금   | 매출,프로젝트 | completed |
| 2024-01-10 09:00 | 123-456-789 | 급여       | expense  | 3500000  | 직원 급여     | PAY-001  | 정규직 3명 | 급여,정기     | completed |

**카테고리명 목록 (기본):**

- **수입:** `매출`, `투자수익`, `기타수입`
- **지출:** `급여`, `임대료`, `공과금`, `마케팅`, `운영비`, `기타지출`

**거래유형:**

- `income` - 수입
- `expense` - 지출
- `transfer` - 이체
- `adjustment` - 조정

**상태:**

- `completed` - 완료
- `pending` - 대기
- `cancelled` - 취소
- `failed` - 실패

### 2단계: SQL 생성 수식 작성

#### 계좌 INSERT 문 생성 (I열에 수식 작성)

```excel
="('"&A2&"','"&B2&"',(SELECT id FROM banks WHERE code = '"&C2&"'),'"&D2&"',"&E2&",'"&F2&"','"&G2&"',"&IF(H2="TRUE","true","false")&",'"&I2&" 00:00:00+09'::timestamptz),"
```

#### 거래 INSERT 문 생성 (K열에 수식 작성)

```excel
="((SELECT id FROM accounts WHERE account_number = '"&B2&"'),(SELECT id FROM categories WHERE name = '"&C2&"'),"&E2&",'"&D2&"','"&F2&"','"&G2&"',NULL,'"&H2&"',ARRAY['"&SUBSTITUTE(I2,",","','")&"'],'"&A2&":00+09'::timestamptz,'"&J2&"',false,'admin','"&A2&":00+09'::timestamptz),"
```

### 3단계: SQL 파일 생성

1. 엑셀에서 생성된 SQL 문들을 모두 복사
2. `finance-data-init.sql` 파일을 열고 샘플 데이터를 교체
3. 마지막 행의 쉼표(`,`)를 세미콜론(`;`)으로 변경

### 4단계: SQL 실행

```bash
# PostgreSQL 데이터베이스에 직접 실행
psql -h [호스트] -U [사용자명] -d [데이터베이스명] -f finance-data-init.sql

# 또는 pgAdmin에서 Query Tool로 실행
```

---

## 방법 2: CSV를 통한 데이터 임포트

### 1단계: 엑셀을 CSV로 저장

- Excel에서 "다른 이름으로 저장" → CSV(쉼표로 구분) 선택
- `accounts.csv`, `transactions.csv` 두 파일로 저장

### 2단계: PostgreSQL COPY 명령 사용

```sql
-- 임시 테이블 생성
CREATE TEMP TABLE temp_accounts (
  name VARCHAR(200),
  account_number VARCHAR(50),
  bank_code VARCHAR(20),
  account_type VARCHAR(20),
  balance DECIMAL(15,2),
  status VARCHAR(20),
  description TEXT,
  is_primary BOOLEAN
);

CREATE TEMP TABLE temp_transactions (
  transaction_datetime VARCHAR(50),
  account_number VARCHAR(50),
  category_name VARCHAR(100),
  type VARCHAR(20),
  amount DECIMAL(15,2),
  description TEXT,
  reference VARCHAR(100),
  notes TEXT,
  tags TEXT,
  status VARCHAR(20)
);

-- CSV 파일 임포트
\COPY temp_accounts FROM '/path/to/accounts.csv' WITH (FORMAT CSV, HEADER true, ENCODING 'UTF8');
\COPY temp_transactions FROM '/path/to/transactions.csv' WITH (FORMAT CSV, HEADER true, ENCODING 'UTF8');

-- 실제 테이블에 데이터 삽입
INSERT INTO finance_accounts (name, account_number, bank_id, account_type, balance, status, description, is_primary)
SELECT
  ta.name,
  ta.account_number,
  (SELECT id FROM finance_banks WHERE code = ta.bank_code),
  ta.account_type,
  ta.balance,
  ta.status,
  ta.description,
  ta.is_primary
FROM temp_accounts ta
ON CONFLICT (bank_id, account_number) DO NOTHING;

INSERT INTO finance_transactions (account_id, category_id, amount, type, description, reference, notes, tags, transaction_date, status)
SELECT
  (SELECT id FROM finance_accounts WHERE account_number = tt.account_number),
  (SELECT id FROM finance_categories WHERE name = tt.category_name),
  tt.amount,
  tt.type,
  tt.description,
  tt.reference,
  tt.notes,
  string_to_array(tt.tags, ','),
  tt.transaction_datetime::timestamptz,
  tt.status
FROM temp_transactions tt;

-- 계좌 잔액 재계산
UPDATE finance_accounts a
SET balance = COALESCE((
  SELECT SUM(
    CASE
      WHEN t.type = 'income' THEN t.amount
      WHEN t.type = 'expense' THEN -t.amount
      ELSE 0
    END
  )
  FROM finance_transactions t
  WHERE t.account_id = a.id AND t.status = 'completed'
), 0);
```

---

## 방법 3: Node.js 스크립트로 변환 (대용량 데이터용)

### 엑셀을 JSON으로 변환 후 SQL 생성

```javascript
// convert-excel-to-sql.js
import xlsx from 'xlsx'
import fs from 'fs'

// 엑셀 파일 읽기
const workbook = xlsx.readFile('finance-data.xlsx')

// 계좌 시트
const accountsSheet = workbook.Sheets['Accounts']
const accounts = xlsx.utils.sheet_to_json(accountsSheet)

// 거래 시트
const transactionsSheet = workbook.Sheets['Transactions']
const transactions = xlsx.utils.sheet_to_json(transactionsSheet)

// SQL 생성
let sql = `-- 자동 생성된 SQL 파일\n\n`

// 계좌 INSERT
sql += `WITH banks AS (SELECT id, code FROM finance_banks)\n`
sql += `INSERT INTO finance_accounts (name, account_number, bank_id, account_type, balance, status, description, is_primary, created_at)\n`
sql += `SELECT * FROM (VALUES\n`

accounts.forEach((acc, idx) => {
  sql += `  ('${acc.계좌명}','${acc.계좌번호}',(SELECT id FROM banks WHERE code = '${acc.은행코드}'),'${acc.계좌타입}',${acc.초기잔액},'${acc.상태}','${acc.설명}',${acc.주계좌},'${acc.생성일자} 00:00:00+09'::timestamptz)${idx === accounts.length - 1 ? '' : ','}\n`
})

sql += `) AS t(name, account_number, bank_id, account_type, balance, status, description, is_primary, created_at)\n`
sql += `ON CONFLICT (bank_id, account_number) DO NOTHING;\n\n`

// 거래 INSERT
sql += `WITH accounts AS (SELECT id, account_number FROM finance_accounts),\n`
sql += `     categories AS (SELECT id, name FROM finance_categories)\n`
sql += `INSERT INTO finance_transactions (account_id, category_id, amount, type, description, reference, notes, tags, transaction_date, status, created_by, created_at)\n`
sql += `SELECT * FROM (VALUES\n`

transactions.forEach((tr, idx) => {
  const tags = tr.태그 ? `ARRAY['${tr.태그.split(',').join("','")}']` : 'ARRAY[]::text[]'
  sql += `  ((SELECT id FROM accounts WHERE account_number = '${tr.계좌번호}'),(SELECT id FROM categories WHERE name = '${tr.카테고리명}'),${tr.금액},'${tr.거래유형}','${tr.설명}','${tr.참조번호}','${tr.메모}',${tags},'${tr.거래일시}:00+09'::timestamptz,'${tr.상태}','admin','${tr.거래일시}:00+09'::timestamptz)${idx === transactions.length - 1 ? '' : ','}\n`
})

sql += `) AS t(account_id, category_id, amount, type, description, reference, notes, tags, transaction_date, status, created_by, created_at);\n`

// 파일로 저장
fs.writeFileSync('finance-data-generated.sql', sql, 'utf8')
console.log('SQL 파일이 생성되었습니다: finance-data-generated.sql')
```

**실행 방법:**

```bash
npm install xlsx
node convert-excel-to-sql.js
```

---

## 샘플 엑셀 템플릿

아래 형식으로 엑셀 파일을 작성하세요:

### Accounts 시트

```
| A: 계좌명 | B: 계좌번호 | C: 은행코드 | D: 계좌타입 | E: 초기잔액 | F: 상태 | G: 설명 | H: 주계좌 | I: 생성일자 |
```

### Transactions 시트

```
| A: 거래일시 | B: 계좌번호 | C: 카테고리명 | D: 거래유형 | E: 금액 | F: 설명 | G: 참조번호 | H: 메모 | I: 태그 | J: 상태 |
```

---

## 주의사항

1. **데이터 백업**: 기존 데이터를 덮어쓰기 전에 반드시 백업하세요.
2. **외래키 제약**: 계좌 데이터를 먼저 입력한 후 거래 데이터를 입력하세요.
3. **날짜 형식**: `YYYY-MM-DD HH:MM` 또는 `YYYY-MM-DD HH:MM:SS` 형식을 사용하세요.
4. **금액 형식**: 쉼표 없이 숫자만 입력하세요 (예: `1500000`)
5. **특수문자**: 작은따옴표(`'`)가 포함된 경우 두 개로 표시하세요 (`''`)
6. **잔액 계산**: 초기 잔액을 0으로 설정하고, 거래 내역으로 자동 계산되도록 하는 것을 권장합니다.

---

## 트러블슈팅

### 오류: "은행을 찾을 수 없습니다"

→ 은행 코드가 올바른지 확인하세요. `SELECT * FROM finance_banks;`로 사용 가능한 은행 목록 확인.

### 오류: "카테고리를 찾을 수 없습니다"

→ 카테고리명이 정확한지 확인하세요. `SELECT * FROM finance_categories;`로 카테고리 목록 확인.

### 오류: "잔액이 맞지 않습니다"

→ 4단계의 잔액 재계산 쿼리를 실행하세요.

---

## 추가 도움말

더 많은 정보가 필요하시면:

1. `finance-data-init.sql` 파일의 샘플 데이터를 참고하세요.
2. `/api/finance/setup` API를 통해 기본 데이터 구조를 확인하세요.
