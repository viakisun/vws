-- 운영통장의 직원 급여 거래 적요 업데이트
UPDATE finance_transactions 
SET description = EXTRACT(MONTH FROM transaction_date) || '월급여-' || counterparty
WHERE account_id = '968ed1f6-1096-4cf5-9c5e-cbfcf846724e'
  AND counterparty IS NOT NULL 
  AND counterparty ~ '^[가-힣]{2,4}$'
  AND description NOT LIKE '%급여%'
  AND amount::numeric < 0;

-- 업데이트된 결과 확인
SELECT id, description, counterparty, transaction_date, amount
FROM finance_transactions 
WHERE account_id = '968ed1f6-1096-4cf5-9c5e-cbfcf846724e'
  AND description LIKE '%급여%'
ORDER BY transaction_date DESC;
