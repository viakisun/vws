// Node.js 내장 fetch 사용

const API_BASE = 'http://localhost:5173/api';

// 직급별 부서 매핑 (연구원들은 연구 관련 부서로)
const positionToDepartmentMap = {
    '연구원': 'PSR팀',
    '책임연구원': 'PSR팀', 
    '선임연구원': 'PSR팀',
    '주임연구원': 'PSR팀',
    '연구소장': '연구소',
    'CTO': '연구소',
    'CEO': '대표',
    'CFO': '전략기획실',
    '상무': '전략기획실',
    'Managing Director': '전략기획실',
    'Director': '전략기획실',
    'Team Lead': 'PSR팀',
    'Manager': 'PSR팀',
    'Senior Manager': 'PSR팀',
    '선임디자이너': 'GRIT팀',
    '디자이너': 'GRIT팀',
    '행정원': '경영지원팀',
    '인사담당': '경영지원팀',
    '경영지원담당': '경영지원팀',
    '회계담당': '경영지원팀',
    '총무담당': '경영지원팀',
    '회계팀장': '경영지원팀',
    '총무팀장': '경영지원팀',
    '인사팀장': '경영지원팀',
    '경영지원팀장': '경영지원팀',
    '대표': '대표',
    '전략기획실': '전략기획실'
};

async function getEmployees() {
    try {
        const response = await fetch(`${API_BASE}/employees?status=all`);
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching employees:', error);
        return [];
    }
}

async function updateEmployeeDepartment(employee, newDepartment) {
    try {
        const response = await fetch(`${API_BASE}/employees`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: employee.id,
                department: newDepartment,
                // 기존 데이터 유지
                first_name: employee.first_name,
                last_name: employee.last_name, 
                email: employee.email,
                position: employee.position,
                salary: employee.salary || 0,
                phone: employee.phone || '',
                hire_date: employee.hire_date,
                birth_date: employee.birth_date,
                termination_date: employee.termination_date,
                status: employee.status,
                employment_type: employee.employment_type || 'full-time',
                job_title_id: employee.job_title_id
            })
        });
        
        const result = await response.json();
        if (!result.success) {
            console.log(`❌ API 오류: ${result.error}`);
        }
        return result.success;
    } catch (error) {
        console.error('Error updating employee:', error);
        return false;
    }
}

async function main() {
    console.log('🔄 직원 부서 정보 업데이트 시작...');
    
    const employees = await getEmployees();
    
    if (employees.length === 0) {
        console.error('❌ 직원 데이터를 가져올 수 없습니다.');
        return;
    }
    
    // 부서가 "부서없음"인 직원들 필터링
    const employeesWithoutDepartment = employees.filter(emp => emp.department === '부서없음');
    
    console.log(`📊 총 ${employees.length}명의 직원 중 부서가 없는 직원: ${employeesWithoutDepartment.length}명`);
    
    if (employeesWithoutDepartment.length === 0) {
        console.log('✅ 모든 직원이 적절한 부서에 배정되어 있습니다.');
        return;
    }
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const employee of employeesWithoutDepartment) {
        const position = employee.position;
        const jobTitleName = employee.job_title_name;
        
        // 직급명 또는 직책명으로 부서 결정
        let newDepartment = positionToDepartmentMap[position] || positionToDepartmentMap[jobTitleName];
        
        if (!newDepartment) {
            console.log(`⚠️  매핑되지 않은 직급/직책: ${employee.first_name} ${employee.last_name} - ${position} (${jobTitleName})`);
            skippedCount++;
            continue;
        }
        
        console.log(`🔄 업데이트 중: ${employee.first_name} ${employee.last_name} - ${position} → ${newDepartment}`);
        
        const success = await updateEmployeeDepartment(employee, newDepartment);
        if (success) {
            updatedCount++;
            console.log(`✅ 성공: ${employee.first_name} ${employee.last_name}`);
        } else {
            console.log(`❌ 실패: ${employee.first_name} ${employee.last_name}`);
        }
        
        // API 호출 간격 조절
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📈 업데이트 완료!');
    console.log(`✅ 업데이트된 직원: ${updatedCount}명`);
    console.log(`⚠️  건너뛴 직원: ${skippedCount}명`);
    console.log(`📊 총 처리된 직원: ${updatedCount + skippedCount}명`);
}

main().catch(console.error);
