#!/bin/bash

# Route53 도메인 설정 스크립트
set -e

# 설정 변수
DOMAIN="viahub.dev"
SUBDOMAIN="ws"
FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
REGION="ap-northeast-2"

echo "🌐 Route53 도메인 설정 시작..."
echo "도메인: ${FULL_DOMAIN}"
echo "리전: ${REGION}"

# 1. 호스팅 영역 확인
echo "📋 호스팅 영역 확인 중..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='${DOMAIN}.'].Id" --output text | sed 's|/hostedzone/||')

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "❌ ${DOMAIN} 호스팅 영역을 찾을 수 없습니다."
    echo "Route53에서 호스팅 영역을 먼저 생성해주세요."
    exit 1
fi

echo "✅ 호스팅 영역 ID: ${HOSTED_ZONE_ID}"

# 2. EC2 인스턴스 IP 확인
echo "🖥️ EC2 인스턴스 IP 확인 중..."
read -p "EC2 인스턴스의 퍼블릭 IP를 입력하세요: " EC2_IP

if [ -z "$EC2_IP" ]; then
    echo "❌ IP 주소를 입력해주세요."
    exit 1
fi

echo "✅ EC2 IP: ${EC2_IP}"

# 3. DNS 레코드 생성
echo "📝 DNS A 레코드 생성 중..."

# 변경 배치 파일 생성
cat > dns-change.json << EOF
{
    "Comment": "Create A record for ${FULL_DOMAIN}",
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "${FULL_DOMAIN}",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "${EC2_IP}"
                    }
                ]
            }
        }
    ]
}
EOF

# DNS 레코드 변경 실행
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id "${HOSTED_ZONE_ID}" \
    --change-batch file://dns-change.json \
    --query 'ChangeInfo.Id' \
    --output text)

echo "✅ DNS 변경 요청 ID: ${CHANGE_ID}"

# 4. 변경 상태 확인
echo "⏳ DNS 변경 상태 확인 중..."
aws route53 wait resource-record-sets-changed --id "${CHANGE_ID}"

echo "🎉 DNS 설정이 완료되었습니다!"
echo "도메인: https://${FULL_DOMAIN}"
echo ""
echo "⚠️ DNS 전파에는 몇 분에서 몇 시간이 걸릴 수 있습니다."
echo "다음 명령어로 확인하세요:"
echo "nslookup ${FULL_DOMAIN}"

# 5. 임시 파일 정리
rm -f dns-change.json

echo ""
echo "🔧 다음 단계:"
echo "1. SSL 인증서 설정 (Let's Encrypt)"
echo "2. Nginx 리버스 프록시 설정"
echo "3. 도메인 연결 테스트"
