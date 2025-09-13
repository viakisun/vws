// Excel 파일 업로드 테스트
import fs from 'fs';
import FormData from 'form-data';

async function testUpload() {
    try {
        // 테스트용 CSV 데이터 생성
        const csvContent = `이름,이메일,전화번호,부서,직급,급여,입사일,상태,기술스택
박기선,kisun@viasoft.ai,010-1234-5678,경영기획팀,대표,5000000,2024-01-01,active,다 하지 뭐
이은서,eunseo@viasoft.ai,010-2345-6789,경영기획팀,팀장,4500000,2024-02-01,active,Design Marketing`;

        // CSV 파일 생성
        fs.writeFileSync('test-employees.csv', csvContent, 'utf8');
        
        // FormData 생성
        const formData = new FormData();
        formData.append('file', fs.createReadStream('test-employees.csv'), {
            filename: 'test-employees.csv',
            contentType: 'text/csv'
        });

        // API 호출
        const response = await fetch('http://localhost:5173/api/employees/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        console.log('Response status:', response.status);
        console.log('Response body:', result);

        // 테스트 파일 삭제
        fs.unlinkSync('test-employees.csv');
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

testUpload();
