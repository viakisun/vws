// Node.js 내장 fetch 사용

const API_BASE = 'http://localhost:5173/api';

async function addNoDepartment() {
    try {
        const response = await fetch(`${API_BASE}/departments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: '부서없음',
                description: '부서가 배정되지 않은 직원들을 위한 부서',
                level: 0, // 최하위 레벨
                is_active: true
            })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('✅ 부서없음 부서가 성공적으로 추가되었습니다.');
            console.log(`📋 부서 ID: ${result.data.id}`);
        } else {
            console.log(`❌ 부서 추가 실패: ${result.error}`);
        }
        return result.success;
    } catch (error) {
        console.error('Error adding department:', error);
        return false;
    }
}

async function main() {
    console.log('🔄 부서없음 부서 추가 시작...');
    
    const success = await addNoDepartment();
    
    if (success) {
        console.log('✅ 부서없음 부서 추가 완료!');
    } else {
        console.log('❌ 부서없음 부서 추가 실패!');
    }
}

main().catch(console.error);
